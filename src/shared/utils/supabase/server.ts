/**
 * Server-side Supabase client creation utilities.
 *
 * This module provides functions for creating Supabase clients that run on the
 * server (Server Components, API routes, Server Actions). These clients handle
 * server-side authentication through Next.js cookies and can access user sessions
 * from HTTP requests.
 *
 * The clients created by this module are compatible with Next.js 15's async
 * cookies() API and properly handle cookie-based authentication for server-side
 * operations.
 */

import {
  createServerClient,
  type CookieMethodsServer,
  type CookieOptions,
} from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "./env";

/**
 * Cookie structure for setting cookies in server-side code.
 *
 * Represents a cookie that needs to be set, including its name, value, and
 * configuration options. Used by Supabase to manage authentication cookies.
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
 * Type alias for Next.js 15 async cookie store.
 *
 * In Next.js 15, the cookies() function became async and returns a Promise.
 * This type represents the resolved cookie store that can be used to read
 * and write cookies.
 */
type CookieStore = Awaited<ReturnType<typeof cookies>>;

/**
 * Creates a Supabase client for use in server-side code.
 *
 * Initializes a Supabase client configured for server-side usage (Server Components,
 * API routes, Server Actions). This client reads authentication state from Next.js
 * cookies and can access user sessions from HTTP requests.
 *
 * The client is created with custom cookie methods that integrate with Next.js's
 * cookie handling. This allows Supabase to read and write authentication cookies
 * properly in server-side contexts.
 *
 * This function is async because Next.js 15's cookies() function is async. If a
 * cookie store is provided, it will be used; otherwise, the function will await
 * the default cookies() call.
 *
 * @param cookieStore - Optional pre-resolved cookie store. If provided, uses
 *   this store instead of calling cookies(). Useful when you already have a
 *   cookie store from a previous call. If not provided, awaits cookies() to
 *   get a fresh cookie store.
 * @returns A Promise that resolves to a configured Supabase client instance
 *   ready for server-side use. The client supports all Supabase features and
 *   has access to the user's authentication state from cookies.
 * @throws {Error} Throws an error if Supabase environment variables are not
 *   configured (see getSupabaseEnv).
 *
 * @example
 * ```typescript
 * // In a Server Component
 * export default async function MyServerComponent() {
 *   const supabase = await createClient();
 *   const { data } = await supabase.auth.getUser();
 *   return <div>User: {data.user?.email}</div>;
 * }
 *
 * // In an API route
 * export async function GET(request: Request) {
 *   const supabase = await createClient();
 *   const { data } = await supabase.from("presentations").select("*");
 *   return Response.json(data);
 * }
 * ```
 */
export const createClient = async (cookieStore?: CookieStore) => {
  const resolvedCookieStore = cookieStore ?? (await cookies());
  const { url, key } = getSupabaseEnv();
  const cookieMethods = {
    getAll() {
      return resolvedCookieStore.getAll();
    },
    setAll(cookiesToSet: CookieToSet[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          resolvedCookieStore.set(name, value, options),
        );
      } catch {
        // Errors when calling setAll in Server Component can be ignored
      }
    },
  } satisfies CookieMethodsServer;

  return createServerClient(url, key, {
    cookies: {
      ...cookieMethods,
    },
  });
};
