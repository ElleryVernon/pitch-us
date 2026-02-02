import { NextRequest } from "next/server";
import {
  handlePresentationGet,
  handlePresentationDelete,
} from "../../ppt/handlers/presentation";

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
 * Handles GET requests to retrieve a single presentation by ID.
 *
 * Fetches the complete presentation data including all associated slides.
 * This endpoint is used when viewing or editing a specific presentation.
 *
 * Route parameter:
 * - `id`: The unique identifier of the presentation (UUID)
 *
 * @param _request - The HTTP request object (unused, but required by Next.js).
 * @param context - Next.js route context containing dynamic route parameters.
 * @returns A JSON response with the complete presentation object including slides.
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/presentations/abc-123-def
 * // Response: { id: "abc-123-def", content: "...", slides: [...] }
 * ```
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  return handlePresentationGet(params.id);
}

/**
 * Handles PATCH requests to update an existing presentation.
 *
 * Updates presentation metadata and optionally replaces all slides.
 * Supports partial updates - only provided fields are updated.
 *
 * Route parameter:
 * - `id`: The unique identifier of the presentation to update
 *
 * Request body (all fields optional):
 * - `n_slides`, `title`, `language`, `tone`, `verbosity`, `instructions`
 * - `include_table_of_contents`, `include_title_slide`, `web_search`
 * - `outlines`, `layout`, `structure`
 * - `slides`: Array of slide objects to replace existing slides
 *
 * @param request - The HTTP request object containing update data.
 * @param context - Next.js route context containing dynamic route parameters.
 * @returns A JSON response with the updated presentation object.
 *
 * @example
 * ```typescript
 * // Request: PATCH /api/v1/presentations/abc-123
 * // Body: { title: "New Title", n_slides: 15 }
 * // Response: { id: "abc-123", title: "New Title", ... }
 * ```
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const body = await request.json();
  // Add presentationId to body for compatibility with existing handler
  // The handler expects id in the body, but we get it from route params
  body.id = params.id;
  const { handlePresentationUpdate } = await import("../../ppt/handlers/presentation");
  return handlePresentationUpdate(request, body);
}

/**
 * Handles DELETE requests to remove a presentation.
 *
 * Deletes a presentation and all its associated slides from the database.
 * This operation is irreversible.
 *
 * Route parameter:
 * - `id`: The unique identifier of the presentation to delete
 *
 * @param _request - The HTTP request object (unused, but required by Next.js).
 * @param context - Next.js route context containing dynamic route parameters.
 * @returns An HTTP response with status 204 (No Content) if successful,
 *   or 404 if the presentation doesn't exist.
 *
 * @example
 * ```typescript
 * // Request: DELETE /api/v1/presentations/abc-123-def
 * // Response: 204 No Content
 * ```
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  return handlePresentationDelete(params.id);
}
