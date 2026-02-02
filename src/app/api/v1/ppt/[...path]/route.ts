import path from "node:path";
import { promises as fs } from "node:fs";
import { v4 as uuidv4 } from "uuid";
import {
  handleFontsDelete,
  handleFontsList,
  handleFontsUpload,
} from "../handlers/fonts";
import { handleIconsSearch } from "../handlers/icons";
import {
  handleImagesDelete,
  handleImagesGenerate,
  handleImagesGenerated,
  handleImagesUpload,
  handleImagesUploaded,
} from "../handlers/images";
import {
  handlePresentationCreate,
  handlePresentationDelete,
  handlePresentationGet,
  handlePresentationGetAll,
  handlePresentationGetDrafts,
  handlePresentationPrepare,
  handlePresentationStream,
  handlePresentationUpdate,
  handleExportPptx,
  handleOutlinesStream,
} from "../handlers/presentation";
import {
  handleHtmlEdit,
  handleHtmlToReact,
  handleSlideEdit,
  handleSlideEditHtml,
  handleSlideToHtml,
} from "../handlers/slides";
import {
  handleTemplateDelete,
  handleTemplateGet,
  handleTemplateMeta,
  handleTemplateSave,
  handleTemplateSummary,
  handleTemplatesList,
} from "../handlers/templates";
import { MAX_UPLOAD_BYTES } from "../utils/constants";
import { errorResponse, jsonResponse } from "../utils/responses";
import { ensureTempDir } from "../utils/storage";
import { getImagesDirectory } from "@/server/storage";
import {
  analyzeFontsInSlides,
  convertPdfToPngs,
  convertPptxToPdf,
  extractFontsFromOxml,
  extractSlideXmls,
  normalizeFontFamilyName,
} from "@/server/media";

/**
 * Runtime configuration for this API route.
 * - nodejs: Runs on Node.js runtime (required for file processing)
 * - maxDuration: Maximum execution time of 300 seconds (5 minutes)
 * - force-dynamic: Always generates dynamic responses (no caching)
 */
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Parses the path array from route parameters.
 *
 * @param pathArr - Optional array of path segments from the dynamic route.
 * @returns The path array or an empty array if not provided.
 */
const parsePath = (pathArr?: string[]) => pathArr ?? [];

/**
 * Handles POST requests to process PDF files and extract slide previews.
 *
 * Takes an uploaded PDF file, converts each page to a PNG image, and saves
 * the images for use as slide previews. This is useful for importing existing
 * PDF presentations.
 *
 * Process:
 * 1. Validates PDF file size
 * 2. Saves PDF to temporary directory
 * 3. Converts each PDF page to PNG screenshot
 * 4. Copies screenshots to permanent storage
 * 5. Returns slide metadata with screenshot URLs
 *
 * Request body (multipart/form-data):
 * - `pdf_file` (required): PDF file to process
 *
 * @param request - The HTTP request object containing the PDF file in form data.
 * @returns A JSON response with:
 *   - `success`: Boolean indicating operation success
 *   - `slides`: Array of slide objects, each with:
 *     - `slide_number`: One-based slide index
 *     - `screenshot_url`: URL path to the slide preview image
 *   - `total_slides`: Total number of slides extracted
 *
 * @throws Returns error responses for:
 *   - 400: Missing PDF file or file exceeds maximum size
 *   - 500: PDF processing failed or screenshot generation failed
 */
const handlePdfSlidesProcess = async (request: Request) => {
  const formData = await request.formData();
  const pdf = formData.get("pdf_file");
  if (!(pdf instanceof File)) {
    return errorResponse("pdf_file is required");
  }
  if (pdf.size > MAX_UPLOAD_BYTES) {
    return errorResponse("PDF file exceeded max upload size");
  }

  const tempDir = await ensureTempDir();
  try {
    const pdfPath = path.join(tempDir, "presentation.pdf");
    await fs.writeFile(pdfPath, Buffer.from(await pdf.arrayBuffer()));
    const screenshotPaths = await convertPdfToPngs(pdfPath, tempDir);
    if (!screenshotPaths.length) {
      return errorResponse("Failed to generate PDF previews", 500);
    }

    const imagesDir = getImagesDirectory();
    const presentationId = uuidv4();
    const presentationDir = path.join(imagesDir, presentationId);
    await fs.mkdir(presentationDir, { recursive: true });

    const slides = await Promise.all(
      screenshotPaths.map(async (screenshotPath, index) => {
        const slideNumber = index + 1;
        const screenshotFilename = `slide_${slideNumber}.png`;
        const permanentPath = path.join(presentationDir, screenshotFilename);
        await fs.copyFile(screenshotPath, permanentPath);
        return {
          slide_number: slideNumber,
          screenshot_url: `/app_data/images/${presentationId}/${screenshotFilename}`,
        };
      }),
    );

    return jsonResponse({
      success: true,
      slides,
      total_slides: slides.length,
    });
  } catch (error) {
    console.error("PDF slide processing failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process PDF";
    return errorResponse(message, 500);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
};

/**
 * Handles POST requests to process PPTX files and extract slide previews and metadata.
 *
 * Takes an uploaded PPTX file, extracts slide XML content, analyzes fonts, converts
 * to PDF, generates PNG previews, and returns comprehensive slide metadata. This
 * is useful for importing existing PowerPoint presentations.
 *
 * Process:
 * 1. Validates PPTX file size
 * 2. Extracts slide XML content from PPTX
 * 3. Analyzes fonts used in slides
 * 4. Converts PPTX to PDF
 * 5. Converts PDF pages to PNG screenshots
 * 6. Extracts and normalizes font names from each slide
 * 7. Copies screenshots to permanent storage
 * 8. Returns slide metadata with screenshots, XML, and fonts
 *
 * Request body (multipart/form-data):
 * - `pptx_file` (required): PPTX file to process
 *
 * @param request - The HTTP request object containing the PPTX file in form data.
 * @returns A JSON response with:
 *   - `success`: Boolean indicating operation success
 *   - `slides`: Array of slide objects, each with:
 *     - `slide_number`: One-based slide index
 *     - `screenshot_url`: URL path to the slide preview image
 *     - `xml_content`: OXML content for the slide (for content extraction)
 *     - `normalized_fonts`: Array of normalized font names used in the slide
 *   - `total_slides`: Total number of slides extracted
 *   - `fonts`: Font analysis results across all slides
 *
 * @throws Returns error responses for:
 *   - 400: Missing PPTX file or file exceeds maximum size
 *   - 500: PPTX processing failed, PDF conversion failed, or screenshot generation failed
 */
const handlePptxSlidesProcess = async (request: Request) => {
  const formData = await request.formData();
  const pptx = formData.get("pptx_file");
  if (!(pptx instanceof File)) {
    return errorResponse("pptx_file is required");
  }
  if (pptx.size > MAX_UPLOAD_BYTES) {
    return errorResponse("PPTX file exceeded max upload size");
  }

  const tempDir = await ensureTempDir();
  try {
    const pptxPath = path.join(tempDir, "presentation.pptx");
    await fs.writeFile(pptxPath, Buffer.from(await pptx.arrayBuffer()));

    const slideXmls = await extractSlideXmls(pptxPath);
    const fontAnalysis = await analyzeFontsInSlides(slideXmls);

    const pdfPath = await convertPptxToPdf(pptxPath, tempDir);
    const pdfStats = await fs.stat(pdfPath).catch(() => null);
    if (!pdfStats) {
      return errorResponse("Failed to convert PPTX to PDF", 500);
    }
    const screenshotPaths = await convertPdfToPngs(pdfPath, tempDir);
    if (!screenshotPaths.length) {
      return errorResponse("Failed to generate PPTX previews", 500);
    }

    const imagesDir = getImagesDirectory();
    const presentationId = uuidv4();
    const presentationDir = path.join(imagesDir, presentationId);
    await fs.mkdir(presentationDir, { recursive: true });

    const slides = await Promise.all(
      screenshotPaths.map(async (screenshotPath, index) => {
        const slideNumber = index + 1;
        const screenshotFilename = `slide_${slideNumber}.png`;
        const permanentPath = path.join(presentationDir, screenshotFilename);
        await fs.copyFile(screenshotPath, permanentPath);
        const xmlContent = slideXmls[index] || "";
        const rawFonts = extractFontsFromOxml(xmlContent);
        const fonts = Array.from(
          new Set(
            rawFonts
              .map((font) => normalizeFontFamilyName(font))
              .filter(Boolean),
          ),
        );

        return {
          slide_number: slideNumber,
          screenshot_url: `/app_data/images/${presentationId}/${screenshotFilename}`,
          xml_content: xmlContent,
          normalized_fonts: fonts,
        };
      }),
    );

    return jsonResponse({
      success: true,
      slides,
      total_slides: slides.length,
      fonts: fontAnalysis,
    });
  } catch (error) {
    console.error("PPTX slide processing failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process PPTX";
    return errorResponse(message, 500);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
};

/**
 * Routes requests to appropriate handlers based on the path segments.
 *
 * This is a catch-all dynamic route handler that provides backward compatibility
 * with legacy API endpoints. It parses the path segments and routes to the
 * appropriate handler function based on the path pattern and HTTP method.
 *
 * Supported routes:
 * - Presentation operations: create, prepare, stream, update, get, delete, export
 * - Outline operations: stream
 * - Image operations: generate, upload, list, delete
 * - Icon operations: search
 * - Font operations: upload, list, delete
 * - Slide operations: edit, transform (to-html, html-to-react, html-edit)
 * - Template operations: summary, get, delete, save, meta, list
 * - File processing: pdf-slides/process, pptx-slides/process
 *
 * @param request - The HTTP request object.
 * @param context - Next.js route context containing dynamic path segments.
 * @param method - HTTP method (GET, POST, PATCH, DELETE).
 * @returns A Response object from the appropriate handler, or 404 if route not found.
 */
const routeRequest = async (
  request: Request,
  context: { params: Promise<{ path: string[] }> },
  method: string,
): Promise<Response> => {
  const params = await context.params;
  const segments = parsePath(params.path);
  const subpath = segments.join("/");
  const url = new URL(request.url);

  if (subpath === "presentation/create" && method === "POST")
    return handlePresentationCreate(request);
  if (subpath === "presentation/prepare" && method === "POST")
    return handlePresentationPrepare(request);
  if (subpath.startsWith("presentation/stream/") && method === "GET") {
    const id = segments[2];
    return handlePresentationStream(id);
  }
  if (subpath === "presentation/update" && method === "PATCH")
    return handlePresentationUpdate(request);
  if (subpath === "presentation/all" && method === "GET")
    return handlePresentationGetAll(request);
  if (subpath === "presentation/drafts" && method === "GET")
    return handlePresentationGetDrafts(request);
  if (
    subpath.startsWith("presentation/") &&
    segments.length === 2 &&
    method === "GET"
  ) {
    return handlePresentationGet(segments[1]);
  }
  if (
    subpath.startsWith("presentation/") &&
    segments.length === 2 &&
    method === "DELETE"
  ) {
    return handlePresentationDelete(segments[1]);
  }
  if (subpath === "presentation/export/pptx" && method === "POST")
    return handleExportPptx(request);

  if (subpath.startsWith("outlines/stream/") && method === "GET") {
    const id = segments[2];
    return handleOutlinesStream(id);
  }

  if (subpath === "images/generate" && method === "GET")
    return handleImagesGenerate(url);
  if (subpath === "images/generated" && method === "GET")
    return handleImagesGenerated();
  if (subpath === "images/upload" && method === "POST")
    return handleImagesUpload(request);
  if (subpath === "images/uploaded" && method === "GET")
    return handleImagesUploaded();
  if (
    subpath.startsWith("images/") &&
    segments.length === 2 &&
    method === "DELETE"
  ) {
    return handleImagesDelete(segments[1]);
  }

  if (subpath === "icons/search" && method === "GET")
    return handleIconsSearch(url);

  if (subpath === "fonts/upload" && method === "POST")
    return handleFontsUpload(request);
  if (subpath === "fonts/list" && method === "GET") return handleFontsList();
  if (subpath.startsWith("fonts/delete/") && method === "DELETE") {
    return handleFontsDelete(segments[2]);
  }

  if (subpath === "pdf-slides/process" && method === "POST")
    return handlePdfSlidesProcess(request);
  if (subpath === "pptx-slides/process" && method === "POST")
    return handlePptxSlidesProcess(request);

  if (subpath === "slide/edit" && method === "POST")
    return handleSlideEdit(request);
  if (subpath === "slide/edit-html" && method === "POST")
    return handleSlideEditHtml(request);

  if (
    (subpath === "slide-to-html" || subpath === "slide-to-html/") &&
    method === "POST"
  ) {
    return handleSlideToHtml(request);
  }
  if (
    (subpath === "html-to-react" || subpath === "html-to-react/") &&
    method === "POST"
  ) {
    return handleHtmlToReact(request);
  }
  if (
    (subpath === "html-edit" || subpath === "html-edit/") &&
    method === "POST"
  ) {
    return handleHtmlEdit(request);
  }

  if (subpath === "template-management/summary" && method === "GET")
    return handleTemplateSummary();
  if (
    subpath.startsWith("template-management/get-templates/") &&
    method === "GET"
  ) {
    return handleTemplateGet(segments[2]);
  }
  if (
    subpath.startsWith("template-management/delete-templates/") &&
    method === "DELETE"
  ) {
    return handleTemplateDelete(segments[2]);
  }
  if (subpath === "template-management/save-templates" && method === "POST")
    return handleTemplateSave(request);
  if (subpath === "template-management/templates" && method === "POST")
    return handleTemplateMeta(request);
  if (subpath === "template-management/templates" && method === "GET")
    return handleTemplatesList();

  return jsonResponse({ detail: "Not found" }, 404);
};

/**
 * Handles GET requests to the catch-all PPT route.
 *
 * Routes GET requests to appropriate handlers based on path segments.
 * Used for retrieving resources like presentations, images, templates, etc.
 *
 * @param request - The HTTP request object.
 * @param context - Next.js route context containing dynamic path segments.
 * @returns A Response from the routed handler or 404 if not found.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  return routeRequest(request, context, "GET");
}

/**
 * Handles POST requests to the catch-all PPT route.
 *
 * Routes POST requests to appropriate handlers based on path segments.
 * Used for creating resources, uploading files, processing documents, etc.
 *
 * @param request - The HTTP request object.
 * @param context - Next.js route context containing dynamic path segments.
 * @returns A Response from the routed handler or 404 if not found.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  return routeRequest(request, context, "POST");
}

/**
 * Handles PATCH requests to the catch-all PPT route.
 *
 * Routes PATCH requests to appropriate handlers based on path segments.
 * Used for updating existing resources like presentations.
 *
 * @param request - The HTTP request object.
 * @param context - Next.js route context containing dynamic path segments.
 * @returns A Response from the routed handler or 404 if not found.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  return routeRequest(request, context, "PATCH");
}

/**
 * Handles DELETE requests to the catch-all PPT route.
 *
 * Routes DELETE requests to appropriate handlers based on path segments.
 * Used for deleting resources like presentations, images, templates, etc.
 *
 * @param request - The HTTP request object.
 * @param context - Next.js route context containing dynamic path segments.
 * @returns A Response from the routed handler or 404 if not found.
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  return routeRequest(request, context, "DELETE");
}

/**
 * Handles OPTIONS requests for CORS preflight.
 *
 * Returns CORS headers allowing all origins, headers, and methods.
 * This enables cross-origin requests from web clients.
 *
 * @returns A 204 No Content response with CORS headers.
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
    },
  });
}
