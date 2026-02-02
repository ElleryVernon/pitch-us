/**
 * React hook for dynamically loading Google Fonts.
 *
 * Injects @import statements for Google Fonts into the document head,
 * allowing fonts to be loaded on-demand. Prevents duplicate font loading
 * by checking for existing style tags.
 */

/**
 * Hook for loading fonts dynamically.
 *
 * Injects Google Fonts import statements into the document head. Handles
 * both Google Fonts URLs and local font URLs (prefixed with localhost).
 * Skips fonts that are already loaded to prevent duplicates.
 *
 * @param fonts - Array of font URLs to load. Can be Google Fonts URLs
 *   or local font paths (which will be prefixed with localhost:5000).
 *
 * @example
 * ```typescript
 * useFontLoader([
 *   "https://fonts.googleapis.com/css2?family=Inter",
 *   "/fonts/custom-font.woff2"
 * ]);
 * ```
 */
export const useFontLoader = ( fonts:string[]) => {
    const injectFonts = (fontUrls: string[]) => {
        fontUrls.forEach((fontUrl) => {
          if (!fontUrl) return;
          let newFontUrl = fontUrl.includes('fonts.googleapis') ? fontUrl : `https://localhost:5000${fontUrl}`;
          const existingStyle = document.querySelector(`style[data-font-url="${newFontUrl}"]`);
          if (existingStyle) return;
          const style = document.createElement("style");
          style.setAttribute("data-font-url", newFontUrl);
          style.textContent = `@import url('${newFontUrl}');`;
          document.head.appendChild(style);
        });
      };
      injectFonts(fonts);
};