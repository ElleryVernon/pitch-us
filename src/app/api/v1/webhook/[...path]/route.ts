import { NextResponse } from "next/server";
import { createSubscription, deleteSubscription } from "@/server/db/webhooks";

/**
 * Runtime configuration for this API route.
 * - nodejs: Runs on Node.js runtime (required for database access)
 */
export const runtime = "nodejs";

/**
 * Creates a JSON response with the provided data and status code.
 *
 * @param data - The data to serialize as JSON.
 * @param status - HTTP status code (default: 200).
 * @returns A NextResponse object with JSON body.
 */
const jsonResponse = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

/**
 * Routes webhook subscription requests to appropriate handlers.
 *
 * Handles webhook subscription management:
 * - POST /subscribe: Creates a new webhook subscription
 * - DELETE /unsubscribe: Removes an existing webhook subscription
 *
 * @param request - The HTTP request object.
 * @param context - Next.js route context containing dynamic path segments.
 * @param method - HTTP method (POST or DELETE).
 * @returns A Response object from the appropriate handler, or 404 if route not found.
 */
const routeRequest = async (
  request: Request,
  context: { params: Promise<{ path: string[] }> },
  method: string,
): Promise<Response> => {
  const params = await context.params;
  const segments = params.path || [];
  const subpath = segments.join("/");

  // Handle webhook subscription creation
  if (subpath === "subscribe" && method === "POST") {
    const body = await request.json();
    // Validate required fields
    if (!body.url || !Array.isArray(body.events)) {
      return jsonResponse({ detail: "url and events are required" }, 400);
    }
    // Create subscription in database
    const subscription = await createSubscription(body.url, body.events);
    return jsonResponse(subscription);
  }

  // Handle webhook subscription removal
  if (subpath === "unsubscribe" && method === "DELETE") {
    const body = await request.json();
    // Validate required fields
    if (!body.url) {
      return jsonResponse({ detail: "url is required" }, 400);
    }
    // Remove subscription from database
    const removed = await deleteSubscription(body.url);
    return jsonResponse({ success: removed });
  }

  return jsonResponse({ detail: "Not found" }, 404);
};

/**
 * Handles POST requests for webhook subscription management.
 *
 * Used to create new webhook subscriptions. Routes to the subscribe handler.
 *
 * @param request - The HTTP request object containing subscription data.
 * @param context - Next.js route context containing dynamic path segments.
 * @returns A Response with the created subscription or error.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  return routeRequest(request, context, "POST");
}

/**
 * Handles DELETE requests for webhook subscription management.
 *
 * Used to remove webhook subscriptions. Routes to the unsubscribe handler.
 *
 * @param request - The HTTP request object containing the URL to unsubscribe.
 * @param context - Next.js route context containing dynamic path segments.
 * @returns A Response with success status or error.
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  return routeRequest(request, context, "DELETE");
}

/**
 * Handles OPTIONS requests for CORS preflight.
 *
 * Returns CORS headers allowing all origins, headers, and methods.
 * This enables cross-origin requests from web clients.
 *
 * @returns A 204 No Content response with CORS headers.
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
    },
  });
}
