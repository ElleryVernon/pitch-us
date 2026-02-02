import { NextResponse } from "next/server";

/**
 * Creates a JSON response with the provided data and status code.
 *
 * Convenience function for creating consistent JSON responses throughout
 * the API. Uses Next.js NextResponse for proper type handling and headers.
 *
 * @param data - The data to serialize as JSON in the response body.
 *   Can be any JSON-serializable value (object, array, string, number, etc.).
 * @param status - HTTP status code for the response (default: 200).
 * @returns A NextResponse object with JSON body and the specified status code.
 *
 * @example
 * ```typescript
 * return jsonResponse({ items: [...], total: 10 });
 * // Returns: NextResponse with status 200 and JSON body
 *
 * return jsonResponse({ error: "Not found" }, 404);
 * // Returns: NextResponse with status 404 and JSON body
 * ```
 */
export const jsonResponse = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

/**
 * Creates a standardized error response with a detail message.
 *
 * All API errors use a consistent format with a `detail` field containing
 * the error message. This makes error handling on the client side predictable.
 *
 * @param detail - Human-readable error message describing what went wrong.
 *   Should be clear and actionable for API consumers.
 * @param status - HTTP status code for the error (default: 400 Bad Request).
 *   Common values: 400 (bad request), 404 (not found), 500 (server error).
 * @returns A NextResponse object with JSON body containing `{ detail: string }`
 *   and the specified status code.
 *
 * @example
 * ```typescript
 * return errorResponse("Missing required field: email");
 * // Returns: { detail: "Missing required field: email" } with status 400
 *
 * return errorResponse("Resource not found", 404);
 * // Returns: { detail: "Resource not found" } with status 404
 * ```
 */
export const errorResponse = (detail: string, status = 400) =>
  NextResponse.json({ detail }, { status });
