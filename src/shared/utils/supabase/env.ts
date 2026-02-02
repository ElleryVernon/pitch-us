/**
 * Supabase environment configuration utilities.
 *
 * This module provides functions for accessing Supabase configuration from
 * environment variables. It handles reading Supabase URL and API keys, checking
 * if Supabase is enabled, and retrieving storage bucket names. All functions
 * read from Next.js environment variables prefixed with NEXT_PUBLIC_.
 */

/**
 * Supabase environment configuration structure.
 *
 * Contains the essential configuration values needed to connect to a Supabase
 * project. These values are read from environment variables and used to
 * initialize Supabase clients.
 *
 * @property url - Supabase project URL. The base URL for the Supabase project
 *   (e.g., "https://xxxxx.supabase.co"). Used to connect to Supabase services.
 * @property key - Supabase API key. The publishable/anon key used for client-side
 *   Supabase operations. This key is safe to expose in client-side code.
 */
type SupabaseEnv = {
  url: string;
  key: string;
};

/**
 * Checks if Supabase is properly configured and enabled.
 *
 * Verifies that both the Supabase URL and API key are available in environment
 * variables. Returns true only if both values are present and non-empty.
 * This function is useful for feature flags or conditional Supabase usage.
 *
 * The function checks multiple possible environment variable names for the
 * API key to support different configuration setups:
 * - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (preferred)
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY (fallback)
 * - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (fallback)
 *
 * @returns True if Supabase URL and key are both configured, false otherwise.
 *   Returns false if either value is missing or empty.
 *
 * @example
 * ```typescript
 * if (isSupabaseEnabled()) {
 *   // Use Supabase features
 * } else {
 *   // Use alternative storage/authentication
 * }
 * ```
 */
export const isSupabaseEnabled = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  return Boolean(url && key);
};

/**
 * Gets the Supabase storage bucket name for file uploads.
 *
 * Retrieves the storage bucket name from environment variables. Storage buckets
 * are used to organize files in Supabase Storage. If no bucket is configured,
 * defaults to "pitchdecks" which is the standard bucket for this application.
 *
 * @returns The storage bucket name as a string. Returns "pitchdecks" if
 *   NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET is not set.
 *
 * @example
 * ```typescript
 * const bucket = getSupabaseStorageBucket();
 * // Returns: "pitchdecks" or the configured bucket name
 * ```
 */
export const getSupabaseStorageBucket = (): string =>
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "pitchdecks";

/**
 * Gets Supabase environment configuration.
 *
 * Retrieves and validates the Supabase URL and API key from environment
 * variables. This function throws an error if either value is missing, ensuring
 * that Supabase clients are only created when properly configured.
 *
 * The function checks multiple possible environment variable names for the
 * API key in order of preference, using the first available value.
 *
 * @returns A SupabaseEnv object containing the URL and API key.
 * @throws {Error} Throws an error with message "Supabase env not configured"
 *   if either the URL or key is missing from environment variables.
 *
 * @example
 * ```typescript
 * try {
 *   const { url, key } = getSupabaseEnv();
 *   // Use url and key to create Supabase client
 * } catch (error) {
 *   console.error("Supabase not configured:", error.message);
 * }
 * ```
 */
export const getSupabaseEnv = (): SupabaseEnv => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !key) {
    throw new Error("Supabase env not configured");
  }

  return { url, key };
};
