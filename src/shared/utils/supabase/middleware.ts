/**
 * Next.js middleware Supabase client creation utilities.
 *
 * This module provides functions for creating Supabase clients within Next.js
 * middleware. Middleware runs on the Edge runtime and has access to incoming
 * requests, allowing it to read and modify cookies for authentication handling.
 *
 * The clients created by this module work with NextRequest and NextResponse
 * objects to properly handle cookie-based authentication in middleware contexts.
 */

import {
  createServerClient,
  type CookieMethodsServer,
  type CookieOptions,
} from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabaseEnv } from "./env";

/**
 * Cookie structure for setting cookies in middleware.
 *
 * Represents a cookie that needs to be set, including its name, value, and
 * configuration options. Used by Supabase to manage authentication cookies
 * in middleware.
 *
 * @property name - Cookie name as a string.
 * @property value - Cookie value as a string.
 * @property options - Cookie configuration options (expires, httpOnly, secure,
 *   sameSite, etc.) as defined by Next.js CookieOptions.
 */
type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

/**
 * Creates a Supabase client for use in Next.js middleware.
 *
 * Initializes a Supabase client configured for middleware usage. Middleware
 * runs on the Edge runtime and has access to incoming requests, allowing it
 * to read authentication cookies and refresh sessions before requests reach
 * Server Components or API routes.
 *
 * This function returns both the Supabase client and a NextResponse object.
 * The response object may have cookies set by Supabase (for session refresh),
 * and should be returned from the middleware to apply those cookies.
 *
 * The cookie methods integrate with NextRequest and NextResponse to properly
 * handle cookie reading and writing in middleware contexts. Cookies are read
 * from the request and written to both the request (for immediate use) and
 * the response (to send to the client).
 *
 * @param request - The incoming NextRequest object from Next.js middleware.
 *   Contains headers, cookies, and other request information. Cookies are
 *   read from this request.
 * @returns An object containing:
 *   - supabase: A configured Supabase client instance with access to the
 *     user's authentication state from request cookies.
 *   - response: A NextResponse object that may have authentication cookies
 *     set by Supabase. This response should be returned from middleware to
 *     apply cookie changes.
 * @throws {Error} Throws an error if Supabase environment variables are not
 *   configured (see getSupabaseEnv).
 *
 * @example
 * ```typescript
 * // In middleware.ts
 * import { createClient } from "@/utils/supabase/middleware";
 *
 * export async function middleware(request: NextRequest) {
 *   const { supabase, response } = createClient(request);
 *
 *   // Refresh session if needed
 *   await supabase.auth.getUser();
 *
 *   // Return response to apply any cookie changes
 *   return response;
 * }
 * ```
 */
export const createClient = (request: NextRequest) => {
  const { url, key } = getSupabaseEnv();
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const cookieMethods = {
    getAll() {
      return request.cookies.getAll();
    },
    setAll(cookiesToSet: CookieToSet[]) {
      cookiesToSet.forEach(({ name, value }) =>
        request.cookies.set(name, value),
      );
      supabaseResponse = NextResponse.next({
        request,
      });
      cookiesToSet.forEach(({ name, value, options }) =>
        supabaseResponse.cookies.set(name, value, options),
      );
    },
  } satisfies CookieMethodsServer;

  const supabase = createServerClient(url, key, {
    cookies: {
      ...cookieMethods,
    },
  });

  return { supabase, response: supabaseResponse };
};
