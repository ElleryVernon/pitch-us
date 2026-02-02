import { NextRequest } from "next/server";
import {
  handlePresentationGetAll,
  handlePresentationCreate,
} from "../ppt/handlers/presentation";

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
 * Handles GET requests to retrieve all completed presentations.
 *
 * This endpoint provides paginated access to presentations that have
 * at least one slide (completed presentations). Supports cursor-based
 * pagination for efficient traversal of large datasets.
 *
 * Query parameters:
 * - `limit` (optional): Number of items per page (default: 50, max: 200)
 * - `cursor` (optional): Pagination token from previous response
 *
 * @param request - The HTTP request object containing query parameters.
 * @returns A JSON response with paginated presentation summaries.
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/presentations?limit=20&cursor=abc123
 * // Response: { items: [...], next_cursor: "def456" }
 * ```
 */
export async function GET(request: NextRequest) {
  return handlePresentationGetAll(request);
}

/**
 * Handles POST requests to create a new presentation.
 *
 * Creates a new presentation record in the database with user-provided
 * content and configuration. The presentation starts in draft state
 * (no slides) and can be populated later through outline and slide
 * generation endpoints.
 *
 * Request body:
 * - `language` (required): Language code (e.g., "en", "ko")
 * - `content` (optional): User text prompt
 * - `document_content` (optional): Extracted text from uploaded files
 * - `n_slides` (optional): Target number of slides (default: 10)
 * - Additional optional fields: tone, verbosity, instructions, etc.
 *
 * @param request - The HTTP request object containing presentation creation data.
 * @returns A JSON response with the created presentation object.
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/presentations
 * // Body: { language: "en", content: "Startup pitch deck", n_slides: 12 }
 * // Response: { id: "uuid", language: "en", ... }
 * ```
 */
export async function POST(request: NextRequest) {
  // Dynamic import to avoid loading handler unless needed (code splitting)
  const { handlePresentationCreate } = await import("../ppt/handlers/presentation");
  return handlePresentationCreate(request);
}
