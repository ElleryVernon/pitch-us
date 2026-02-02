import { NextRequest } from "next/server";
import { handleHtmlToReact } from "../../../ppt/handlers/slides";

/**
 * Runtime configuration for this API route.
 * - nodejs: Runs on Node.js runtime (required for LLM access)
 * - maxDuration: Maximum execution time of 300 seconds (5 minutes)
 * - force-dynamic: Always generates dynamic responses (no caching)
 */
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Handles POST requests to convert HTML to a React TSX component.
 *
 * Takes HTML markup and converts it to a React functional component with
 * proper TypeScript typing. This is useful for creating reusable slide
 * components from HTML templates.
 *
 * Request body:
 * - `html` (required): HTML markup to convert
 *
 * @param request - The HTTP request object containing HTML to convert.
 * @returns A JSON response with the generated React component code.
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/slides/transform/html-to-react
 * // Body: { html: "<div class='slide'>...</div>" }
 * // Response: { success: true, react_component: "const SlideComponent = () => {...}" }
 * ```
 */
export async function POST(request: NextRequest) {
  return handleHtmlToReact(request);
}
