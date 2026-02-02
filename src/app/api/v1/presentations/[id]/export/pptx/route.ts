import { NextRequest } from "next/server";

/**
 * Runtime configuration for this API route.
 * - nodejs: Runs on Node.js runtime (required for PPTX export library)
 * - maxDuration: Maximum execution time of 300 seconds (5 minutes)
 * - force-dynamic: Always generates dynamic responses (no caching)
 */
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Handles POST requests to export a presentation as a PPTX file.
 *
 * Takes a PPTX presentation model (structured data representing slides)
 * and converts it to an actual .pptx file. The model contains slide
 * definitions with content, styling, and layout information that gets
 * transformed into PowerPoint's native format.
 *
 * Request body:
 * - `slides` (required): Array of slide objects with content and styling data
 *
 * @param request - The HTTP request object containing the PPTX model.
 * @returns A JSON response with the file path where the PPTX was saved.
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/presentations/abc-123/export/pptx
 * // Body: { slides: [{ content: {...}, style: {...} }, ...] }
 * // Response: { path: "/app_data/exports/presentation.pptx" }
 * ```
 */
export async function POST(request: NextRequest) {
  // Dynamic import to avoid loading export module unless needed
  const { handleExportPptx } = await import("../../../../ppt/handlers/presentation");
  return handleExportPptx(request);
}
