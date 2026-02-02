import { NextRequest } from "next/server";
import { handleIconsSearch } from "../../ppt/handlers/icons";

/**
 * Runtime configuration for this API route.
 * - nodejs: Runs on Node.js runtime (required for icon library access)
 * - maxDuration: Maximum execution time of 300 seconds (5 minutes)
 * - force-dynamic: Always generates dynamic responses (no caching)
 */
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

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
 * @param request - The HTTP request object containing query parameters.
 * @returns A JSON response containing an array of icon objects matching the search query.
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/icons/search?query=arrow&limit=10
 * // Response: [{ name: "arrow-right", ... }, { name: "arrow-left", ... }, ...]
 * ```
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  return handleIconsSearch(url);
}
