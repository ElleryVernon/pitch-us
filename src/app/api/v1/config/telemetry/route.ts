import { NextResponse } from "next/server";

/**
 * Runtime configuration for this API route.
 * - nodejs: Runs on Node.js runtime (required for environment variable access)
 * - maxDuration: Maximum execution time of 300 seconds (5 minutes)
 * - force-dynamic: Always generates dynamic responses (no caching)
 */
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Handles GET requests to check telemetry configuration status.
 *
 * Returns whether anonymous telemetry is enabled based on the
 * DISABLE_ANONYMOUS_TELEMETRY environment variable. This endpoint
 * allows the frontend to check telemetry status and adjust behavior
 * accordingly (e.g., showing/hiding telemetry opt-in UI).
 *
 * Telemetry is enabled by default unless explicitly disabled via
 * environment variable. The check is case-sensitive for "true" and "True".
 *
 * @returns A JSON response containing:
 *   - `telemetryEnabled`: Boolean indicating whether telemetry is enabled
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/config/telemetry
 * // Response: { telemetryEnabled: true }
 * ```
 */
export async function GET() {
  // Check if telemetry is explicitly disabled via environment variable
  // Supports both "true" and "True" for flexibility
  const isDisabled =
    process.env.DISABLE_ANONYMOUS_TELEMETRY === "true" ||
    process.env.DISABLE_ANONYMOUS_TELEMETRY === "True";
  const telemetryEnabled = !isDisabled;
  return NextResponse.json({ telemetryEnabled });
}
