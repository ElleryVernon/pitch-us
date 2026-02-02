import { NextRequest } from "next/server";
import { handlePresentationGetDrafts } from "../../ppt/handlers/presentation";

/**
 * Runtime configuration for this API route.
 * - nodejs: Runs on Node.js runtime (required for database access)
 * - maxDuration: Maximum execution time of 300 seconds (5 minutes)
 * - force-dynamic: Always generates dynamic responses (no caching)
 */
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Handles GET requests to retrieve draft presentations with pagination.
 *
 * Draft presentations are those that have been created but do not yet have
 * any slides generated. This endpoint allows users to see their work-in-progress
 * presentations.
 *
 * Query parameters:
 * - `limit` (optional): Number of items per page (default: 50, max: 200)
 * - `cursor` (optional): Pagination token from previous response
 *
 * @param request - The HTTP request object containing query parameters.
 * @returns A JSON response with paginated draft presentation summaries.
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/presentations/drafts?limit=10
 * // Response: { items: [...], next_cursor: null }
 * ```
 */
export async function GET(request: NextRequest) {
  return handlePresentationGetDrafts(request);
}
