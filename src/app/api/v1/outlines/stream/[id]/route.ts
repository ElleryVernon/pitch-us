import { NextRequest } from "next/server";

/**
 * Runtime configuration for this API route.
 * - nodejs: Runs on Node.js runtime (required for streaming and LLM access)
 * - maxDuration: Maximum execution time of 300 seconds (5 minutes)
 * - force-dynamic: Always generates dynamic responses (no caching)
 */
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Handles GET requests to stream outline generation in real-time.
 *
 * Generates presentation outlines (high-level slide descriptions) using an LLM
 * and streams the results via Server-Sent Events (SSE). Outlines define what
 * content each slide should contain and follow VC pitch deck standards.
 *
 * Route parameter:
 * - `id`: The unique identifier of the presentation to generate outlines for
 *
 * The stream sends various event types:
 * - `heartbeat`: Keep-alive messages
 * - `status`: Status updates ("Preparing outline...", etc.)
 * - `chunk`: Raw JSON tokens as they arrive
 * - `delta`: Incremental outline content updates
 * - `slide`: Complete outline objects when detected
 * - `complete`: Final completion event with saved data
 *
 * @param _request - The HTTP request object (unused, but required by Next.js).
 * @param context - Next.js route context containing dynamic route parameters.
 * @returns An HTTP Response with SSE stream (Content-Type: text/event-stream).
 *
 * @example
 * ```typescript
 * // Client connects to: GET /api/v1/outlines/stream/abc-123
 * // Receives SSE stream with outline updates in real-time
 * ```
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const presentationId = params.id;

  // Dynamic import to avoid loading handler unless needed
  const { handleOutlinesStream } = await import("../../../ppt/handlers/presentation");
  return handleOutlinesStream(presentationId);
}
