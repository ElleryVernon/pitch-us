import { ApiError } from "@/models/errors";
import { NextRequest, NextResponse } from "next/server";
import puppeteer, { Browser, ElementHandle, Page } from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { getChromiumExecutablePath } from "@/server/chromium";
import {
  ElementAttributes,
  SlideAttributesResult,
} from "@/types/element-attributes";
import { convertElementAttributesToPptxSlides } from "@/utils/pptx-models-utils";
import { PptxPresentationModel } from "@/types/pptx-models";
import fs from "fs";
import nodePath from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { getTempDirectory } from "@/server/storage";
import {
  isSupabaseEnabled,
  uploadSupabaseFileAndGetPublicUrl,
} from "@/server/supabase-storage";

/**
 * Arguments for recursively extracting element attributes from DOM.
 *
 * Used when traversing the DOM tree to extract styling and positioning
 * information for each element. Inherited properties are passed down
 * the tree to handle CSS inheritance correctly.
 */
interface GetAllChildElementsAttributesArgs {
  element: ElementHandle<Element>;
  rootRect?: {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null;
  depth?: number;
  inheritedFont?: ElementAttributes["font"];
  inheritedBackground?: ElementAttributes["background"];
  inheritedBorderRadius?: number[];
  inheritedZIndex?: number;
  inheritedOpacity?: number;
  screenshotsDir: string | null;
}

/**
 * Handles GET requests to export a presentation as a PPTX model.
 *
 * This is a complex endpoint that uses Puppeteer to:
 * 1. Render the presentation in a headless browser
 * 2. Extract DOM elements and their computed styles
 * 3. Convert visual elements to structured PPTX model data
 * 4. Handle special cases (charts, tables, images, SVG)
 * 5. Generate a complete PPTX presentation model
 *
 * The process:
 * - Launches headless Chrome and navigates to the presentation
 * - Extracts all slide elements with their styling (fonts, colors, positions)
 * - Converts complex elements (SVG, canvas, tables) to screenshots if needed
 * - Extracts native chart/table data when available
 * - Scales coordinates to standard slide size (1280x720)
 * - Converts element attributes to PPTX model format
 *
 * Query parameters:
 * - `id` (required): Unique identifier of the presentation to export
 *
 * Special handling:
 * - Charts with data-chart-* attributes: Converted to native PPTX charts
 * - Tables with data-table-* attributes: Converted to native PPTX tables
 * - SVG/Canvas elements: Screenshot and embedded as images
 * - Text elements: Extracted with full styling (font, color, size, etc.)
 *
 * @param request - The HTTP request object containing presentation ID in query params.
 * @returns A JSON response containing a PptxPresentationModel object with:
 *   - `slides`: Array of slide objects, each containing:
 *     - Elements with styling, positioning, and content data
 *     - Native chart/table data when applicable
 *     - Screenshot URLs for complex visual elements
 *
 * @throws Returns error responses for:
 *   - 400: Missing presentation ID or API errors
 *   - 500: Browser launch failed, DOM extraction failed, or conversion errors
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/exports/pptx-model?id=abc-123
 * // Response: { slides: [{ elements: [...], backgroundColor: "#ffffff" }, ...] }
 * ```
 */
export async function GET(request: NextRequest) {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    const id = await getPresentationId(request);
    [browser, page] = await getBrowserAndPage(id);
    const screenshotsDir = getScreenshotsDir();

    const { slides, speakerNotes } = await getSlidesAndSpeakerNotes(page);

    // REMOVED: Background screenshot capture
    // Previously we captured the entire slide as a background image, which
    // prevented native element rendering. Now we rely on native PPTX elements
    // for proper editing support in PowerPoint.
    // const backgroundImages = await captureSlideBackgrounds(slides, id, screenshotsDir);

    const slides_attributes = await getSlidesAttributes(slides, screenshotsDir);
    await postProcessSlidesAttributes(
      slides_attributes,
      screenshotsDir,
      speakerNotes,
    );

    // Don't set backgroundImage - let native elements render
    // slides_attributes.forEach((slideAttributes, index) => {
    //   slideAttributes.backgroundImage = backgroundImages[index];
    // });

    const slides_pptx_models =
      convertElementAttributesToPptxSlides(slides_attributes);
    const presentation_pptx_model: PptxPresentationModel = {
      slides: slides_pptx_models,
    };

    await closeBrowserAndPage(browser, page);

    return NextResponse.json(presentation_pptx_model);
  } catch (error: any) {
    console.error(error);
    await closeBrowserAndPage(browser, page);
    if (error instanceof ApiError) {
      return NextResponse.json(error, { status: 400 });
    }
    return NextResponse.json(
      { detail: `Internal server error: ${error.message}` },
      { status: 500 },
    );
  }
}

/**
 * Extracts the presentation ID from the request query parameters.
 *
 * @param request - The HTTP request object containing query parameters.
 * @returns The presentation ID string.
 * @throws ApiError if the ID parameter is missing.
 */
async function getPresentationId(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    throw new ApiError("Presentation ID not found");
  }
  return id;
}

/**
 * Launches a headless browser and navigates to the presentation's PDF maker page.
 *
 * Configures Puppeteer with serverless-optimized settings and navigates to
 * the page that renders the presentation. The page is then used to extract
 * DOM elements and their styling.
 *
 * @param id - The unique identifier of the presentation to render.
 * @returns A tuple containing the browser instance and page instance.
 *   Both should be closed when done to free resources.
 */
async function getBrowserAndPage(id: string): Promise<[Browser, Page]> {
  const executablePath = await getChromiumExecutablePath();

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      ...chromium.args,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-web-security",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-features=TranslateUI",
      "--disable-ipc-flooding-protection",
    ],
  });

  const page = await browser.newPage();

  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  page.setDefaultNavigationTimeout(300000);
  page.setDefaultTimeout(300000);

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  await page.goto(`${baseUrl}/pdf-maker?id=${id}`, {
    waitUntil: "networkidle0",
    timeout: 300000,
  });
  return [browser, page];
}

/**
 * Closes the browser and page instances to free resources.
 *
 * Always call this in a finally block to ensure cleanup even if errors occur.
 *
 * @param browser - The browser instance to close, or null if not initialized.
 * @param page - The page instance to close, or null if not initialized.
 */
async function closeBrowserAndPage(browser: Browser | null, page: Page | null) {
  await page?.close();
  await browser?.close();
}

/**
 * Gets or creates the screenshots directory for storing element screenshots.
 *
 * Returns null if Supabase is enabled (screenshots uploaded to cloud storage instead).
 * Otherwise, creates and returns the local screenshots directory path.
 *
 * @returns The path to the screenshots directory, or null if using Supabase.
 */
function getScreenshotsDir(): string | null {
  if (isSupabaseEnabled()) {
    return null;
  }
  const tempDir = getTempDirectory();
  const screenshotsDir = nodePath.join(tempDir, "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  return screenshotsDir;
}

/**
 * Post-processes slide attributes by generating screenshots and adding speaker notes.
 *
 * For elements marked with should_screenshot=true (SVG, canvas, complex tables),
 * this function takes screenshots and replaces the element reference with an image URL.
 * Also attaches speaker notes to each slide.
 *
 * @param slidesAttributes - Array of slide attribute results to process.
 * @param screenshotsDir - Directory for saving screenshots (null if using Supabase).
 * @param speakerNotes - Array of speaker note strings, one per slide.
 */
async function postProcessSlidesAttributes(
  slidesAttributes: SlideAttributesResult[],
  screenshotsDir: string | null,
  speakerNotes: string[],
) {
  for (const [index, slideAttributes] of slidesAttributes.entries()) {
    for (const element of slideAttributes.elements) {
      if (element.should_screenshot) {
        const screenshotUrl = await screenshotElement(element, screenshotsDir);
        element.imageSrc = screenshotUrl;
        element.should_screenshot = false;
        element.objectFit = "cover";
        element.element = undefined;
      }
    }
    slideAttributes.speakerNote = speakerNotes[index];
  }
}

/**
 * Saves a screenshot buffer to storage and returns its URL.
 *
 * Handles both local filesystem and Supabase storage. For Supabase, uploads
 * to the screenshots bucket and returns a public URL. For local, saves to
 * the screenshots directory and returns the file path.
 *
 * @param buffer - PNG image buffer from Puppeteer screenshot.
 * @param screenshotsDir - Local directory for screenshots (null if using Supabase).
 * @returns Promise that resolves to the URL or path of the saved screenshot.
 */
async function saveScreenshotBuffer(
  buffer: Buffer,
  screenshotsDir: string | null,
): Promise<string> {
  const filename = `${uuidv4()}.png`;
  if (isSupabaseEnabled()) {
    const storagePath = `screenshots/${filename}`;
    return uploadSupabaseFileAndGetPublicUrl({
      path: storagePath,
      data: buffer,
      contentType: "image/png",
      upsert: true,
    });
  }
  if (!screenshotsDir) {
    throw new ApiError("Screenshots directory not available");
  }
  const localPath = nodePath.join(screenshotsDir, filename);
  fs.writeFileSync(localPath, buffer);
  return localPath;
}

async function saveBackgroundBuffer(
  buffer: Buffer,
  presentationId: string,
  slideIndex: number,
  screenshotsDir: string | null,
): Promise<string> {
  const filename = `${slideIndex + 1}.png`;
  if (isSupabaseEnabled()) {
    const storagePath = `backgrounds/${presentationId}/${filename}`;
    return uploadSupabaseFileAndGetPublicUrl({
      path: storagePath,
      data: buffer,
      contentType: "image/png",
      upsert: true,
    });
  }
  if (!screenshotsDir) {
    throw new ApiError("Screenshots directory not available");
  }
  const backgroundDir = nodePath.join(
    screenshotsDir,
    "backgrounds",
    presentationId,
  );
  if (!fs.existsSync(backgroundDir)) {
    fs.mkdirSync(backgroundDir, { recursive: true });
  }
  const localPath = nodePath.join(backgroundDir, filename);
  fs.writeFileSync(localPath, buffer);
  return localPath;
}

async function hideSlideText(slide: ElementHandle<Element>) {
  await slide.evaluate((root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!node.textContent || !node.textContent.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const elements = new Set<HTMLElement>();
    let currentNode: Node | null = walker.nextNode();
    while (currentNode) {
      const parent = currentNode.parentElement;
      if (parent) {
        if (!parent.closest("svg")) {
          elements.add(parent);
        }
      }
      currentNode = walker.nextNode();
    }

    elements.forEach((el) => {
      if (el.hasAttribute("data-pptx-text-hidden")) return;
      el.setAttribute("data-pptx-text-hidden", "1");
      el.setAttribute("data-pptx-prev-color", el.style.color || "");
      el.setAttribute(
        "data-pptx-prev-webkit-text-fill-color",
        (el.style as CSSStyleDeclaration & { webkitTextFillColor?: string })
          .webkitTextFillColor || "",
      );
      el.setAttribute(
        "data-pptx-prev-text-decoration-color",
        el.style.textDecorationColor || "",
      );
      el.setAttribute(
        "data-pptx-prev-webkit-text-stroke-color",
        (el.style as CSSStyleDeclaration & { webkitTextStrokeColor?: string })
          .webkitTextStrokeColor || "",
      );
      el.setAttribute(
        "data-pptx-prev-webkit-text-stroke-width",
        (el.style as CSSStyleDeclaration & { webkitTextStrokeWidth?: string })
          .webkitTextStrokeWidth || "",
      );
      el.setAttribute("data-pptx-prev-text-shadow", el.style.textShadow || "");
      el.setAttribute("data-pptx-prev-caret-color", el.style.caretColor || "");
      el.style.color = "transparent";
      (
        el.style as CSSStyleDeclaration & { webkitTextFillColor?: string }
      ).webkitTextFillColor = "transparent";
      el.style.textDecorationColor = "transparent";
      (
        el.style as CSSStyleDeclaration & { webkitTextStrokeColor?: string }
      ).webkitTextStrokeColor = "transparent";
      (
        el.style as CSSStyleDeclaration & { webkitTextStrokeWidth?: string }
      ).webkitTextStrokeWidth = "0px";
      el.style.textShadow = "none";
      el.style.caretColor = "transparent";
    });
  });
}

async function restoreSlideText(slide: ElementHandle<Element>) {
  await slide.evaluate((root) => {
    const hiddenElements = root.querySelectorAll<HTMLElement>(
      "[data-pptx-text-hidden]",
    );
    hiddenElements.forEach((el) => {
      el.style.color = el.getAttribute("data-pptx-prev-color") || "";
      (
        el.style as CSSStyleDeclaration & { webkitTextFillColor?: string }
      ).webkitTextFillColor =
        el.getAttribute("data-pptx-prev-webkit-text-fill-color") || "";
      el.style.textDecorationColor =
        el.getAttribute("data-pptx-prev-text-decoration-color") || "";
      (
        el.style as CSSStyleDeclaration & { webkitTextStrokeColor?: string }
      ).webkitTextStrokeColor =
        el.getAttribute("data-pptx-prev-webkit-text-stroke-color") || "";
      (
        el.style as CSSStyleDeclaration & { webkitTextStrokeWidth?: string }
      ).webkitTextStrokeWidth =
        el.getAttribute("data-pptx-prev-webkit-text-stroke-width") || "";
      el.style.textShadow = el.getAttribute("data-pptx-prev-text-shadow") || "";
      el.style.caretColor = el.getAttribute("data-pptx-prev-caret-color") || "";
      el.removeAttribute("data-pptx-text-hidden");
      el.removeAttribute("data-pptx-prev-color");
      el.removeAttribute("data-pptx-prev-webkit-text-fill-color");
      el.removeAttribute("data-pptx-prev-text-decoration-color");
      el.removeAttribute("data-pptx-prev-webkit-text-stroke-color");
      el.removeAttribute("data-pptx-prev-webkit-text-stroke-width");
      el.removeAttribute("data-pptx-prev-text-shadow");
      el.removeAttribute("data-pptx-prev-caret-color");
    });
  });
}

async function captureSlideBackgrounds(
  slides: ElementHandle<Element>[],
  presentationId: string,
  screenshotsDir: string | null,
): Promise<string[]> {
  const results: string[] = [];
  for (let index = 0; index < slides.length; index += 1) {
    const slide = slides[index];
    await hideSlideText(slide);
    await slide.evaluate(
      () =>
        new Promise((resolve) => requestAnimationFrame(() => resolve(null))),
    );
    const screenshot = await slide.screenshot({ type: "png" });
    await restoreSlideText(slide);
    if (!screenshot) {
      throw new ApiError("Failed to capture slide background");
    }
    const savedPath = await saveBackgroundBuffer(
      Buffer.from(screenshot),
      presentationId,
      index,
      screenshotsDir,
    );
    results.push(savedPath);
  }
  return results;
}

/**
 * Takes a screenshot of a single DOM element.
 *
 * For complex elements that can't be represented as native PPTX elements
 * (SVG, canvas, complex tables), this function captures them as images.
 * The screenshot is then embedded in the PPTX as an image element.
 *
 * Process:
 * - SVG: Converts SVG HTML to PNG using Sharp library
 * - Other elements: Hides all other elements, screenshots the target, restores visibility
 *
 * @param element - Element attributes object containing the Puppeteer element handle.
 * @param screenshotsDir - Directory for saving screenshots (null if using Supabase).
 * @returns Promise that resolves to the URL or path of the saved screenshot.
 * @throws ApiError if screenshot capture fails.
 */
async function screenshotElement(
  element: ElementAttributes,
  screenshotsDir: string | null,
): Promise<string> {
  // For SVG elements, use convertSvgToPng (more reliable than Puppeteer screenshot)
  if (element.tagName === "svg") {
    const pngBuffer = await convertSvgToPng(element);
    return saveScreenshotBuffer(pngBuffer, screenshotsDir);
  }

  // Hide all elements except the target element and its ancestors
  // This ensures a clean screenshot without overlapping elements
  await element.element?.evaluate(
    (el: Element) => {
      const originalOpacities = new Map<Element, string>();

      const hideAllExcept = (targetElement: Element) => {
        const allElements = document.querySelectorAll("*");

        allElements.forEach((elem) => {
          const computedStyle = window.getComputedStyle(elem);
          originalOpacities.set(elem, computedStyle.opacity);

          if (
            targetElement === elem ||
            targetElement.contains(elem) ||
            elem.contains(targetElement)
          ) {
            (elem as HTMLElement).style.opacity = computedStyle.opacity || "1";
            return;
          }

          (elem as HTMLElement).style.opacity = "0";
        });
      };

      hideAllExcept(el);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (el as any).__restoreStyles = () => {
        originalOpacities.forEach((opacity, elem) => {
          (elem as HTMLElement).style.opacity = opacity;
        });
      };
    },
    element.opacity,
    element.font?.color,
  );

  const screenshot = await element.element?.screenshot();
  if (!screenshot) {
    throw new ApiError("Failed to screenshot element");
  }

  await element.element?.evaluate((el: Element) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((el as any).__restoreStyles) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (el as any).__restoreStyles();
    }
  });

  return saveScreenshotBuffer(Buffer.from(screenshot), screenshotsDir);
}

/**
 * Converts an SVG element to a PNG image buffer.
 *
 * Extracts the SVG's HTML, applies computed font color, and uses Sharp
 * to render it as a PNG at the element's actual size. This provides
 * better quality than Puppeteer screenshots for SVG elements.
 *
 * @param element_attibutes - Element attributes containing the SVG element handle
 *   and position information.
 * @returns Promise that resolves to a PNG image buffer.
 */
const convertSvgToPng = async (element_attibutes: ElementAttributes) => {
  const svgHtml =
    (await element_attibutes.element?.evaluate((el: Element) => {
      // Apply font color
      const fontColor = window.getComputedStyle(el).color;
      (el as HTMLElement).style.color = fontColor;

      return el.outerHTML;
    })) || "";

  const svgBuffer = Buffer.from(svgHtml);
  const pngBuffer = await sharp(svgBuffer)
    .resize(
      Math.round(element_attibutes.position!.width!),
      Math.round(element_attibutes.position!.height!),
    )
    .toFormat("png")
    .toBuffer();
  return pngBuffer;
};

/**
 * Extracts attributes from all slides in the presentation.
 *
 * Processes each slide's DOM to extract element attributes including styling,
 * positioning, content, and special data (charts, tables). Returns structured
 * data ready for PPTX model conversion.
 *
 * @param slides - Array of Puppeteer element handles, one per slide.
 * @param screenshotsDir - Directory for saving screenshots (null if using Supabase).
 * @returns Promise that resolves to an array of slide attribute results.
 */
async function getSlidesAttributes(
  slides: ElementHandle<Element>[],
  screenshotsDir: string | null,
): Promise<SlideAttributesResult[]> {
  const slideAttributes = await Promise.all(
    slides.map((slide) =>
      getAllChildElementsAttributes({ element: slide, screenshotsDir }),
    ),
  );
  return slideAttributes;
}

async function getSlidesAndSpeakerNotes(page: Page) {
  const slides_wrapper = await getSlidesWrapper(page);
  const speakerNotes = await getSpeakerNotes(slides_wrapper);
  const slides = await slides_wrapper.$$(":scope > div > div");
  return { slides, speakerNotes };
}

async function getSlidesWrapper(page: Page): Promise<ElementHandle<Element>> {
  const slides_wrapper = await page.$("#presentation-slides-wrapper");
  if (!slides_wrapper) {
    throw new ApiError("Presentation slides not found");
  }
  return slides_wrapper;
}

async function getSpeakerNotes(slides_wrapper: ElementHandle<Element>) {
  return await slides_wrapper.evaluate((el: Element) => {
    return Array.from(el.querySelectorAll("[data-speaker-note]")).map(
      (noteEl) => noteEl.getAttribute("data-speaker-note") || "",
    );
  });
}

/**
 * Recursively extracts attributes from all child elements in a slide's DOM tree.
 *
 * This is the core function that converts visual HTML/CSS into structured PPTX model data.
 * It traverses the DOM tree, extracts computed styles, positions, and content, and
 * handles special cases like charts, tables, images, and SVG elements.
 *
 * Key features:
 * - Recursive traversal: Processes all nested elements
 * - CSS inheritance: Applies inherited styles (font, background, etc.) to child elements
 * - Coordinate scaling: Converts rendered coordinates to standard slide size (1280x720)
 * - Special element handling:
 *   - Charts with data-chart-*: Extracts native chart data
 *   - Tables with data-table-*: Extracts native table data
 *   - SVG/Canvas: Marks for screenshot conversion
 *   - Paragraphs with inline formatting: Preserves HTML structure
 * - Filtering: Removes elements with pptx-ignore class, zero-size elements, etc.
 *
 * Process:
 * 1. Calculate scale factors if this is the root element
 * 2. Get direct child elements
 * 3. For each child:
 *    a. Extract element attributes (styles, position, content)
 *    b. Apply inherited styles if element doesn't have its own
 *    c. Scale coordinates to standard slide size
 *    d. Handle special cases (charts, tables, SVG, etc.)
 *    e. Recursively process children (unless special handling applies)
 * 4. Filter results to remove root-occupying elements
 * 5. Sort by z-index and depth
 * 6. Return structured slide data
 *
 * @param element - Puppeteer element handle of the root element to process.
 * @param rootRect - Bounding rectangle of the root element (calculated on first call).
 * @param depth - Current depth in the DOM tree (0 = root).
 * @param inheritedFont - Font properties inherited from parent elements.
 * @param inheritedBackground - Background properties inherited from parent.
 * @param inheritedBorderRadius - Border radius inherited from parent.
 * @param inheritedZIndex - Z-index inherited from parent.
 * @param inheritedOpacity - Opacity inherited from parent.
 * @param screenshotsDir - Directory for saving screenshots (null if using Supabase).
 * @returns Promise that resolves to a SlideAttributesResult containing:
 *   - `elements`: Array of element attributes with styling and positioning
 *   - `backgroundColor`: Background color of the slide (extracted from root-occupying elements)
 */
async function getAllChildElementsAttributes({
  element,
  rootRect = null,
  depth = 0,
  inheritedFont,
  inheritedBackground,
  inheritedBorderRadius,
  inheritedZIndex,
  inheritedOpacity,
  screenshotsDir,
}: GetAllChildElementsAttributesArgs): Promise<SlideAttributesResult> {
  // Standard slide size (PPTX always uses this size as reference)
  // All coordinates are scaled to this size regardless of actual rendered dimensions
  const SLIDE_WIDTH = 1280;
  const SLIDE_HEIGHT = 720;

  // Scale factor (rendered size -> standard size)
  // Used to convert actual pixel coordinates to standard slide coordinates
  let scaleX = 1;
  let scaleY = 1;

  if (!rootRect) {
    const rootAttributes = await getElementAttributes(element);
    inheritedFont = rootAttributes.font;
    inheritedBackground = rootAttributes.background;
    inheritedZIndex = rootAttributes.zIndex;
    inheritedOpacity = rootAttributes.opacity;

    const renderedWidth = rootAttributes.position?.width ?? SLIDE_WIDTH;
    const renderedHeight = rootAttributes.position?.height ?? SLIDE_HEIGHT;

    // Calculate scale factor if actual rendered size differs from standard size
    scaleX = SLIDE_WIDTH / renderedWidth;
    scaleY = SLIDE_HEIGHT / renderedHeight;

    rootRect = {
      left: rootAttributes.position?.left ?? 0,
      top: rootAttributes.position?.top ?? 0,
      width: renderedWidth,
      height: renderedHeight,
    };
  } else {
    // Calculate scale factor if rootRect already exists
    scaleX = SLIDE_WIDTH / rootRect.width;
    scaleY = SLIDE_HEIGHT / rootRect.height;
  }

  // Get direct child elements only (not all descendants)
  // This allows us to process the tree level by level
  const directChildElementHandles = await element.$$(":scope > *");

  // Accumulate results as we process elements
  const allResults: { attributes: ElementAttributes; depth: number }[] = [];

  // Process each direct child element
  for (const childElementHandle of directChildElementHandles) {
    // Extract all computed styles and attributes for this element
    const attributes = await getElementAttributes(childElementHandle);

    // Skip non-visual elements that shouldn't be in the PPTX
    if (
      ["style", "script", "link", "meta", "path"].includes(attributes.tagName)
    ) {
      continue;
    }

    // Apply CSS inheritance: if element doesn't have its own style, use inherited
    // This handles cases where styles are set on parent containers
    if (
      inheritedFont &&
      !attributes.font &&
      attributes.innerText &&
      attributes.innerText.trim().length > 0
    ) {
      attributes.font = inheritedFont;
    }
    // Background inheritance: only apply if element has shadow (indicates it needs background)
    if (inheritedBackground && !attributes.background && attributes.shadow) {
      attributes.background = inheritedBackground;
    }
    if (inheritedBorderRadius && !attributes.borderRadius) {
      attributes.borderRadius = inheritedBorderRadius;
    }
    // Z-index inheritance: only if element's z-index is 0 (default)
    if (inheritedZIndex !== undefined && attributes.zIndex === 0) {
      attributes.zIndex = inheritedZIndex;
    }
    // Opacity inheritance: only if element doesn't have explicit opacity
    if (
      inheritedOpacity !== undefined &&
      (attributes.opacity === undefined || attributes.opacity === 1)
    ) {
      attributes.opacity = inheritedOpacity;
    }

    // Scale coordinates to standard slide size (1280x720)
    // This ensures PPTX coordinates are consistent regardless of actual render size
    if (
      attributes.position &&
      attributes.position.left !== undefined &&
      attributes.position.top !== undefined
    ) {
      // Convert absolute coordinates to relative (subtract root position)
      // Then scale to standard size
      attributes.position = {
        left: (attributes.position.left - rootRect!.left) * scaleX,
        top: (attributes.position.top - rootRect!.top) * scaleY,
        width: (attributes.position.width ?? 0) * scaleX,
        height: (attributes.position.height ?? 0) * scaleY,
      };
    }

    // Ignore elements with no size (width or height)
    // These are typically invisible or layout-only elements
    if (
      attributes.position === undefined ||
      attributes.position.width === undefined ||
      attributes.position.height === undefined ||
      attributes.position.width === 0 ||
      attributes.position.height === 0
    ) {
      continue;
    }

    // Check for pptx-ignore class: elements with this class are skipped
    // but their children are still processed (useful for wrapper divs)
    const hasIgnoreClass =
      typeof attributes.className === "string" &&
      attributes.className.includes("pptx-ignore");
    if (hasIgnoreClass) {
      // Process children but don't include this element itself
      const childResults = await getAllChildElementsAttributes({
        element: childElementHandle,
        rootRect: rootRect,
        depth: depth + 1,
        inheritedFont: attributes.font || inheritedFont,
        inheritedBackground: attributes.background || inheritedBackground,
        inheritedBorderRadius: attributes.borderRadius || inheritedBorderRadius,
        inheritedZIndex: attributes.zIndex || inheritedZIndex,
        inheritedOpacity: attributes.opacity || inheritedOpacity,
        screenshotsDir,
      });
      allResults.push(
        ...childResults.elements.map((attr) => ({
          attributes: attr,
          depth: depth + 1,
        })),
      );
      continue;
    }

    // Special handling for paragraphs: if they only contain inline formatting
    // (bold, italic, underline, etc.), preserve the HTML structure instead of
    // processing children separately. This maintains text formatting in PPTX.
    if (attributes.tagName === "p") {
      const innerElementTagNames = await childElementHandle.evaluate(
        (el: Element) => {
          return Array.from(el.querySelectorAll("*")).map((e) =>
            e.tagName.toLowerCase(),
          );
        },
      );

      const allowedInlineTags = new Set(["strong", "u", "em", "code", "s"]);
      const hasOnlyAllowedInlineTags = innerElementTagNames.every((tag) =>
        allowedInlineTags.has(tag),
      );

      // If paragraph only has inline formatting, use innerHTML to preserve formatting
      if (innerElementTagNames.length > 0 && hasOnlyAllowedInlineTags) {
        attributes.innerText = await childElementHandle.evaluate(
          (el: Element) => {
            return el.innerHTML;
          },
        );
        allResults.push({ attributes, depth });
        continue;
      }
    }

    // Check for native chart/table data: elements with data-chart-* or data-table-*
    // attributes will be converted to native PPTX charts/tables, so we don't
    // need to screenshot them or process their children
    const hasNativeData = attributes.chartData || attributes.tableData;

    // Mark complex visual elements for screenshot conversion
    // These can't be represented as native PPTX elements, so we convert to images
    if (
      !hasNativeData &&
      (attributes.tagName === "svg" ||
        attributes.tagName === "canvas" ||
        attributes.tagName === "table")
    ) {
      attributes.should_screenshot = true;
      attributes.element = childElementHandle; // Keep reference for screenshot
    }

    // Add this element to results
    allResults.push({ attributes, depth });

    // If element has chart/table data, don't process children (they'll be native)
    // Native charts/tables are self-contained and don't need child processing
    if (hasNativeData) {
      continue;
    }

    // If the element is a canvas or table (not SVG), we don't need to go deeper
    // SVG elements may contain nested elements that need processing, but canvas/table
    // are treated as atomic units
    if (attributes.should_screenshot && attributes.tagName !== "svg") {
      continue;
    }

    // Recursively process children, passing down inherited styles
    const childResults = await getAllChildElementsAttributes({
      element: childElementHandle,
      rootRect: rootRect,
      depth: depth + 1,
      inheritedFont: attributes.font || inheritedFont,
      inheritedBackground: attributes.background || inheritedBackground,
      inheritedBorderRadius: attributes.borderRadius || inheritedBorderRadius,
      inheritedZIndex: attributes.zIndex || inheritedZIndex,
      inheritedOpacity: attributes.opacity || inheritedOpacity,
      screenshotsDir,
    });
    // Add child results to our accumulated results
    allResults.push(
      ...childResults.elements.map((attr) => ({
        attributes: attr,
        depth: depth + 1,
      })),
    );
  }

  // Helper function to compare numbers with tolerance for floating-point errors
  // Used when checking if an element occupies the entire slide
  const isNearlyEqual = (a: number, b: number, tolerance = 2) =>
    Math.abs(a - b) < tolerance;

  // Extract background color from root-occupying elements (for slide background)
  let backgroundColor = inheritedBackground?.color;
  if (depth === 0) {
    // Find elements that occupy the entire slide (background elements)
    const elementsWithRootPosition = allResults.filter(({ attributes }) => {
      return (
        attributes.position &&
        isNearlyEqual(attributes.position.left ?? 0, 0) &&
        isNearlyEqual(attributes.position.top ?? 0, 0) &&
        isNearlyEqual(attributes.position.width ?? 0, SLIDE_WIDTH) &&
        isNearlyEqual(attributes.position.height ?? 0, SLIDE_HEIGHT)
      );
    });

    // Extract background color from the first root-occupying element
    for (const { attributes } of elementsWithRootPosition) {
      if (attributes.background && attributes.background.color) {
        backgroundColor = attributes.background.color;
        break;
      }
    }
  }

  // Filter results: at root level, remove elements that occupy the entire slide
  // (these are background containers, not actual content elements)
  // At deeper levels, include all elements
  const filteredResults =
    depth === 0
      ? allResults.filter(({ attributes }) => {
          // Check if element has visual properties that make it worth including
          const hasBackground =
            attributes.background && attributes.background.color;
          const hasBorder = attributes.border && attributes.border.color;
          const hasShadow = attributes.shadow && attributes.shadow.color;
          const hasText =
            attributes.innerText && attributes.innerText.trim().length > 0;
          const hasImage = attributes.imageSrc;
          const isSvg = attributes.tagName === "svg";
          const isCanvas = attributes.tagName === "canvas";
          const isTable = attributes.tagName === "table";

          // Check if element occupies the entire slide (background container)
          const occupiesRoot =
            attributes.position &&
            isNearlyEqual(attributes.position.left ?? 0, 0) &&
            isNearlyEqual(attributes.position.top ?? 0, 0) &&
            isNearlyEqual(attributes.position.width ?? 0, SLIDE_WIDTH) &&
            isNearlyEqual(attributes.position.height ?? 0, SLIDE_HEIGHT);

          // Include element if it has visual properties and doesn't occupy root,
          // or if it has special content (images, SVG, canvas, table)
          const hasVisualProperties =
            hasBackground || hasBorder || hasShadow || hasText;
          const hasSpecialContent = hasImage || isSvg || isCanvas || isTable;

          return (hasVisualProperties && !occupiesRoot) || hasSpecialContent;
        })
      : allResults;

  // At root level (depth 0), sort elements and apply final processing
  if (depth === 0) {
    // Sort elements by z-index (higher z-index first) and then by depth
    // This ensures elements are in the correct rendering order for PPTX
    const sortedElements = filteredResults
      .sort((a, b) => {
        const zIndexA = a.attributes.zIndex || 0;
        const zIndexB = b.attributes.zIndex || 0;

        // If z-index is equal, sort by depth (shallower elements first)
        if (zIndexA === zIndexB) {
          return a.depth - b.depth;
        }

        // Higher z-index comes first (descending order)
        return zIndexB - zIndexA;
      })
      .map(({ attributes }) => {
        // If element has shadow but no background, use slide background color
        // This ensures shadows are visible against the slide background
        if (
          attributes.shadow &&
          attributes.shadow.color &&
          (!attributes.background || !attributes.background.color) &&
          backgroundColor
        ) {
          attributes.background = {
            color: backgroundColor,
            opacity: undefined,
          };
        }
        return attributes;
      });

    return {
      elements: sortedElements,
      backgroundColor,
    };
  } else {
    // At deeper levels, return elements as-is (no sorting needed)
    return {
      elements: filteredResults.map(({ attributes }) => attributes),
      backgroundColor,
    };
  }
}

/**
 * Extracts all computed styles and attributes from a DOM element.
 *
 * This function runs in the browser context (via Puppeteer's evaluate) to access
 * computed styles that can't be obtained from the server. It extracts:
 * - Position and dimensions (with scroll size handling)
 * - Font properties (family, size, weight, color, style, decoration)
 * - Background (color, opacity, image)
 * - Border (color, width, opacity)
 * - Shadow (offset, color, blur, spread, inset)
 * - Border radius (with clamping to element size)
 * - Margins and padding
 * - Filters (blur, brightness, contrast, etc.)
 * - Special data attributes (charts, tables)
 * - Image sources
 * - Text content
 * - Z-index and opacity
 *
 * The function includes many helper functions for parsing CSS values:
 * - colorToHex: Converts various color formats (rgb, rgba, hsl, hex) to hex
 * - parsePosition: Gets bounding rect with scroll size consideration
 * - parseFont: Extracts all font-related properties
 * - parseShadow: Parses complex box-shadow values
 * - parseBorderRadius: Handles all border-radius formats
 * - And many more...
 *
 * @param element - Puppeteer element handle to extract attributes from.
 * @returns Promise that resolves to an ElementAttributes object containing
 *   all extracted styling and positioning information.
 */
async function getElementAttributes(
  element: ElementHandle<Element>,
): Promise<ElementAttributes> {
  // Execute in browser context to access computed styles
  const attributes = await element.evaluate((el: Element) => {
    function colorToHex(color: string): {
      hex: string | undefined;
      opacity: number | undefined;
    } {
      if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") {
        return { hex: undefined, opacity: undefined };
      }

      if (color.startsWith("rgba(") || color.startsWith("hsla(")) {
        const match = color.match(/rgba?\(([^)]+)\)|hsla?\(([^)]+)\)/);
        if (match) {
          const values = match[1] || match[2];
          const parts = values.split(",").map((part) => part.trim());

          if (parts.length >= 4) {
            const opacity = parseFloat(parts[3]);
            const rgbColor = color
              .replace(/rgba?\(|hsla?\(|\)/g, "")
              .split(",")
              .slice(0, 3)
              .join(",");
            const rgbString = color.startsWith("rgba")
              ? `rgb(${rgbColor})`
              : `hsl(${rgbColor})`;

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.fillStyle = rgbString;
              const hexColor = ctx.fillStyle;
              const hex = hexColor.startsWith("#")
                ? hexColor.substring(1)
                : hexColor;
              const result = {
                hex,
                opacity: isNaN(opacity) ? undefined : opacity,
              };

              return result;
            }
          }
        }
      }

      if (color.startsWith("rgb(") || color.startsWith("hsl(")) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = color;
          const hexColor = ctx.fillStyle;
          const hex = hexColor.startsWith("#")
            ? hexColor.substring(1)
            : hexColor;
          return { hex, opacity: undefined };
        }
      }

      if (color.startsWith("#")) {
        const hex = color.substring(1);
        return { hex, opacity: undefined };
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return { hex: color, opacity: undefined };

      ctx.fillStyle = color;
      const hexColor = ctx.fillStyle;
      const hex = hexColor.startsWith("#") ? hexColor.substring(1) : hexColor;
      const result = { hex, opacity: undefined };

      return result;
    }

    function hasOnlyTextNodes(el: Element): boolean {
      const children = el.childNodes;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.nodeType === Node.ELEMENT_NODE) {
          return false;
        }
      }
      return true;
    }

    function parsePosition(el: Element) {
      const rect = el.getBoundingClientRect();
      let width = isFinite(rect.width) ? rect.width : 0;
      let height = isFinite(rect.height) ? rect.height : 0;

      // For HTMLElement, use scrollWidth/scrollHeight if larger
      // (to get actual content size when text is clipped by CSS)
      if (el instanceof HTMLElement) {
        if (el.scrollWidth > width) {
          width = el.scrollWidth;
        }
        if (el.scrollHeight > height) {
          height = el.scrollHeight;
        }
      }

      return {
        left: isFinite(rect.left) ? rect.left : 0,
        top: isFinite(rect.top) ? rect.top : 0,
        width,
        height,
      };
    }

    function parseBackground(computedStyles: CSSStyleDeclaration) {
      const backgroundColorResult = colorToHex(computedStyles.backgroundColor);

      const background = {
        color: backgroundColorResult.hex,
        opacity: backgroundColorResult.opacity,
      };

      // Return undefined if background has no meaningful values
      if (!background.color && background.opacity === undefined) {
        return undefined;
      }

      return background;
    }

    function parseBackgroundImage(computedStyles: CSSStyleDeclaration) {
      const backgroundImage = computedStyles.backgroundImage;

      if (!backgroundImage || backgroundImage === "none") {
        return undefined;
      }

      // Extract URL from background-image style
      const urlMatch = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (urlMatch && urlMatch[1]) {
        return urlMatch[1];
      }

      return undefined;
    }

    function parseBorder(computedStyles: CSSStyleDeclaration) {
      const borderColorResult = colorToHex(computedStyles.borderColor);
      const borderWidth = parseFloat(computedStyles.borderWidth);

      if (borderWidth === 0) {
        return undefined;
      }

      const border = {
        color: borderColorResult.hex,
        width: isNaN(borderWidth) ? undefined : borderWidth,
        opacity: borderColorResult.opacity,
      };

      // Return undefined if border has no meaningful values
      if (
        !border.color &&
        border.width === undefined &&
        border.opacity === undefined
      ) {
        return undefined;
      }

      return border;
    }

    function parseShadow(computedStyles: CSSStyleDeclaration) {
      const boxShadow = computedStyles.boxShadow;
      if (boxShadow !== "none") {
      }
      let shadow: {
        offset?: [number, number];
        color?: string;
        opacity?: number;
        radius?: number;
        angle?: number;
        spread?: number;
        inset?: boolean;
      } = {};

      if (boxShadow && boxShadow !== "none") {
        const shadows: string[] = [];
        let currentShadow = "";
        let parenCount = 0;

        for (let i = 0; i < boxShadow.length; i++) {
          const char = boxShadow[i];
          if (char === "(") {
            parenCount++;
          } else if (char === ")") {
            parenCount--;
          } else if (char === "," && parenCount === 0) {
            shadows.push(currentShadow.trim());
            currentShadow = "";
            continue;
          }
          currentShadow += char;
        }

        if (currentShadow.trim()) {
          shadows.push(currentShadow.trim());
        }

        let selectedShadow = "";
        let bestShadowScore = -1;

        for (let i = 0; i < shadows.length; i++) {
          const shadowStr = shadows[i];

          const shadowParts = shadowStr.split(" ");
          const numericParts: number[] = [];
          const colorParts: string[] = [];
          let isInset = false;
          let currentColor = "";
          let inColorFunction = false;

          for (let j = 0; j < shadowParts.length; j++) {
            const part = shadowParts[j];
            const trimmedPart = part.trim();
            if (trimmedPart === "") continue;

            if (trimmedPart.toLowerCase() === "inset") {
              isInset = true;
              continue;
            }

            if (trimmedPart.match(/^(rgba?|hsla?)\s*\(/i)) {
              inColorFunction = true;
              currentColor = trimmedPart;
              continue;
            }

            if (inColorFunction) {
              currentColor += " " + trimmedPart;

              const openParens = (currentColor.match(/\(/g) || []).length;
              const closeParens = (currentColor.match(/\)/g) || []).length;

              if (openParens <= closeParens) {
                colorParts.push(currentColor);
                currentColor = "";
                inColorFunction = false;
              }
              continue;
            }

            const numericValue = parseFloat(trimmedPart);
            if (!isNaN(numericValue)) {
              numericParts.push(numericValue);
            } else {
              colorParts.push(trimmedPart);
            }
          }

          let hasVisibleColor = false;
          if (colorParts.length > 0) {
            const shadowColor = colorParts.join(" ");
            const colorResult = colorToHex(shadowColor);
            hasVisibleColor = !!(
              colorResult.hex &&
              colorResult.hex !== "000000" &&
              colorResult.opacity !== 0
            );
          }

          const hasNonZeroValues = numericParts.some((value) => value !== 0);

          let shadowScore = 0;
          if (hasNonZeroValues) {
            shadowScore += numericParts.filter((value) => value !== 0).length;
          }
          if (hasVisibleColor) {
            shadowScore += 2;
          }

          if (
            (hasNonZeroValues || hasVisibleColor) &&
            shadowScore > bestShadowScore
          ) {
            selectedShadow = shadowStr;
            bestShadowScore = shadowScore;
          }
        }

        if (!selectedShadow && shadows.length > 0) {
          selectedShadow = shadows[0];
        }

        if (selectedShadow) {
          const shadowParts = selectedShadow.split(" ");
          const numericParts: number[] = [];
          const colorParts: string[] = [];
          let isInset = false;
          let currentColor = "";
          let inColorFunction = false;

          for (let i = 0; i < shadowParts.length; i++) {
            const part = shadowParts[i];
            const trimmedPart = part.trim();
            if (trimmedPart === "") continue;

            if (trimmedPart.toLowerCase() === "inset") {
              isInset = true;
              continue;
            }

            if (trimmedPart.match(/^(rgba?|hsla?)\s*\(/i)) {
              inColorFunction = true;
              currentColor = trimmedPart;
              continue;
            }

            if (inColorFunction) {
              currentColor += " " + trimmedPart;

              const openParens = (currentColor.match(/\(/g) || []).length;
              const closeParens = (currentColor.match(/\)/g) || []).length;

              if (openParens <= closeParens) {
                colorParts.push(currentColor);
                currentColor = "";
                inColorFunction = false;
              }
              continue;
            }

            const numericValue = parseFloat(trimmedPart);
            if (!isNaN(numericValue)) {
              numericParts.push(numericValue);
            } else {
              colorParts.push(trimmedPart);
            }
          }

          if (numericParts.length >= 2) {
            const offsetX = numericParts[0];
            const offsetY = numericParts[1];
            const blurRadius = numericParts.length >= 3 ? numericParts[2] : 0;
            const spreadRadius = numericParts.length >= 4 ? numericParts[3] : 0;

            // Only create shadow if color is present
            if (colorParts.length > 0) {
              const shadowColor = colorParts.join(" ");
              const shadowColorResult = colorToHex(shadowColor);

              if (shadowColorResult.hex) {
                shadow = {
                  offset: [offsetX, offsetY],
                  color: shadowColorResult.hex,
                  opacity: shadowColorResult.opacity,
                  radius: blurRadius,
                  spread: spreadRadius,
                  inset: isInset,
                  angle: Math.atan2(offsetY, offsetX) * (180 / Math.PI),
                };
              }
            }
          }
        }
      }

      // Return undefined if shadow is empty (no meaningful values)
      if (Object.keys(shadow).length === 0) {
        return undefined;
      }

      return shadow;
    }

    function parseFont(computedStyles: CSSStyleDeclaration) {
      const fontSize = parseFloat(computedStyles.fontSize);
      const fontWeight = parseInt(computedStyles.fontWeight);
      const fontColorResult = colorToHex(computedStyles.color);
      const fontFamily = computedStyles.fontFamily;
      const fontStyle = computedStyles.fontStyle;
      const textDecoration =
        computedStyles.textDecorationLine ||
        computedStyles.textDecoration ||
        "";
      const letterSpacing = computedStyles.letterSpacing;

      let fontName = undefined;
      if (fontFamily !== "initial") {
        const firstFont = fontFamily.split(",")[0].trim().replace(/['"]/g, "");
        fontName = firstFont;
      }

      // Parse text-decoration (underline, line-through)
      const hasUnderline = textDecoration.includes("underline");
      const hasStrike = textDecoration.includes("line-through");

      // Parse letter-spacing (px -> pt conversion, 1px = 0.75pt)
      let charSpacing: number | undefined = undefined;
      if (letterSpacing && letterSpacing !== "normal") {
        const spacingPx = parseFloat(letterSpacing);
        if (!isNaN(spacingPx)) {
          charSpacing = spacingPx * 0.75; // px to pt
        }
      }

      const font = {
        name: fontName,
        size: isNaN(fontSize) ? undefined : fontSize,
        weight: isNaN(fontWeight) ? undefined : fontWeight,
        color: fontColorResult.hex,
        italic: fontStyle === "italic",
        underline: hasUnderline || undefined,
        strike: hasStrike || undefined,
        charSpacing: charSpacing,
      };

      // Return undefined if font has no meaningful values
      if (
        !font.name &&
        font.size === undefined &&
        font.weight === undefined &&
        !font.color &&
        !font.italic &&
        !font.underline &&
        !font.strike &&
        font.charSpacing === undefined
      ) {
        return undefined;
      }

      return font;
    }

    function parseLineHeight(computedStyles: CSSStyleDeclaration, el: Element) {
      const lineHeight = computedStyles.lineHeight;
      const innerText = el.textContent || "";

      const htmlEl = el as HTMLElement;

      const fontSize = parseFloat(computedStyles.fontSize);
      const computedLineHeight = parseFloat(computedStyles.lineHeight);

      const singleLineHeight = !isNaN(computedLineHeight)
        ? computedLineHeight
        : fontSize * 1.2;

      const hasExplicitLineBreaks =
        innerText.includes("\n") ||
        innerText.includes("\r") ||
        innerText.includes("\r\n");
      const hasTextWrapping = htmlEl.offsetHeight > singleLineHeight * 2;
      const hasOverflow = htmlEl.scrollHeight > htmlEl.clientHeight;

      const isMultiline =
        hasExplicitLineBreaks || hasTextWrapping || hasOverflow;

      if (isMultiline && lineHeight && lineHeight !== "normal") {
        const parsedLineHeight = parseFloat(lineHeight);
        if (!isNaN(parsedLineHeight)) {
          return parsedLineHeight;
        }
      }

      return undefined;
    }

    function parseMargin(computedStyles: CSSStyleDeclaration) {
      const marginTop = parseFloat(computedStyles.marginTop);
      const marginBottom = parseFloat(computedStyles.marginBottom);
      const marginLeft = parseFloat(computedStyles.marginLeft);
      const marginRight = parseFloat(computedStyles.marginRight);
      const marginObj = {
        top: isNaN(marginTop) ? undefined : marginTop,
        bottom: isNaN(marginBottom) ? undefined : marginBottom,
        left: isNaN(marginLeft) ? undefined : marginLeft,
        right: isNaN(marginRight) ? undefined : marginRight,
      };

      return marginObj.top === 0 &&
        marginObj.bottom === 0 &&
        marginObj.left === 0 &&
        marginObj.right === 0
        ? undefined
        : marginObj;
    }

    function parsePadding(computedStyles: CSSStyleDeclaration) {
      const paddingTop = parseFloat(computedStyles.paddingTop);
      const paddingBottom = parseFloat(computedStyles.paddingBottom);
      const paddingLeft = parseFloat(computedStyles.paddingLeft);
      const paddingRight = parseFloat(computedStyles.paddingRight);
      const paddingObj = {
        top: isNaN(paddingTop) ? undefined : paddingTop,
        bottom: isNaN(paddingBottom) ? undefined : paddingBottom,
        left: isNaN(paddingLeft) ? undefined : paddingLeft,
        right: isNaN(paddingRight) ? undefined : paddingRight,
      };

      return paddingObj.top === 0 &&
        paddingObj.bottom === 0 &&
        paddingObj.left === 0 &&
        paddingObj.right === 0
        ? undefined
        : paddingObj;
    }

    function parseBorderRadius(
      computedStyles: CSSStyleDeclaration,
      el: Element,
    ) {
      const borderRadius = computedStyles.borderRadius;
      let borderRadiusValue;

      if (borderRadius && borderRadius !== "0px") {
        const radiusParts = borderRadius
          .split(" ")
          .map((part) => parseFloat(part));
        if (radiusParts.length === 1) {
          borderRadiusValue = [
            radiusParts[0],
            radiusParts[0],
            radiusParts[0],
            radiusParts[0],
          ];
        } else if (radiusParts.length === 2) {
          borderRadiusValue = [
            radiusParts[0],
            radiusParts[1],
            radiusParts[0],
            radiusParts[1],
          ];
        } else if (radiusParts.length === 3) {
          borderRadiusValue = [
            radiusParts[0],
            radiusParts[1],
            radiusParts[2],
            radiusParts[1],
          ];
        } else if (radiusParts.length === 4) {
          borderRadiusValue = radiusParts;
        }

        // Clamp border radius values to be between 0 and half the width/height
        if (borderRadiusValue) {
          const rect = el.getBoundingClientRect();
          const maxRadiusX = rect.width / 2;
          const maxRadiusY = rect.height / 2;

          borderRadiusValue = borderRadiusValue.map((radius, index) => {
            // For top-left and bottom-right corners, use maxRadiusX
            // For top-right and bottom-left corners, use maxRadiusY
            const maxRadius =
              index === 0 || index === 2 ? maxRadiusX : maxRadiusY;
            return Math.max(0, Math.min(radius, maxRadius));
          });
        }
      }

      return borderRadiusValue;
    }

    function parseShape(el: Element, borderRadiusValue: number[] | undefined) {
      if (el.tagName.toLowerCase() === "img") {
        return borderRadiusValue &&
          borderRadiusValue.length === 4 &&
          borderRadiusValue.every((radius: number) => radius === 50)
          ? "circle"
          : "rectangle";
      }
      return undefined;
    }

    function parseFilters(computedStyles: CSSStyleDeclaration) {
      const filter = computedStyles.filter;
      if (!filter || filter === "none") {
        return undefined;
      }

      const filters: {
        invert?: number;
        brightness?: number;
        contrast?: number;
        saturate?: number;
        hueRotate?: number;
        blur?: number;
        grayscale?: number;
        sepia?: number;
        opacity?: number;
      } = {};

      // Parse filter functions
      const filterFunctions = filter.match(/[a-zA-Z]+\([^)]*\)/g);
      if (filterFunctions) {
        filterFunctions.forEach((func) => {
          const match = func.match(/([a-zA-Z]+)\(([^)]*)\)/);
          if (match) {
            const filterType = match[1];
            const value = parseFloat(match[2]);

            if (!isNaN(value)) {
              switch (filterType) {
                case "invert":
                  filters.invert = value;
                  break;
                case "brightness":
                  filters.brightness = value;
                  break;
                case "contrast":
                  filters.contrast = value;
                  break;
                case "saturate":
                  filters.saturate = value;
                  break;
                case "hue-rotate":
                  filters.hueRotate = value;
                  break;
                case "blur":
                  filters.blur = value;
                  break;
                case "grayscale":
                  filters.grayscale = value;
                  break;
                case "sepia":
                  filters.sepia = value;
                  break;
                case "opacity":
                  filters.opacity = value;
                  break;
              }
            }
          }
        });
      }

      // Return undefined if no filters were parsed
      return Object.keys(filters).length > 0 ? filters : undefined;
    }

    /**
     * Parse chart data attributes for native PPTX chart export
     */
    function parseChartData(el: Element) {
      const chartType = el.getAttribute("data-chart-type");
      const chartDataStr = el.getAttribute("data-chart-data");
      const labelKey = el.getAttribute("data-chart-label-key");
      const valueKey = el.getAttribute("data-chart-value-key");
      const color = el.getAttribute("data-chart-color");
      const colorsStr = el.getAttribute("data-chart-colors");
      const title = el.getAttribute("data-chart-title");
      const barDir = el.getAttribute("data-chart-bar-dir");

      if (!chartType || !chartDataStr || !labelKey || !valueKey) {
        return undefined;
      }

      try {
        const data = JSON.parse(chartDataStr);
        if (!Array.isArray(data)) {
          return undefined;
        }

        // Parse colors array if provided
        let colors: string[] | undefined;
        if (colorsStr) {
          try {
            const parsed = JSON.parse(colorsStr);
            if (Array.isArray(parsed)) {
              colors = parsed;
            }
          } catch {
            // Ignore colors parsing error
          }
        }

        return {
          type: chartType as
            | "area"
            | "bar"
            | "line"
            | "pie"
            | "doughnut"
            | "scatter",
          title: title || undefined,
          data,
          labelKey,
          valueKey,
          color: color || undefined,
          colors,
          barDir:
            barDir === "bar" || barDir === "col"
              ? (barDir as "bar" | "col")
              : undefined,
        };
      } catch {
        return undefined;
      }
    }

    /**
     * Parse table data attributes for native PPTX table export
     */
    function parseTableData(el: Element) {
      const tableDataStr = el.getAttribute("data-table-data");
      const headersStr = el.getAttribute("data-table-headers");
      const headerBackground = el.getAttribute("data-table-header-bg");
      const headerColor = el.getAttribute("data-table-header-color");

      if (!tableDataStr) {
        return undefined;
      }

      try {
        const rows = JSON.parse(tableDataStr);
        if (!Array.isArray(rows)) {
          return undefined;
        }

        return {
          headers: headersStr ? JSON.parse(headersStr) : undefined,
          rows,
          headerBackground: headerBackground || undefined,
          headerColor: headerColor || undefined,
        };
      } catch {
        return undefined;
      }
    }

    function parseElementAttributes(el: Element) {
      let tagName = el.tagName.toLowerCase();

      const computedStyles = window.getComputedStyle(el);

      const position = parsePosition(el);

      const shadow = parseShadow(computedStyles);

      const background = parseBackground(computedStyles);

      const border = parseBorder(computedStyles);

      const font = parseFont(computedStyles);

      const lineHeight = parseLineHeight(computedStyles, el);

      const margin = parseMargin(computedStyles);

      const padding = parsePadding(computedStyles);

      const innerText = hasOnlyTextNodes(el)
        ? el.textContent || undefined
        : undefined;

      const zIndex = parseInt(computedStyles.zIndex);
      const zIndexValue = isNaN(zIndex) ? 0 : zIndex;

      const textAlign = computedStyles.textAlign as
        | "left"
        | "center"
        | "right"
        | "justify";
      const objectFit = computedStyles.objectFit as
        | "contain"
        | "cover"
        | "fill"
        | undefined;

      const parsedBackgroundImage = parseBackgroundImage(computedStyles);
      const imageSrc = (el as HTMLImageElement).src || parsedBackgroundImage;

      const borderRadiusValue = parseBorderRadius(computedStyles, el);

      const shape = parseShape(el, borderRadiusValue) as
        | "rectangle"
        | "circle"
        | undefined;

      const textWrap = computedStyles.whiteSpace !== "nowrap";

      const filters = parseFilters(computedStyles);

      const opacity = parseFloat(computedStyles.opacity);
      const elementOpacity = isNaN(opacity) ? undefined : opacity;

      // Parse chart and table data for native PPTX export
      const chartData = parseChartData(el);
      const tableData = parseTableData(el);

      return {
        tagName: tagName,
        id: el.id,
        className:
          el.className && typeof el.className === "string"
            ? el.className
            : el.className
              ? el.className.toString()
              : undefined,
        innerText: innerText,
        opacity: elementOpacity,
        background: background,
        border: border,
        shadow: shadow,
        font: font,
        position: position,
        margin: margin,
        padding: padding,
        zIndex: zIndexValue,
        textAlign: textAlign !== "left" ? textAlign : undefined,
        lineHeight: lineHeight,
        borderRadius: borderRadiusValue,
        imageSrc: imageSrc,
        objectFit: objectFit,
        clip: false,
        overlay: undefined,
        shape: shape,
        connectorType: undefined,
        textWrap: textWrap,
        should_screenshot: false,
        element: undefined,
        filters: filters,
        chartData: chartData,
        tableData: tableData,
      };
    }

    return parseElementAttributes(el);
  });
  return attributes;
}
