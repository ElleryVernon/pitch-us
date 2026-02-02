import { NextRequest } from "next/server";
import {
  handleTemplateGet,
  handleTemplateDelete,
} from "../../ppt/handlers/templates";

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
 * Handles GET requests to retrieve a complete template by ID.
 *
 * Fetches all layout codes (React/TSX component code) for a template along
 * with template metadata. Also extracts and deduplicates all fonts used
 * across all layouts in the template.
 *
 * Route parameter:
 * - `id`: The unique identifier of the template (presentation ID)
 *
 * @param _request - The HTTP request object (unused, but required by Next.js).
 * @param context - Next.js route context containing dynamic route parameters.
 * @returns A JSON response with template data including layouts, metadata, and fonts.
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/templates/abc-123
 * // Response: { success: true, layouts: [...], template: {...}, fonts: [...] }
 * ```
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  return handleTemplateGet(params.id);
}

/**
 * Handles DELETE requests to remove a template and all its layouts.
 *
 * Deletes all layout codes associated with a template presentation. This
 * operation is irreversible and will remove all saved layout component code.
 *
 * Route parameter:
 * - `id`: The unique identifier of the template to delete
 *
 * @param _request - The HTTP request object (unused, but required by Next.js).
 * @param context - Next.js route context containing dynamic route parameters.
 * @returns A JSON response with success status.
 *
 * @example
 * ```typescript
 * // Request: DELETE /api/v1/templates/abc-123
 * // Response: { success: true }
 * ```
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  return handleTemplateDelete(params.id);
}
