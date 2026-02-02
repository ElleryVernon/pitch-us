import { NextRequest } from "next/server";
import { handleTemplateSummary } from "../../ppt/handlers/templates";

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
 * Handles GET requests to retrieve a summary of all templates.
 *
 * Returns aggregated statistics about templates including total counts and
 * per-template metadata. This endpoint is useful for displaying a template
 * management dashboard.
 *
 * @param _request - The HTTP request object (unused, but required by Next.js).
 * @returns A JSON response with template summary statistics.
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/templates/summary
 * // Response: { success: true, presentations: [...], total_presentations: 10, ... }
 * ```
 */
export async function GET(_request: NextRequest) {
  return handleTemplateSummary();
}
