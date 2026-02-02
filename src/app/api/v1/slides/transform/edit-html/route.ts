import { NextRequest } from "next/server";
import { handleSlideEditHtml } from "../../../ppt/handlers/slides";

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
 * Handles POST requests to edit slide HTML content using AI.
 *
 * Takes a slide's HTML content and a user's edit instruction, then uses an
 * LLM to modify the HTML while maintaining structure and semantic correctness.
 *
 * Request body:
 * - `id` (required): Unique identifier of the slide to edit
 * - `html` (optional): HTML content to edit (uses slide's html_content if not provided)
 * - `prompt` (required): Text instruction describing the desired changes
 *
 * @param request - The HTTP request object containing HTML edit data.
 * @returns A JSON response with the updated slide object containing modified HTML.
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/slides/transform/edit-html
 * // Body: { id: "slide-123", html: "<div>...</div>", prompt: "Change title color" }
 * // Response: { id: "slide-123", html_content: "<div style='color: blue'>...</div>", ... }
 * ```
 */
export async function POST(request: NextRequest) {
  return handleSlideEditHtml(request);
}
