import { NextRequest } from "next/server";
import { handleHtmlEdit } from "../../../ppt/handlers/slides";

/**
 * Runtime configuration for this API route.
 * - nodejs: Runs on Node.js runtime (required for LLM access)
 * - maxDuration: Maximum execution time of 300 seconds (5 minutes)
 * - force-dynamic: Always generates dynamic responses (no caching)
 */
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Handles POST requests to edit HTML content using AI.
 *
 * Takes HTML markup and a user's edit instruction, then uses an LLM to
 * modify the HTML according to the instruction while maintaining semantic
 * structure and CSS classes.
 *
 * Request body:
 * - `html` (required): HTML content to edit
 * - `prompt` (required): Text instruction describing the desired changes
 *
 * @param request - The HTTP request object containing HTML edit data.
 * @returns A JSON response with the edited HTML markup.
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/slides/transform/html-edit
 * // Body: { html: "<div>...</div>", prompt: "Add a border" }
 * // Response: { success: true, edited_html: "<div style='border: 1px solid'>...</div>" }
 * ```
 */
export async function POST(request: NextRequest) {
  return handleHtmlEdit(request);
}
