/**
 * Remote SVG icon loading and transformation utilities.
 *
 * Provides functionality to fetch SVG icons from remote URLs, transform them
 * with custom styling options, and cache them for performance. Includes a
 * React hook for easy integration and a component for rendering transformed SVGs.
 */

import React from "react";

/**
 * Options for transforming remote SVG icons.
 *
 * @property strokeColor - Color to apply to SVG stroke attributes.
 * @property fillColor - Color to apply to SVG fill attributes. Use "none"
 *   to remove fill.
 * @property className - CSS class name to apply to the SVG element.
 * @property title - Accessible title/aria-label for the icon.
 * @property color - CSS color value to apply via inline style (overrides
 *   strokeColor for some icons).
 */
export type RemoteSvgOptions = {
  strokeColor?: string;
  fillColor?: string;
  className?: string;
  title?: string;
  color?: string;
 
};

/**
 * Transforms SVG markup with custom styling options.
 *
 * Parses SVG text, applies custom styling (stroke, fill, className), and
 * removes decorative frame rectangles that cover the entire viewBox. Uses
 * DOM manipulation to safely modify SVG attributes without breaking the
 * structure.
 *
 * @param svgText - Raw SVG markup as a string.
 * @param options - Transformation options (colors, className, etc.).
 * @returns Transformed SVG markup string, or original if transformation fails.
 */
function transformSvg(svgText: string, options: RemoteSvgOptions): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const svgEl = doc.querySelector("svg");
    if (!svgEl) return svgText;
    svgEl.style.outline = "none";
    svgEl.style.border = "none";
    svgEl.style.margin = "0";
    svgEl.style.padding = "0";
    svgEl.style.display = "inline-block";
    svgEl.style.verticalAlign = "middle";
    svgEl.style.overflow = "visible";
    svgEl.style.position = "relative";
    // Set only provided attributes to avoid clobbering inner shapes
    if (options.className) svgEl.setAttribute("class", options.className);
    if (options.strokeColor) svgEl.setAttribute("stroke", options.strokeColor);
    if (options.fillColor !== undefined) svgEl.setAttribute("fill", options.fillColor);

  
      const viewBox = svgEl.getAttribute("viewBox");
      let vbX = 0, vbY = 0, vbW = 0, vbH = 0;
      if (viewBox) {
        const parts = viewBox.split(/\s+/).map((n) => Number(n));
        if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
          vbX = parts[0];
          vbY = parts[1];
          vbW = parts[2];
          vbH = parts[3];
        }
      }
      // Only consider direct child rects; safer heuristic
      const rects = Array.from(svgEl.querySelectorAll("rect")).filter((r) => r.parentNode === svgEl);
      rects.forEach((r) => {
        const xAttr = r.getAttribute("x") || "0";
        const yAttr = r.getAttribute("y") || "0";
        const wAttr = r.getAttribute("width") || "";
        const hAttr = r.getAttribute("height") || "";
        const fill = r.getAttribute("fill");

        const x = Number(xAttr);
        const y = Number(yAttr);
        const w = Number(wAttr);
        const h = Number(hAttr);

        const isExactHundredPercent = wAttr === "100%" && hAttr === "100%" && (xAttr === "0" || xAttr === "0%") && (yAttr === "0" || yAttr === "0%");
        const approximatelyCoversViewBox = (
          vbW > 0 && vbH > 0 &&
          !Number.isNaN(w) && !Number.isNaN(h) &&
          Math.abs(w - vbW) <= Math.max(1, vbW * 0.02) &&
          Math.abs(h - vbH) <= Math.max(1, vbH * 0.02) &&
          Math.abs(x - vbX) <= Math.max(1, vbW * 0.02) &&
          Math.abs(y - vbY) <= Math.max(1, vbH * 0.02)
        );
        const noFill = (fill === null || fill === "none" || fill === "transparent");

        const looksLikeFrame = noFill && (isExactHundredPercent || approximatelyCoversViewBox);
        if (looksLikeFrame) {
          r.parentElement?.removeChild(r);
        }
      });
    

    return svgEl.outerHTML;
  } catch {
    return svgText;
  }
}

/**
 * LRU cache configuration for transformed SVG markup.
 *
 * Limits cache size to prevent memory issues while maintaining performance
 * for frequently used icons.
 */
const SVG_CACHE_LIMIT = 15;
const svgCache: Map<string, string> = new Map();

/**
 * Generates a cache key for SVG transformations.
 *
 * Creates a unique key based on the URL and transformation options to
 * enable cache lookups for transformed SVGs.
 *
 * @param url - The SVG URL.
 * @param options - Transformation options.
 * @returns A cache key string combining URL and options.
 */
function makeCacheKey(url: string, options: RemoteSvgOptions): string {
  return [
    url,
    `sc=${options.strokeColor || ""}`,
    `fc=${options.fillColor || ""}`,
    `cls=${options.className || ""}`,
    
  ].join("|");
}

/**
 * Retrieves a value from the SVG cache (LRU).
 *
 * Implements LRU cache behavior by moving accessed items to the end of
 * the Map, ensuring recently used items are preserved.
 *
 * @param key - Cache key to look up.
 * @returns Cached SVG markup, or undefined if not found.
 */
function cacheGet(key: string): string | undefined {
  const value = svgCache.get(key);
  if (value !== undefined) {
    // refresh LRU order
    svgCache.delete(key);
    svgCache.set(key, value);
  }
  return value;
}

/**
 * Stores a value in the SVG cache (LRU).
 *
 * Adds or updates a cache entry and removes the oldest entry if the cache
 * exceeds the size limit, maintaining LRU eviction behavior.
 *
 * @param key - Cache key to store.
 * @param value - SVG markup to cache.
 */
function cacheSet(key: string, value: string) {
  if (svgCache.has(key)) svgCache.delete(key);
  svgCache.set(key, value);
  if (svgCache.size > SVG_CACHE_LIMIT) {
    const oldestKey = svgCache.keys().next().value as string | undefined;
    if (oldestKey !== undefined) svgCache.delete(oldestKey);
  }
}

/**
 * React hook for loading and transforming remote SVG icons.
 *
 * Fetches SVG icons from remote URLs, transforms them with custom styling,
 * and caches the results. Handles errors gracefully by returning fallback
 * SVG markup. Automatically refetches when URL or options change.
 *
 * @param url - Optional URL to fetch SVG from. If not provided, returns
 *   a fallback SVG icon.
 * @param options - Transformation options (colors, className, etc.).
 * @returns Object with `svgMarkup` (transformed SVG string) and `error`
 *   (error message if fetch/transformation failed).
 */
export function useRemoteSvgIcon(url?: string, options: RemoteSvgOptions = {}) {
  const [svgMarkup, setSvgMarkup] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!url) {
        // build simple fallback svg
        const stroke = options.strokeColor || "currentColor";
        const fill = options.fillColor ?? "none";
        const cls = options.className ? ` class=\"${options.className}\"` : "";
        setSvgMarkup(`<svg${cls} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' stroke='${stroke}' fill='${fill}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10' fill='currentColor' opacity='0.12'></circle><path d='M8 12l3 3 5-6' fill='none'></path></svg>`);
        return;
      }
      // non-svg extensions fallback
      if (/\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(url)) {
        const stroke = options.strokeColor || "currentColor";
        const fill = options.fillColor ?? "none";
        const cls = options.className ? ` class=\"${options.className}\"` : "";
        setSvgMarkup(`<svg${cls} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' stroke='${stroke}' fill='${fill}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10' fill='currentColor' opacity='0.12'></circle><path d='M8 12l3 3 5-6' fill='none'></path></svg>`);
        return;
      }

      // Cache lookup
      const cacheKey = makeCacheKey(url, options);
      const cached = cacheGet(cacheKey);
      if (cached) {
        setSvgMarkup(cached);
        setError(null);
        return;
      }
      try {
       
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const ct = res.headers.get("content-type") || "";
        if (ct && !ct.includes("svg")) {
          throw new Error(`Non-SVG content: ${ct}`);
        }
        const text = await res.text();
        if (cancelled) return;
        const transformed = transformSvg(text, options);
        cacheSet(cacheKey, transformed);
        setSvgMarkup(transformed);
        setError(null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load SVG");
        const stroke = options.strokeColor || "currentColor";
        const fill = options.fillColor ?? "none";
        const cls = options.className ? ` class=\"${options.className}\"` : "";
        setSvgMarkup(`<svg${cls} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' stroke='${stroke}' fill='${fill}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10' fill='currentColor' opacity='0.12'></circle><path d='M8 12l3 3 5-6' fill='none'></path></svg>`);
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn("RemoteSvgIcon fetch error", e);
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [url, options.strokeColor, options.fillColor, options.className]);

  return { svgMarkup, error };
}

/**
 * Props for the RemoteSvgIcon component.
 *
 * @property url - Optional URL to fetch SVG from.
 * @property strokeColor - Color for SVG stroke.
 * @property fillColor - Color for SVG fill.
 * @property className - CSS class name for the SVG.
 * @property title - Accessible title/aria-label.
 * @property color - CSS color value for inline styling.
 */
export const RemoteSvgIcon: React.FC<{
  url?: string;
  strokeColor?: string;
  fillColor?: string;
  className?: string;
  title?: string;
  color?: string;
}> = ({ url, strokeColor, fillColor, className, title, color }) => {
  /**
   * Remote SVG icon component.
   *
   * Renders an SVG icon fetched from a remote URL with custom styling.
   * Uses the useRemoteSvgIcon hook internally and renders the transformed
   * SVG markup using dangerouslySetInnerHTML. Returns null while loading.
   *
   * @param url - URL to fetch SVG from.
   * @param strokeColor - Color for stroke.
   * @param fillColor - Color for fill.
   * @param className - CSS class name.
   * @param title - Accessible title.
   * @param color - CSS color for inline style.
   * @returns A span element containing the transformed SVG, or null if loading.
   */
  const { svgMarkup } = useRemoteSvgIcon(url, { strokeColor, fillColor, className, title, color });
  if (!svgMarkup) return null;
  return (
    <span
      data-path={url}
      role={title ? "img" : undefined}
      aria-label={title}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
      style={{ display: "inline-block", color: color }}
    />
  );
};