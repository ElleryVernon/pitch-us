import { NextRequest } from "next/server";
import { handleSlideToHtml } from "../../../ppt/handlers/slides";

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
 * Handles POST requests to convert slide image/OXML data to HTML.
 *
 * Takes a slide image (screenshot) and optional OXML (Office Open XML) data,
 * then uses an LLM to analyze the visual structure and generate semantic HTML
 * that represents the slide's content and layout.
 *
 * Request body:
 * - `image` (required): Path or URL to the slide image
 * - `xml` (optional): OXML data from PowerPoint file
 *
 * @param request - The HTTP request object containing conversion data.
 * @returns A JSON response with the generated HTML markup.
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/slides/transform/to-html
 * // Body: { image: "/path/to/slide.png", xml: "<slide>...</slide>" }
 * // Response: { success: true, html: "<div>...</div>" }
 * ```
 */
export async function POST(request: NextRequest) {
  return handleSlideToHtml(request);
}
