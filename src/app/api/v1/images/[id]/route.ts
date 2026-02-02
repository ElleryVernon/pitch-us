import { NextRequest } from "next/server";
import { handleImagesDelete } from "../../ppt/handlers/images";
import { getImageById } from "@/server/db/images";
import { jsonResponse } from "../../ppt/utils/responses";
import { toAppDataUrl } from "../../ppt/utils/storage";

/**
 * Runtime configuration for this API route.
 * - nodejs: Runs on Node.js runtime (required for database and file system access)
 * - maxDuration: Maximum execution time of 300 seconds (5 minutes)
 * - force-dynamic: Always generates dynamic responses (no caching)
 */
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Handles GET requests to retrieve a single image by ID.
 *
 * Fetches image metadata from the database and returns it with a URL-accessible
 * path. This endpoint is useful for getting image details or verifying an image exists.
 *
 * Route parameter:
 * - `id`: The unique identifier of the image to retrieve
 *
 * @param _request - The HTTP request object (unused, but required by Next.js).
 * @param context - Next.js route context containing dynamic route parameters.
 * @returns A JSON response with image metadata including URL path.
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/images/abc-123
 * // Response: { id: "abc-123", path: "/app_data/images/...", is_uploaded: true, ... }
 * ```
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const image = await getImageById(params.id);
  if (!image) {
    return jsonResponse({ detail: "Image not found" }, 404);
  }
  // Convert filesystem path to URL-accessible path
  return jsonResponse({
    ...image,
    path: toAppDataUrl(image.path),
  });
}

/**
 * Handles DELETE requests to remove an image from storage and database.
 *
 * Deletes both the image file from the filesystem and the database record.
 * If file deletion fails, the database record is still removed.
 *
 * Route parameter:
 * - `id`: The unique identifier of the image to delete
 *
 * @param _request - The HTTP request object (unused, but required by Next.js).
 * @param context - Next.js route context containing dynamic route parameters.
 * @returns A JSON response with success status.
 *
 * @example
 * ```typescript
 * // Request: DELETE /api/v1/images/abc-123
 * // Response: { success: true, message: "Image deleted successfully" }
 * ```
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  return handleImagesDelete(params.id);
}
