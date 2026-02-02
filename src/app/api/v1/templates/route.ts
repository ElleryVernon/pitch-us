import { NextRequest } from "next/server";
import {
  handleTemplatesList,
  handleTemplateMeta,
} from "../ppt/handlers/templates";

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
 * Handles GET requests to list all available built-in templates.
 *
 * Returns metadata about pre-built template designs that come with the
 * application. These templates are defined in templates-manifest.json
 * and can be selected by users when creating presentations.
 *
 * @param _request - The HTTP request object (unused, but required by Next.js).
 * @returns A JSON response containing an array of template metadata objects.
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/templates
 * // Response: [{ templateName: "Modern", templateID: "...", files: [...], ... }]
 * ```
 */
export async function GET(_request: NextRequest) {
  return handleTemplatesList();
}

/**
 * Handles POST requests to save or update template metadata.
 *
 * Creates or updates template metadata including name, description, and
 * configuration options. Templates are stored as special presentations
 * with additional metadata fields.
 *
 * Request body:
 * - `id` (required): Unique identifier for the template
 * - `name` (required): Human-readable template name
 * - `description` (optional): Template description
 * - `ordered` (optional): Whether layouts should be applied sequentially
 * - `slides` (optional): Slide configuration object
 *
 * @param request - The HTTP request object containing template metadata.
 * @returns A JSON response with the saved template object.
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/templates
 * // Body: { id: "abc-123", name: "Modern Template", ordered: false }
 * // Response: { success: true, template: {...} }
 * ```
 */
export async function POST(request: NextRequest) {
  return handleTemplateMeta(request);
}
