import { NextRequest } from "next/server";
import { handleImagesGenerate } from "../../ppt/handlers/images";

/**
 * Runtime configuration for this API route.
 * - nodejs: Runs on Node.js runtime (required for image generation service)
 * - maxDuration: Maximum execution time of 300 seconds (5 minutes)
 * - force-dynamic: Always generates dynamic responses (no caching)
 */
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Handles GET requests to generate an image from a text prompt using AI.
 *
 * Uses an image generation service to create an image based on a text description.
 * The generated image is saved to storage and a database record is created.
 *
 * Query parameters:
 * - `prompt` (required): Text description of the image to generate
 *
 * @param request - The HTTP request object containing the image prompt in query params.
 * @returns A JSON response with the URL path to the generated image.
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/images/generate?prompt=a%20sunset%20over%20mountains
 * // Response: "/app_data/images/abc-123.png"
 * ```
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  return handleImagesGenerate(url);
}
