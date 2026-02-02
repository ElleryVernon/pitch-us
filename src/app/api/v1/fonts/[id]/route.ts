import { NextRequest } from "next/server";
import { handleFontsDelete } from "../../ppt/handlers/fonts";

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
 * Handles DELETE requests to remove a font file.
 *
 * Deletes a font file from the fonts directory. This operation is irreversible.
 *
 * Route parameter:
 * - `id`: The filename of the font to delete (must match exactly)
 *
 * @param _request - The HTTP request object (unused, but required by Next.js).
 * @param context - Next.js route context containing dynamic route parameters.
 * @returns A JSON response with success status.
 *
 * @example
 * ```typescript
 * // Request: DELETE /api/v1/fonts/Inter-Regular.ttf
 * // Response: { success: true, message: "Font deleted successfully" }
 * ```
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  return handleFontsDelete(params.id);
}
