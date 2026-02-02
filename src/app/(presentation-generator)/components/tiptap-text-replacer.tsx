/**
 * Text replacer component that converts static HTML text to editable TipTap editors.
 *
 * This component scans the DOM for text elements and replaces them with TipTap
 * rich text editors, enabling inline editing of slide content. It preserves styling,
 * handles gradient text, and maps text content to slide data paths for persistence.
 *
 * Features:
 * - Automatic text element detection and replacement
 * - Style preservation (font, color, gradient, spacing)
 * - Data path mapping for content synchronization
 * - Gradient text support via CSS variables
 * - Ignores interactive elements (tables, SVGs, forms, etc.)
 * - React root management for dynamic updates
 * - Content synchronization when slideData changes
 *
 * The component uses a delayed replacement strategy (1s delay) to ensure DOM is
 * fully rendered before processing. It tracks processed elements to avoid
 * double-processing and maintains React roots for each editor instance.
 *
 * This is a complex component that bridges static HTML rendering with dynamic
 * React editing, enabling WYSIWYG editing of slide content.
 */

"use client";

import React, { useRef, useEffect, useState, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import TiptapText from "./tiptap-text";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Underline from "@tiptap/extension-underline";

const extensions = [StarterKit, Markdown, Underline];

/**
 * Props for the TiptapTextReplacer component.
 *
 * @property children - React nodes containing the HTML content to process.
 *   These are rendered first, then text elements are replaced with editors.
 * @property slideData - Optional slide data object used to map text content
 *   to data paths. Used to find matching text in the data structure.
 * @property slideIndex - Optional zero-based index of the slide being edited.
 *   Passed to onContentChange callback for slide identification.
 * @property onContentChange - Optional callback invoked when editor content changes.
 *   Receives the new markdown content, data path, and slide index.
 */
interface TiptapTextReplacerProps {
  children: ReactNode;
  slideData?: unknown;
  slideIndex?: number;
  onContentChange?: (
    content: string,
    path: string,
    slideIndex?: number,
  ) => void;
}

/**
 * Text replacer component for converting static text to editable editors.
 *
 * Processes children DOM to find text elements and replace them with TipTap
 * editors. Preserves styling and maps content to slide data paths.
 *
 * @param props - Component props containing children, slide data, and callbacks.
 * @returns JSX element containing the processed content with editable text.
 */
const TiptapTextReplacer: React.FC<TiptapTextReplacerProps> = ({
  children,
  slideData,
  slideIndex,
  onContentChange = () => {},
}) => {
  // Ref to container element containing the HTML to process
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track which elements have already been processed to avoid double-processing
  const [processedElements, setProcessedElements] = useState(
    new Set<HTMLElement>(),
  );
  
  /**
   * Ref tracking React roots for each editor instance.
   *
   * Maps container elements to their React root and associated metadata.
   * Used to update editor content when slideData changes externally.
   */
  const rootsRef = useRef<
    Map<HTMLElement, { root: ReactDOM.Root; dataPath: string; fallbackText: string }>
  >(new Map());
  
  /**
   * Effect: Replace text elements with TipTap editors.
   *
   * Scans the DOM for text elements and replaces them with TipTap editors.
   * Runs after a 1s delay to ensure DOM is fully rendered. Processes elements
   * only once and preserves styling and data paths.
   */
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    /**
     * Main function that replaces text elements with TipTap editors.
     *
     * Iterates through all elements in the container, identifies text elements
     * that should be editable, and replaces them with TipTap editor instances.
     * Preserves styling, handles gradient text, and maps content to data paths.
     */
    const replaceTextElements = () => {
      // Get all elements in the container
      const allElements = container.querySelectorAll("*");

      allElements.forEach((element) => {
        const htmlElement = element as HTMLElement;

        // Skip if already processed

        if (
          processedElements.has(htmlElement) ||
          htmlElement.classList.contains("tiptap-text-editor") ||
          htmlElement.closest(".tiptap-text-editor")
        ) {
          return;
        }

        // console.log("htmlElement", htmlElement);
        // Skip if element is inside an ignored element tree
        if (isInIgnoredElementTree(htmlElement)) return;

        // Get direct text content (not from child elements)
        const directTextContent = getDirectTextContent(htmlElement);
        const trimmedText = directTextContent.trim();

        // Check if element has meaningful text content
        if (!trimmedText || trimmedText.length <= 2) return;

        // Skip elements that contain other elements with text (to avoid double processing)
        if (hasTextChildren(htmlElement)) return;

        // Skip certain element types that shouldn't be editable
        if (shouldSkipElement(htmlElement)) return;

        // Get all computed styles to preserve them (including React inline styles)
        const allClasses = Array.from(htmlElement.classList);
        const computedStyle = window.getComputedStyle(htmlElement);

        const dataPath = findDataPath(slideData, trimmedText);

        // Create a container for the TiptapText
        const tiptapContainer = document.createElement("div");
        tiptapContainer.className = Array.from(allClasses).join(" ");

        // Check if element has gradient text (background-clip: text)
        const backgroundClip =
          computedStyle.getPropertyValue("background-clip") ||
          computedStyle.getPropertyValue("-webkit-background-clip");
        const hasGradientText = backgroundClip === "text";

        if (hasGradientText) {
          // For gradient text, use CSS variables and a special class
          const bgImage = computedStyle.getPropertyValue("background-image");
          tiptapContainer.style.setProperty("--gradient-bg", bgImage);
          tiptapContainer.classList.add("gradient-text-container");
        }

        // Copy important styles
        const stylesToCopy = [
          "fontSize",
          "fontWeight",
          "fontFamily",
          "lineHeight",
          "textAlign",
          "letterSpacing",
        ];

        stylesToCopy.forEach((prop) => {
          const value = computedStyle.getPropertyValue(
            prop.replace(/([A-Z])/g, "-$1").toLowerCase(),
          );
          if (value && value !== "none" && value !== "normal") {
            tiptapContainer.style.setProperty(
              prop.replace(/([A-Z])/g, "-$1").toLowerCase(),
              value,
            );
          }
        });

        // If not gradient text, copy color
        if (!hasGradientText) {
          const color = computedStyle.getPropertyValue("color");
          if (color) {
            tiptapContainer.style.setProperty("color", color);
          }
        }

        // Also copy the original style attribute if it exists (except gradient-related)
        const originalStyle = htmlElement.getAttribute("style");
        if (originalStyle && !hasGradientText) {
          const tempDiv = document.createElement("div");
          tempDiv.style.cssText = originalStyle;
          for (let i = 0; i < tempDiv.style.length; i++) {
            const propName = tempDiv.style[i];
            tiptapContainer.style.setProperty(
              propName,
              tempDiv.style.getPropertyValue(propName),
            );
          }
        }

        // Replace the element
        if (htmlElement.parentNode) {
          htmlElement.parentNode.replaceChild(tiptapContainer, htmlElement);
          // Mark as processed
          htmlElement.innerHTML = "";
        }
        setProcessedElements((prev) => new Set(prev).add(htmlElement));
        // Render TiptapText
        const root = ReactDOM.createRoot(tiptapContainer);
        const initialContent = dataPath.path
          ? (getValueByPath(slideData, dataPath.path) ?? trimmedText)
          : trimmedText;
        rootsRef.current.set(tiptapContainer, {
          root,
          dataPath: dataPath.path,

          fallbackText: trimmedText,
        });
        root.render(
          <TiptapText
            content={initialContent}
            onContentChange={(content: string) => {
              if (dataPath && onContentChange) {
                onContentChange(content, dataPath.path, slideIndex);
              }
            }}
            placeholder="Enter text..."
          />,
        );
      });
    };

    // Replace text elements after a short delay to ensure DOM is ready
    // This allows React components to fully render before processing
    const timer = setTimeout(replaceTextElements, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [slideData, slideIndex]);

  /**
   * Effect: Update existing editors when slideData changes.
   *
   * When slideData prop changes externally, updates all existing editor
   * instances with new content from their mapped data paths. Uses the
   * stored rootsRef to access each editor's React root and re-render
   * with updated content.
   */
  useEffect(() => {
    if (!rootsRef.current || rootsRef.current.size === 0) return;
    rootsRef.current.forEach(({ root, dataPath, fallbackText }) => {
      const newContent = dataPath
        ? (getValueByPath(slideData, dataPath) ?? fallbackText)
        : fallbackText;
      root.render(
        <TiptapText
          content={newContent}
          onContentChange={(content: string) => {
            if (dataPath && onContentChange) {
              onContentChange(content, dataPath, slideIndex);
            }
          }}
          placeholder="Enter text..."
        />,
      );
    });
  }, [slideData, slideIndex]);
  
  // Helper functions for text element processing and data path resolution
  // Function to check if element is inside an ignored element tree
  const isInIgnoredElementTree = (element: HTMLElement): boolean => {
    // List of element types that should be ignored entirely with all their children
    const ignoredElementTypes = [
      "TABLE",
      "TBODY",
      "THEAD",
      "TFOOT",
      "TR",
      "TD",
      "TH", // Table elements
      "SVG",
      "G",
      "PATH",
      "CIRCLE",
      "RECT",
      "LINE", // SVG elements
      "CANVAS", // Canvas element
      "VIDEO",
      "AUDIO", // Media elements
      "IFRAME",
      "EMBED",
      "OBJECT", // Embedded content
      "SELECT",
      "OPTION",
      "OPTGROUP", // Select dropdown elements
      "SCRIPT",
      "STYLE",
      "NOSCRIPT", // Script/style elements
    ];

    // List of class patterns that indicate ignored element trees
    const ignoredClassPatterns = [
      "chart",
      "graph",
      "visualization", // Chart/graph components
      "menu",
      "dropdown",
      "tooltip", // UI components
      "editor",
      "wysiwyg", // Editor components
      "calendar",
      "datepicker", // Date picker components
      "slider",
      "carousel",
      "flowchart",
      "mermaid",
      "diagram",
    ];

    // Check if current element or any parent is in ignored list
    let currentElement: HTMLElement | null = element;
    while (currentElement) {
      // Check element type
      if (ignoredElementTypes.includes(currentElement.tagName)) {
        return true;
      }

      // Check class patterns
      const className =
        currentElement.className.length > 0
          ? currentElement.className.toLowerCase()
          : "";
      if (ignoredClassPatterns.some((pattern) => className.includes(pattern))) {
        return true;
      }
      if (currentElement.id.includes("mermaid")) {
        return true;
      }

      // Check for specific attributes that indicate non-text content
      if (
        currentElement.hasAttribute("contenteditable") ||
        currentElement.hasAttribute("data-chart") ||
        currentElement.hasAttribute("data-visualization") ||
        currentElement.hasAttribute("data-interactive")
      ) {
        return true;
      }

      currentElement = currentElement.parentElement;
    }
    return false;
  };

  /**
   * Resolves nested values by dot-notation path.
   *
   * Traverses an object using a path string like "a.b[0].c" to extract
   * nested values. Handles both dot notation and array bracket notation.
   *
   * @param obj - Object to traverse.
   * @param path - Dot-notation path string (e.g., "content.title" or "items[0].name").
   * @returns The value at the path, or undefined if path doesn't exist.
   *
   * @example
   * ```typescript
   * getValueByPath({ a: { b: [{ c: "value" }] } }, "a.b[0].c")
   * // Returns: "value"
   * ```
   */
  const getValueByPath = (obj: any, path: string): any => {
    if (!obj || !path) return undefined;
    const tokens = path
      .replace(/\[(\d+)\]/g, ".$1")
      .split(".")
      .filter(Boolean);
    let current: any = obj;
    for (const token of tokens) {
      if (current == null) return undefined;
      current = current[token as keyof typeof current];
    }
    return current;
  };

  /**
   * Gets only direct text content from an element, excluding child elements.
   *
   * Extracts text from direct text nodes only, ignoring text from nested
   * elements. Used to identify elements that contain only text (not
   * structured content).
   *
   * @param element - HTML element to extract text from.
   * @returns Text content from direct text nodes only.
   */
  const getDirectTextContent = (element: HTMLElement): string => {
    let text = "";
    const childNodes = Array.from(element.childNodes);
    for (const node of childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || "";
      }
    }
    return text;
  };

  /**
   * Checks if an element has child elements containing text.
   *
   * Determines whether an element should be skipped because it contains
   * child elements with text (which would be processed separately).
   * Prevents double-processing of nested text elements.
   *
   * @param element - HTML element to check.
   * @returns True if element has children with text, false otherwise.
   */
  const hasTextChildren = (element: HTMLElement): boolean => {
    const children = Array.from(element.children) as HTMLElement[];
    return children.some((child) => {
      const childText = getDirectTextContent(child).trim();
      return childText.length > 1;
    });
  };

  /**
   * Determines if an element should be skipped for text replacement.
   *
   * Checks various conditions to determine if an element shouldn't be
   * converted to an editor (form elements, interactive elements, containers,
   * very short text, etc.). Works in conjunction with isInIgnoredElementTree
   * to filter out non-editable elements.
   *
   * @param element - HTML element to check.
   * @returns True if element should be skipped, false if it can be edited.
   */
  const shouldSkipElement = (element: HTMLElement): boolean => {
    // Skip form elements
    if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(element.tagName)) {
      return true;
    }

    // Skip elements with certain roles or types
    if (
      element.hasAttribute("role") ||
      element.hasAttribute("aria-label") ||
      element.hasAttribute("data-testid")
    ) {
      return true;
    }

    // Skip elements that contain interactive content (simplified since we now use isInIgnoredElementTree)
    if (
      element.querySelector(
        "img, svg, button, input, textarea, select, a[href]",
      )
    ) {
      return true;
    }

    // Skip container elements (elements that primarily serve as layout containers)
    const containerClasses = [
      "grid",
      "flex",
      "space-",
      "gap-",
      "container",
      "wrapper",
    ];
    const hasContainerClass = containerClasses.some((cls) =>
      element.className.length > 0 ? element.className.includes(cls) : false,
    );
    if (hasContainerClass) return true;

    // Skip very short text that might be UI elements
    const text = getDirectTextContent(element).trim();
    if (text.length < 2) return true;

    // Skip elements that look like numbers or single characters (might be icons/UI)
    // if (/^[0-9]+$/.test(text) || text.length === 1) return true;
    if (text.length < 3) return true;

    return false;
  };

  /**
   * Finds the data path for a given text content in slide data.
   *
   * Recursively searches through slide data structure to find where
   * a specific text string is stored. Returns the dot-notation path
   * to that data and the original text value.
   *
   * Used to map DOM text content to slide data paths for persistence.
   *
   * @param data - Slide data object to search.
   * @param targetText - Text string to find in the data.
   * @param path - Current path prefix (used for recursion).
   * @returns Object containing the data path and original text, or empty
   *   strings if not found.
   *
   * @example
   * ```typescript
   * findDataPath({ title: "Hello", body: "World" }, "Hello")
   * // Returns: { path: "title", originalText: "Hello" }
   * ```
   */
  const findDataPath = (
    data: any,
    targetText: string,
    path = "",
  ): {
    path: string;
    originalText: string;
  } => {
    if (!data || typeof data !== "object")
      return { path: "", originalText: "" };

    for (const [key, value] of Object.entries(data)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === "string" && value.trim() === targetText.trim()) {
        return { path: currentPath, originalText: value };
      }

      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const result = findDataPath(
            value[i],
            targetText,
            `${currentPath}[${i}]`,
          );
          if (result.path) return result;
        }
      } else if (typeof value === "object" && value !== null) {
        const result = findDataPath(value, targetText, currentPath);
        if (result.path) return result;
      }
    }
    return { path: "", originalText: "" };
  };

  return (
    <div ref={containerRef} className="tiptap-text-replacer">
      {children}
    </div>
  );
};

export default TiptapTextReplacer;
