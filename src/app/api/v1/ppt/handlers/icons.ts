import { searchIcons } from "@/server/icons";

import { jsonResponse } from "../utils/responses";

/**
 * Handles GET requests to search for icons.
 *
 * Searches through available icon libraries (likely Lucide or similar) and
 * returns matching icons based on a search query. Useful for allowing users
 * to find and select icons for their presentations.
 *
 * Query parameters:
 * - `query` (optional): Search term to match against icon names (default: empty string)
 * - `limit` (optional): Maximum number of results to return (default: 20)
 *
 * @param url - URL object containing query parameters for the search.
 * @returns A JSON response containing an array of icon objects matching
 *   the search query, limited to the specified number of results.
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/icons/search?query=arrow&limit=10
 * const url = new URL(request.url);
 * const response = await handleIconsSearch(url);
 * // Response: [{ name: "arrow-right", ... }, { name: "arrow-left", ... }, ...]
 * ```
 */
export const handleIconsSearch = (url: URL) => {
  const query = url.searchParams.get("query") || "";
  const limit = Number(url.searchParams.get("limit") || "20");
  // Use default limit of 20 if limit is not a valid number
  return jsonResponse(searchIcons(query, Number.isNaN(limit) ? 20 : limit));
};
