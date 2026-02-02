/**
 * Editable layout wrapper component for making slide images and icons editable.
 *
 * This component wraps slide layout content and automatically makes images
 * and icons clickable for editing. It scans the DOM for image and SVG elements,
 * maps them to slide data paths, and opens appropriate editors (ImageEditor
 * or IconsEditor) when clicked.
 *
 * Features:
 * - Automatic image/icon detection in rendered slide content
 * - Data path mapping for content synchronization
 * - Click handlers for opening editors
 * - Hover effects for visual feedback
 * - Image properties support (focus point, object-fit)
 * - MutationObserver for dynamic content updates
 * - Cleanup of event listeners on unmount
 *
 * The component uses a delayed processing strategy (400ms) to ensure DOM is
 * fully rendered before scanning. It tracks processed elements to avoid
 * double-processing and maintains references for cleanup.
 *
 * This component bridges static slide rendering with interactive editing,
 * enabling WYSIWYG image/icon replacement in slides.
 */

"use client";

import React, { ReactNode, useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePresentationDataStore } from "@/stores";
import type { SlideContent, SlideProperties } from "@/types/slide";

// Dynamically import editors to avoid SSR issues
const ImageEditor = dynamic(() => import("./image-editor"), { ssr: false });
const IconsEditor = dynamic(() => import("./icons-editor"), { ssr: false });

/**
 * Props for the EditableLayoutWrapper component.
 *
 * @property children - React nodes containing the slide layout content to process.
 *   These are rendered first, then images/icons are made editable.
 * @property slideIndex - Zero-based index of the slide being edited.
 * @property slideData - Slide data object used to map image/icon URLs to data paths.
 *   Used to find matching content in the data structure for updates.
 * @property isEditMode - Whether the slide is in edit mode (currently unused but
 *   reserved for future edit mode toggling).
 * @property properties - Optional slide properties containing image-specific settings
 *   like focus point and object-fit for each image in the slide.
 */
interface EditableLayoutWrapperProps {
  children: ReactNode;
  slideIndex: number;
  slideData: unknown;
  isEditMode?: boolean;
  properties?: SlideProperties | null;
}

/**
 * Element data structure found in slide data.
 *
 * Contains special fields used to identify images and icons in slide data:
 * - __image_url__: URL of an image
 * - __image_prompt__: Prompt used to generate the image
 * - __icon_url__: URL of an icon
 * - __icon_query__: Search query used to find the icon
 */
interface ElementData {
  __image_url__?: string;
  __image_prompt__?: string;
  __icon_url__?: string;
  __icon_query__?: string;
}

/**
 * Editable element structure for tracked images/icons.
 *
 * Represents an image or icon element that has been made editable, containing
 * all information needed to open the appropriate editor and update the slide data.
 *
 * @property id - Unique identifier for this editable element.
 * @property type - Type of element ("image" or "icon").
 * @property src - Source URL of the image/icon.
 * @property dataPath - Dot-notation path to this element in slideData.
 * @property data - ElementData object containing metadata (prompt, query, etc.).
 * @property element - Reference to the actual DOM element (HTMLImageElement or SVGElement).
 */
interface EditableElement {
  id: string;
  type: "image" | "icon";
  src: string;
  dataPath: string;
  data: ElementData;
  element: HTMLImageElement | SVGElement;
}

/**
 * Editable layout wrapper component.
 *
 * Wraps slide content and makes images/icons editable by adding click handlers
 * and opening editors. Processes DOM after render and tracks editable elements.
 *
 * @param props - Component props containing children, slide data, and configuration.
 * @returns JSX element containing the wrapped content and editor modals.
 */
const EditableLayoutWrapper: React.FC<EditableLayoutWrapperProps> = ({
  children,
  slideIndex,
  slideData,
  properties,
}) => {
  // Zustand store actions for updating slide content
  const updateSlideImage = usePresentationDataStore((state) => state.updateSlideImage);
  const updateSlideIcon = usePresentationDataStore((state) => state.updateSlideIcon);
  const updateImageProperties = usePresentationDataStore((state) => state.updateImageProperties);
  
  // Ref to container element containing the slide content
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State tracking all editable elements found in the DOM
  const [editableElements, setEditableElements] = useState<EditableElement[]>(
    [],
  );
  
  // State tracking which editor is currently open (if any)
  const [activeEditor, setActiveEditor] = useState<EditableElement | null>(
    null,
  );

  /**
   * Recursively searches for ALL image/icon data paths in the slide data structure.
   *
   * Traverses the entire slide data object to find all occurrences of a specific
   * image or icon URL. Returns an array of all matches with their paths and types.
   * This is used when multiple elements might share the same URL (e.g., same image
   * used in multiple places).
   *
   * @param targetUrl - URL string to search for in the data structure.
   * @param data - Slide data object to search (can be nested).
   * @param path - Current path prefix (used for recursion, starts empty).
   * @returns Array of matches, each containing path, type, and data object.
   */
  const findAllDataPaths = (
    targetUrl: string,
    data: unknown,
    path: string = "",
  ): { path: string; type: "image" | "icon"; data: ElementData }[] => {
    if (!data || typeof data !== "object") return [];

    const matches: { path: string; type: "image" | "icon"; data: ElementData }[] = [];

    const dataObj = data as Record<string, unknown>;

    // Check current level for __image_url__ or __icon_url__
    if (typeof dataObj.__image_url__ === "string" && targetUrl.includes(dataObj.__image_url__)) {
      matches.push({ path, type: "image", data: dataObj as ElementData });
    }

    if (typeof dataObj.__icon_url__ === "string" && targetUrl.includes(dataObj.__icon_url__)) {
      matches.push({ path, type: "icon", data: dataObj as ElementData });
    }

    // Recursively check nested objects and arrays
    for (const [key, value] of Object.entries(dataObj)) {
      const newPath = path ? `${path}.${key}` : key;

      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const results = findAllDataPaths(
            targetUrl,
            value[i],
            `${newPath}[${i}]`,
          );
          matches.push(...results);
        }
      } else if (value && typeof value === "object") {
        const results = findAllDataPaths(targetUrl, value, newPath);
        matches.push(...results);
      }
    }

    return matches;
  };

  /**
   * Finds the best matching data path for a specific DOM element.
   *
   * When multiple data paths match the same URL, uses DOM position to determine
   * which one corresponds to the clicked element. Compares element position
   * in the DOM tree with the order of matches in the data structure.
   *
   * Strategy:
   * 1. Find all matching paths using findAllDataPaths
   * 2. If single match, return it
   * 3. If multiple matches, use DOM position to select the correct one
   * 4. Fallback to first match if position matching fails
   *
   * @param targetUrl - URL string of the image/icon to find.
   * @param imgElement - DOM element (HTMLImageElement or SVGElement) being processed.
   * @param data - Slide data object to search.
   * @returns Best matching data path object, or null if no match found.
   */
  const findBestDataPath = (
    targetUrl: string,
    imgElement: HTMLImageElement | SVGElement,
    data: any,
  ): { path: string; type: "image" | "icon"; data: any } | null => {
    const allMatches = findAllDataPaths(targetUrl, data);

    if (allMatches.length === 0) return null;
    if (allMatches.length === 1) return allMatches[0];

    // If multiple matches, use DOM position to find the correct one across images and svgs
    const getElementSourceUrl = (el: Element): string | null => {
      if (el instanceof HTMLImageElement) {
        return el.src || null;
      }
      if (el instanceof SVGElement) {
        const wrapperWithUrl = (el as unknown as HTMLElement).closest(
          "[data-path]",
        ) as HTMLElement | null;
        return wrapperWithUrl?.getAttribute("data-path") || null;
      }
      return null;
    };

    const allMediaInContainer =
      containerRef.current?.querySelectorAll("img, svg") ||
      ([] as unknown as NodeListOf<Element>);
    const imgIndex = Array.from(allMediaInContainer).indexOf(
      imgElement as Element,
    );

    // Find images with the same URL pattern
    const sameUrlElements: Element[] = [];
    allMediaInContainer.forEach((el) => {
      const elUrl = getElementSourceUrl(el);
      if (elUrl && isMatchingUrl(elUrl, targetUrl)) {
        sameUrlElements.push(el);
      }
    });

    const sameUrlIndex = sameUrlElements.indexOf(imgElement as Element);

    // Try to match based on position in the same URL group
    if (sameUrlIndex >= 0 && sameUrlIndex < allMatches.length) {
      return allMatches[sameUrlIndex];
    }

    // Fallback: try to match based on overall DOM position
    if (imgIndex >= 0 && imgIndex < allMatches.length) {
      return allMatches[imgIndex];
    }

    // Last resort: return the first match
    return allMatches[0];
  };

  /**
   * Checks if two URLs match using various comparison strategies.
   *
   * Compares URLs using multiple strategies to handle different URL formats:
   * - Direct equality
   * - Path-only comparison (ignoring protocol/domain)
   * - Filename comparison for app_data paths
   * - Filename comparison for other URLs (with minimum length requirement)
   *
   * Uses stricter matching for placeholders and app_data paths to avoid false
   * positives. Requires significant filename length (>10 chars) for filename
   * matching to ensure accuracy.
   *
   * @param url1 - First URL to compare.
   * @param url2 - Second URL to compare.
   * @returns True if URLs match using any strategy, false otherwise.
   */
  const isMatchingUrl = (url1: string, url2: string): boolean => {
    if (!url1 || !url2) return false;

    // Direct match
    if (url1 === url2) return true;

    // Remove protocol and domain differences
    const cleanUrl1 =
      url1 && url1.replace(/^https?:\/\/[^\/]+/, "").replace(/^\/+/, "");
    const cleanUrl2 =
      url2 && url2.replace(/^https?:\/\/[^\/]+/, "").replace(/^\/+/, "");

    if (cleanUrl1 === cleanUrl2) return true;

    // Handle placeholder URLs - be more specific
    if (
      (url1.includes("placeholder") && url2.includes("placeholder")) ||
      (url1.includes("/static/images/") && url2.includes("/static/images/"))
    ) {
      return url1 === url2; // Require exact match for placeholders
    }

    // Handle app_data paths - be more specific about filename matching
    if (url1.includes("/app_data/") || url2.includes("/app_data/")) {
      const getFilename = (path: string) => path.split("/").pop() || "";
      const filename1 = getFilename(url1);
      const filename2 = getFilename(url2);
      if (
        filename1 === filename2 &&
        filename1 !== "" &&
        filename1.length > 10
      ) {
        // Ensure significant filename
        return true;
      }
    }

    // Extract and compare filenames for other URLs - be more restrictive
    const getFilename = (path: string) => path.split("/").pop() || "";
    const filename1 = getFilename(url1);
    const filename2 = getFilename(url2);

    if (filename1 === filename2 && filename1 !== "" && filename1.length > 10) {
      // Ensure significant filename
      return true;
    }

    return false; // Remove the overly permissive substring matching
  };

  /**
   * Finds and processes images and icons in the DOM, making them editable.
   *
   * Scans the container for unprocessed image and SVG elements, maps them to
   * slide data paths, and adds click handlers and hover effects. Marks elements
   * as processed to avoid double-processing. Stores cleanup functions on elements
   * for proper event listener removal.
   *
   * Process:
   * 1. Query all unprocessed img and svg elements
   * 2. For each element, find matching data path
   * 3. Add click handler to open appropriate editor
   * 4. Add hover effects for visual feedback
   * 5. Apply image properties (focus point, object-fit) if available
   * 6. Store cleanup function for later removal
   * 7. Track element in editableElements state
   */
  const findAndProcessImages = () => {
    if (!containerRef.current) return;

    const imgElements = containerRef.current.querySelectorAll(
      "img:not([data-editable-processed])",
    );
    const svgElements = containerRef.current.querySelectorAll(
      "svg:not([data-editable-processed])",
    );
    const newEditableElements: EditableElement[] = [];

    imgElements.forEach((img, index) => {
      const htmlImg = img as HTMLImageElement;
      const src = htmlImg.src;

      if (src) {
        const result = findBestDataPath(src, htmlImg, slideData);

        if (result) {
          const { path: dataPath, type, data } = result;

          // Mark as processed to prevent re-processing
          htmlImg.setAttribute("data-editable-processed", "true");

          // Add a unique identifier to help with debugging
          htmlImg.setAttribute(
            "data-editable-id",
            `${slideIndex}-${type}-${dataPath}-${index}`,
          );

          const editableElement: EditableElement = {
            id: `${slideIndex}-${type}-${dataPath}-${index}`,
            type,
            src,
            dataPath,
            data,
            element: htmlImg,
          };

          newEditableElements.push(editableElement);

          // Add click handler directly to the image
          const clickHandler = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveEditor(editableElement);
          };

          htmlImg.addEventListener("click", clickHandler);

          const itemIndex = parseInt(
            `${slideIndex}-${type}-${dataPath}-${index}`.split("-").pop() ||
              "0",
          );
          const propertiesData = properties?.[itemIndex];

          // Add hover effects without changing layout
          htmlImg.style.cursor = "pointer";
          htmlImg.style.transition = "opacity 0.2s, transform 0.2s";
          if (propertiesData?.initialObjectFit) {
            htmlImg.style.objectFit = propertiesData.initialObjectFit;
          }
          if (propertiesData?.initialFocusPoint) {
            htmlImg.style.objectPosition = `${propertiesData.initialFocusPoint.x}% ${propertiesData.initialFocusPoint.y}%`;
          }

          const mouseEnterHandler = () => {
            htmlImg.style.opacity = "0.8";
          };

          const mouseLeaveHandler = () => {
            htmlImg.style.opacity = "1";
          };

          htmlImg.addEventListener("mouseenter", mouseEnterHandler);
          htmlImg.addEventListener("mouseleave", mouseLeaveHandler);

          // Store cleanup functions
          (htmlImg as any)._editableCleanup = () => {
            htmlImg.removeEventListener("click", clickHandler);
            htmlImg.removeEventListener("mouseenter", mouseEnterHandler);
            htmlImg.removeEventListener("mouseleave", mouseLeaveHandler);
            htmlImg.style.cursor = "";
            htmlImg.style.transition = "";
            htmlImg.style.opacity = "";
            htmlImg.style.transform = "";
            htmlImg.removeAttribute("data-editable-processed");
          };
        }
      }
    });

    // Process SVG icons
    svgElements.forEach((svg, index) => {
      const svgEl = svg as SVGElement;
      const wrapperWithUrl = (svgEl as unknown as HTMLElement).closest(
        "[data-path]",
      ) as HTMLElement | null;
      const src = wrapperWithUrl?.getAttribute("data-path") || "";

      if (src) {
        const result = findBestDataPath(src, svgEl, slideData);

        if (result && result.type === "icon") {
          const { path: dataPath, data } = result;

          // Mark as processed to prevent re-processing
          svgEl.setAttribute("data-editable-processed", "true");

          // Add a unique identifier to help with debugging
          svgEl.setAttribute(
            "data-editable-id",
            `${slideIndex}-icon-${dataPath}-svg-${index}`,
          );

          const editableElement: EditableElement = {
            id: `${slideIndex}-icon-${dataPath}-svg-${index}`,
            type: "icon",
            src,
            dataPath,
            data,
            element: svgEl,
          };

          newEditableElements.push(editableElement);

          // Add click handler directly to the svg
          const clickHandler = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveEditor(editableElement);
          };

          svgEl.addEventListener("click", clickHandler);

          // Add hover effects without changing layout
          (svgEl as unknown as HTMLElement).style.cursor = "pointer";
          (svgEl as unknown as HTMLElement).style.transition =
            "opacity 0.2s, transform 0.2s";

          const mouseEnterHandler = () => {
            (svgEl as unknown as HTMLElement).style.opacity = "0.8";
          };

          const mouseLeaveHandler = () => {
            (svgEl as unknown as HTMLElement).style.opacity = "1";
          };

          svgEl.addEventListener("mouseenter", mouseEnterHandler as any);
          svgEl.addEventListener("mouseleave", mouseLeaveHandler as any);

          // Store cleanup functions
          (svgEl as any)._editableCleanup = () => {
            svgEl.removeEventListener("click", clickHandler);
            svgEl.removeEventListener("mouseenter", mouseEnterHandler as any);
            svgEl.removeEventListener("mouseleave", mouseLeaveHandler as any);
            (svgEl as unknown as HTMLElement).style.cursor = "";
            (svgEl as unknown as HTMLElement).style.transition = "";
            (svgEl as unknown as HTMLElement).style.opacity = "";
            (svgEl as unknown as HTMLElement).style.transform = "";
            svgEl.removeAttribute("data-editable-processed");
          };
        }
      }
    });

    setEditableElements((prev) => [...prev, ...newEditableElements]);
  };

  /**
   * Cleanup function to remove event listeners and reset styles.
   *
   * Iterates through all tracked editable elements and calls their cleanup
   * functions to remove event listeners and reset inline styles. Called on
   * component unmount or when slideData changes to prevent memory leaks.
   */
  const cleanupElements = () => {
    editableElements.forEach(({ element }) => {
      if ((element as any)._editableCleanup) {
        (element as any)._editableCleanup();
      }
    });
    setEditableElements([]);
  };

  /**
   * Effect: Process images after DOM is rendered.
   *
   * Waits 400ms after mount or slideData change to ensure DOM is fully rendered
   * before scanning for images/icons. Cleans up event listeners on unmount or
   * when dependencies change.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      findAndProcessImages();
    }, 400);

    return () => {
      clearTimeout(timer);
      cleanupElements();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideData, children]);

  /**
   * Effect: Watch for dynamic content changes.
   *
   * Uses MutationObserver to detect when new images or SVGs are added to the
   * DOM (e.g., from lazy loading or dynamic rendering). When new media elements
   * are detected, re-runs findAndProcessImages to make them editable.
   *
   * Observes the entire container subtree for added nodes matching img or svg
   * tags. Uses a short delay (100ms) before processing to allow rendering to
   * complete.
   */
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new MutationObserver((mutations) => {
      const hasNewMedia = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some(
          (node) =>
            node.nodeType === Node.ELEMENT_NODE &&
            ((node as Element).tagName === "IMG" ||
              (node as Element).tagName === "SVG" ||
              (node as Element).querySelector(
                "img:not([data-editable-processed]), svg:not([data-editable-processed])",
              )),
        ),
      );

      if (hasNewMedia) {
        setTimeout(findAndProcessImages, 100);
      }
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideData]);

  /**
   * Handles closing the active editor.
   *
   * Clears the activeEditor state, which closes the editor modal and allows
   * other elements to be edited.
   */
  const handleEditorClose = () => {
    setActiveEditor(null);
  };

  /**
   * Handles image change from ImageEditor.
   *
   * When user selects a new image in ImageEditor, updates both the DOM element
   * (for immediate visual feedback) and the Zustand store (for persistence).
   * Uses the activeEditor's dataPath to update the correct field in slideData.
   *
   * @param newImageUrl - URL string of the newly selected image.
   * @param prompt - Optional prompt string used to generate the image.
   */
  const handleImageChange = (newImageUrl: string, prompt?: string) => {
    if (activeEditor && activeEditor.element) {
      // Update the DOM element immediately for visual feedback
      (activeEditor.element as HTMLImageElement).src = newImageUrl;

      // Update Zustand store for persistence
      updateSlideImage(
        slideIndex,
        activeEditor.dataPath,
        newImageUrl,
        prompt || activeEditor.data?.__image_prompt__ || "",
      );
      setActiveEditor(null);
    }
  };

  /**
   * Handles icon change from IconsEditor.
   *
   * When user selects a new icon in IconsEditor, updates the Zustand store
   * using the activeEditor's dataPath. Icons are typically SVGs that get
   * replaced entirely, so DOM update is handled by the slide re-render.
   *
   * @param newIconUrl - URL string of the newly selected icon.
   * @param query - Optional search query used to find the icon.
   */
  const handleIconChange = (newIconUrl: string, query?: string) => {
    console.log("newIconUrl", newIconUrl);
    if (activeEditor && activeEditor.element) {
      // Update Zustand store for persistence
      updateSlideIcon(
        slideIndex,
        activeEditor.dataPath,
        newIconUrl,
        query || activeEditor.data?.__icon_query__ || "",
      );
    }
  };

  /**
   * Handles focus point and object-fit property changes.
   *
   * When user adjusts image properties in ImageEditor, updates both the DOM
   * element (for immediate visual feedback) and the Zustand store (for persistence).
   * Extracts the image index from the editable element ID to update the correct
   * properties entry.
   *
   * @param propertiesData - ImageProperties object containing focus point and object-fit.
   */
  const handleFocusPointClick = (propertiesData: any) => {
    const id = activeEditor?.id;
    const editableId = document.querySelector(`[data-editable-id="${id}"]`);

    if (editableId) {
      const editableElement = editableId as HTMLImageElement;
      editableElement.style.objectFit = propertiesData.initialObjectFit;
      editableElement.style.objectPosition = `${propertiesData.initialFocusPoint.x}% ${propertiesData.initialFocusPoint.y}%`;
    }

    updateImageProperties(
      slideIndex,
      parseInt(activeEditor?.id.split("-").pop() || "0"),
      propertiesData,
    );
  };

  return (
    <div ref={containerRef} className="editable-layout-wrapper w-full">
      {children}

      {/* Render ImageEditor when an image is being edited */}
      {activeEditor && activeEditor.type === "image" && (
        <ImageEditor
          initialImage={activeEditor.src}
          slideIndex={slideIndex}
          promptContent={activeEditor.data?.__image_prompt__ || ""}
          imageIdx={0}
          properties={null}
          onClose={handleEditorClose}
          onImageChange={handleImageChange}
          onFocusPointClick={handleFocusPointClick}
        ></ImageEditor>
      )}

      {/* Render IconsEditor when an icon is being edited */}
      {activeEditor && activeEditor.type === "icon" && (
        <IconsEditor
          icon_prompt={
            activeEditor.data?.__icon_query__
              ? [activeEditor.data.__icon_query__]
              : []
          }
          onClose={handleEditorClose}
          onIconChange={handleIconChange}
        ></IconsEditor>
      )}
    </div>
  );
};

export default EditableLayoutWrapper;
