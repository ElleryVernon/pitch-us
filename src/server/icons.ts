/**
 * Icon search and management utilities.
 *
 * This module provides functions for searching and retrieving icon references
 * from an icon index file. Icons are stored as SVG files and indexed by name
 * and tags for efficient searching. The icon index is cached in memory after
 * first load for performance.
 */

import fs from "node:fs";
import path from "node:path";

/**
 * Structure of the icons index file.
 *
 * Represents the JSON structure of the icons index, which contains metadata
 * about available icons including their names and search tags.
 *
 * @property icons - Array of icon metadata objects.
 * @property icons[].name - Icon name/identifier (e.g., "check", "arrow-right").
 *   Used to construct the icon file path.
 * @property icons[].tags - Array of tag strings for searching. Tags help
 *   users find icons by keywords (e.g., ["check", "success", "done"]).
 */
type IconsIndex = {
  icons: { name: string; tags: string[] }[];
};

/**
 * Cached icons index to avoid repeated file reads.
 *
 * The icons index is loaded once and cached in memory. This improves
 * performance for repeated icon searches without re-reading the file.
 */
let cachedIcons: IconsIndex | null = null;

/**
 * Loads the icons index from the file system.
 *
 * Reads the icons index JSON file from common locations (assets/icons.json
 * or public/icons.json). The result is cached to avoid repeated file reads.
 * If no icons file is found, returns an empty index.
 *
 * @returns IconsIndex object containing all available icons and their metadata.
 *   Returns an empty index ({ icons: [] }) if no icons file is found.
 */
const loadIcons = (): IconsIndex => {
  if (cachedIcons) {
    return cachedIcons;
  }
  const candidates = [
    path.resolve(process.cwd(), "assets", "icons.json"),
    path.resolve(process.cwd(), "public", "icons.json"),
  ];
  const iconsPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!iconsPath) {
    cachedIcons = { icons: [] };
    return cachedIcons;
  }
  const raw = fs.readFileSync(iconsPath, "utf-8");
  cachedIcons = JSON.parse(raw) as IconsIndex;
  return cachedIcons;
};

/**
 * Searches for icons matching a query string.
 *
 * Searches the icons index for icons whose name or tags contain the query
 * string (case-insensitive). Returns an array of icon file paths that can
 * be used to display the icons.
 *
 * The search matches if:
 * - The icon name contains the query string, OR
 * - Any of the icon's tags contains the query string
 *
 * Results are limited to the specified number and returned as file paths
 * relative to the static icons directory.
 *
 * @param query - Search query string. Empty queries return no results.
 * @param limit - Maximum number of results to return. Results beyond this
 *   limit are discarded.
 * @returns Array of icon file paths (e.g., "/static/icons/bold/check.svg").
 *   Returns an empty array if query is empty, no icons are available, or
 *   no matches are found.
 *
 * @example
 * ```typescript
 * const icons = searchIcons("check", 10);
 * // Returns: ["/static/icons/bold/check.svg", "/static/icons/bold/checkmark.svg", ...]
 * ```
 */
export const searchIcons = (query: string, limit: number): string[] => {
  if (!query) return [];
  const normalized = query.toLowerCase();
  const icons = loadIcons().icons;
  if (!icons.length) return [];
  const matches = icons.filter((icon) => {
    const name = icon.name.toLowerCase();
    if (name.includes(normalized)) {
      return true;
    }
    return icon.tags.some((tag) => tag.toLowerCase().includes(normalized));
  });
  return matches
    .slice(0, limit)
    .map((icon) => `/static/icons/bold/${icon.name}.svg`);
};
