import { NextRequest } from "next/server";
import { handleTemplateSave } from "../../ppt/handlers/templates";

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
 * Handles POST requests to save layout codes for a template.
 *
 * Saves or updates React/TSX component code for one or more layouts within
 * a template. Each layout represents a different slide design variation.
 * The layout code is stored as a string and can be executed to render slides.
 *
 * Request body:
 * - `layouts` (optional): Array of layout objects with component code
 *
 * @param request - The HTTP request object containing layout data.
 * @returns A JSON response with success status and count of saved layouts.
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/templates/save
 * // Body: { layouts: [{ presentation: "...", layout_code: "export default...", ... }] }
 * // Response: { success: true, saved_count: 1 }
 * ```
 */
export async function POST(request: NextRequest) {
  return handleTemplateSave(request);
}
