import { NextRequest } from "next/server";
import {
  handleFontsList,
  handleFontsUpload,
} from "../ppt/handlers/fonts";

/**
 * Runtime configuration for this API route.
 * - nodejs: Runs on Node.js runtime (required for file system access)
 * - maxDuration: Maximum execution time of 300 seconds (5 minutes)
 * - force-dynamic: Always generates dynamic responses (no caching)
 */
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Handles GET requests to list all available font files.
 *
 * Scans the fonts directory and returns metadata about each font file including
 * filename, font name, file size, and file type.
 *
 * @param _request - The HTTP request object (unused, but required by Next.js).
 * @returns A JSON response with an array of font metadata objects.
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/fonts
 * // Response: { success: true, fonts: [{ filename: "...", font_name: "...", ... }] }
 * ```
 */
export async function GET(_request: NextRequest) {
  return handleFontsList();
}

/**
 * Handles POST requests to upload a font file.
 *
 * Accepts a multipart/form-data request with a font file, validates its size,
 * saves it to the fonts directory, and returns metadata about the uploaded font.
 *
 * Request body (multipart/form-data):
 * - `font_file` (required): Font file to upload (TTF, OTF, WOFF, etc.)
 *
 * @param request - The HTTP request object containing the font file in form data.
 * @returns A JSON response with font metadata including name, URL, and path.
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/fonts
 * // Body: multipart/form-data with font_file field
 * // Response: { success: true, font_name: "Inter", font_url: "/app_data/fonts/...", ... }
 * ```
 */
export async function POST(request: NextRequest) {
  return handleFontsUpload(request);
}
