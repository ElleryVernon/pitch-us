import { NextRequest } from "next/server";
import { handleSlideEdit } from "../ppt/handlers/slides";

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
 * Handles POST requests to edit slide JSON content using AI.
 *
 * Takes a slide's current JSON content and a user's edit instruction, then
 * uses an LLM to modify the content according to the instruction while
 * maintaining the JSON structure and professional quality standards.
 *
 * Request body:
 * - `id` (required): Unique identifier of the slide to edit
 * - `prompt` (required): Text instruction describing the desired changes
 *
 * @param request - The HTTP request object containing slide edit data.
 * @returns A JSON response with the updated slide object containing modified content.
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/slides
 * // Body: { id: "slide-123", prompt: "Change revenue to $5M" }
 * // Response: { id: "slide-123", content: { revenue: "$5M", ... }, ... }
 * ```
 */
export async function POST(request: NextRequest) {
  return handleSlideEdit(request);
}
