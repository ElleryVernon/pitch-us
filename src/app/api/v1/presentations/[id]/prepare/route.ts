import { NextRequest } from "next/server";

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
 * Handles POST requests to prepare a presentation with outlines and layout.
 *
 * This endpoint is called after outlines are generated and a layout is selected.
 * It validates the outlines and layout data, creates a structure mapping that
 * determines which layout template to use for each slide, and saves everything
 * to the database. This prepares the presentation for slide content generation.
 *
 * Route parameter:
 * - `id`: The unique identifier of the presentation to prepare
 *
 * Request body:
 * - `outlines` (required): Array of outline objects
 * - `layout` (required): Layout configuration object with slides array
 *
 * @param request - The HTTP request object containing preparation data.
 * @param context - Next.js route context containing dynamic route parameters.
 * @returns A JSON response with the updated presentation object.
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/presentations/abc-123/prepare
 * // Body: { outlines: [...], layout: {...} }
 * // Response: { id: "abc-123", outlines: {...}, layout: {...}, ... }
 * ```
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const body = await request.json();
  // Add presentation_id to body for compatibility with existing handler
  // The handler expects presentation_id in the body, but we get it from route params
  body.presentation_id = params.id;
  const { handlePresentationPrepare } = await import(
    "../../../ppt/handlers/presentation",
  );
   return handlePresentationPrepare(request, body);
}
