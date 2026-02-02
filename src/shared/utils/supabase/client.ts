/**
 * Browser-side Supabase client creation utilities.
 *
 * This module provides functions for creating Supabase clients that run in the
 * browser. These clients are used for client-side Supabase operations such as
 * authentication, real-time subscriptions, and storage access from React components.
 *
 * The clients created by this module use the @supabase/ssr package which is
 * designed for Next.js applications and handles cookie-based authentication
 * properly.
 */

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "./env";

/**
 * Creates a Supabase client for use in browser/client components.
 *
 * Initializes a Supabase client configured for browser-side usage. This client
 * is designed to work with React components and handles authentication state
 * through browser storage (localStorage/cookies).
 *
 * The client is configured as a singleton (isSingleton: true), which means
 * multiple calls to this function will return the same client instance. This
 * ensures consistent state across the application and prevents multiple
 * client initializations.
 *
 * This function reads Supabase configuration from environment variables and
 * will throw an error if Supabase is not properly configured.
 *
 * @returns A configured Supabase client instance ready for browser-side use.
 *   The client supports all Supabase features including auth, database queries,
 *   storage, and real-time subscriptions.
 * @throws {Error} Throws an error if Supabase environment variables are not
 *   configured (see getSupabaseEnv).
 *
 * @example
 * ```typescript
 * "use client";
 *
 * export function MyComponent() {
 *   const supabase = createClient();
 *
 *   useEffect(() => {
 *     supabase.auth.getSession().then(({ data }) => {
 *       console.log("Session:", data.session);
 *     });
 *   }, []);
 *
 *   return <div>Content</div>;
 * }
 * ```
 */
export const createClient = () => {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient(url, key, {
    isSingleton: true,
  });
};
