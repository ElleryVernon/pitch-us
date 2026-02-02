/**
 * Supabase storage operations for file management.
 *
 * This module provides functions for uploading, downloading, and managing files
 * in Supabase Storage. It handles both binary files and text files, and provides
 * utilities for building and parsing Supabase storage paths. Files can be
 * stored in Supabase Storage buckets and accessed via public URLs.
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Supabase storage location structure.
 *
 * Represents a file location within Supabase Storage, consisting of a bucket
 * name and a path within that bucket. Used for parsing and constructing
 * Supabase storage paths.
 *
 * @property bucket - Name of the Supabase Storage bucket containing the file.
 * @property path - Path to the file within the bucket (e.g., "images/photo.jpg").
 */
export type SupabaseStorageLocation = {
  bucket: string;
  path: string;
};

/**
 * Gets the Supabase project URL from environment variables.
 *
 * @returns Supabase URL string if configured, undefined otherwise.
 */
const getSupabaseUrl = (): string | undefined =>
  process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Gets the Supabase API key from environment variables.
 *
 * @returns Supabase API key string if configured, undefined otherwise.
 */
const getSupabaseKey = (): string | undefined =>
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

/**
 * Gets the Supabase storage bucket name.
 *
 * Retrieves the storage bucket name from environment variables, with a
 * default fallback. Storage buckets organize files in Supabase Storage.
 *
 * @returns Storage bucket name. Defaults to "pitchdecks" if not configured.
 */
export const getSupabaseStorageBucket = (): string =>
  process.env.SUPABASE_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
  "pitchdecks";

/**
 * Checks if Supabase is properly configured and enabled.
 *
 * Verifies that both Supabase URL and API key are available in environment
 * variables. Returns true only if both are configured.
 *
 * @returns True if Supabase URL and key are both configured, false otherwise.
 */
export const isSupabaseEnabled = (): boolean =>
  Boolean(getSupabaseUrl() && getSupabaseKey());

/**
 * Creates a Supabase client for storage operations.
 *
 * Initializes a Supabase client configured for server-side storage operations.
 * The client is configured without authentication (no session persistence or
 * token refresh) since it's used for server-side file operations.
 *
 * @returns A configured Supabase client instance.
 * @throws {Error} Throws an error if Supabase URL or key is not configured.
 */
const getSupabaseClient = () => {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (!url || !key) {
    throw new Error("Supabase env not configured");
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Builds a Supabase storage path string from bucket and path.
 *
 * Creates a standardized storage path string in the format "supabase://bucket/path".
 * This format is used throughout the application to identify files stored in
 * Supabase Storage, allowing the system to distinguish Supabase paths from
 * local file paths.
 *
 * @param path - File path within the bucket (e.g., "images/photo.jpg").
 * @param bucket - Optional bucket name. Defaults to the configured storage bucket.
 * @returns Storage path string in format "supabase://bucket/path".
 *
 * @example
 * ```typescript
 * const storagePath = buildSupabaseStoragePath("images/photo.jpg", "pitchdecks");
 * // Returns: "supabase://pitchdecks/images/photo.jpg"
 * ```
 */
export const buildSupabaseStoragePath = (
  path: string,
  bucket = getSupabaseStorageBucket(),
): string => `supabase://${bucket}/${path}`;

/**
 * Parses a Supabase storage path string into its components.
 *
 * Extracts the bucket name and file path from a Supabase storage path string.
 * Returns null if the path doesn't match the Supabase storage format (doesn't
 * start with "supabase://").
 *
 * @param filePath - Storage path string to parse (e.g., "supabase://bucket/path/to/file").
 * @returns SupabaseStorageLocation object with bucket and path, or null if
 *   the path is not a valid Supabase storage path.
 *
 * @example
 * ```typescript
 * const location = parseSupabaseStoragePath("supabase://pitchdecks/images/photo.jpg");
 * // Returns: { bucket: "pitchdecks", path: "images/photo.jpg" }
 * ```
 */
export const parseSupabaseStoragePath = (
  filePath: string,
): SupabaseStorageLocation | null => {
  const trimmed = filePath.trim();
  if (!trimmed.startsWith("supabase://")) {
    return null;
  }
  const withoutScheme = trimmed.slice("supabase://".length);
  const [bucket, ...rest] = withoutScheme.split("/");
  if (!bucket || rest.length === 0) {
    return null;
  }
  return { bucket, path: rest.join("/") };
};

/**
 * Uploads a binary file to Supabase Storage.
 *
 * Uploads file data to a Supabase Storage bucket and returns a storage path
 * string that can be used to reference the file. The file is stored at the
 * specified path within the bucket.
 *
 * @param path - File path within the bucket where the file should be stored
 *   (e.g., "images/photo.jpg"). Should not include the bucket name.
 * @param data - Binary file data as a Buffer. The buffer contents will be
 *   uploaded to Supabase Storage.
 * @param contentType - Optional MIME type of the file (e.g., "image/png",
 *   "application/pdf"). Used for proper content handling.
 * @param bucket - Optional bucket name. Defaults to the configured storage bucket.
 * @param upsert - Whether to overwrite existing files at the same path.
 *   If false and a file exists, the upload will fail.
 * @returns Promise that resolves to a Supabase storage path string
 *   (e.g., "supabase://bucket/path/to/file").
 * @throws {Error} Throws an error if the upload fails or Supabase is not configured.
 *
 * @example
 * ```typescript
 * const buffer = Buffer.from(imageData);
 * const storagePath = await uploadSupabaseFile({
 *   path: "images/photo.jpg",
 *   data: buffer,
 *   contentType: "image/jpeg"
 * });
 * ```
 */
export const uploadSupabaseFile = async ({
  path,
  data,
  contentType,
  bucket = getSupabaseStorageBucket(),
  upsert = false,
}: {
  path: string;
  data: Buffer;
  contentType?: string;
  bucket?: string;
  upsert?: boolean;
}): Promise<string> => {
  const client = getSupabaseClient();
  const { data: result, error } = await client.storage
    .from(bucket)
    .upload(path, data, { contentType, upsert });
  if (error || !result?.path) {
    throw new Error(error?.message || "Failed to upload to Supabase storage");
  }
  return buildSupabaseStoragePath(result.path, bucket);
};

/**
 * Uploads a text file to Supabase Storage.
 *
 * Convenience function that uploads text content as a UTF-8 encoded text file.
 * The text is converted to a Buffer and uploaded with the appropriate content
 * type for text files.
 *
 * @param path - File path within the bucket where the text file should be
 *   stored (e.g., "documents/notes.txt").
 * @param text - Text content to upload. Will be encoded as UTF-8.
 * @param bucket - Optional bucket name. Defaults to the configured storage bucket.
 * @param upsert - Whether to overwrite existing files at the same path.
 * @returns Promise that resolves to a Supabase storage path string.
 * @throws {Error} Throws an error if the upload fails or Supabase is not configured.
 */
export const uploadSupabaseTextFile = async ({
  path,
  text,
  bucket = getSupabaseStorageBucket(),
  upsert = false,
}: {
  path: string;
  text: string;
  bucket?: string;
  upsert?: boolean;
}): Promise<string> => {
  const buffer = Buffer.from(text, "utf-8");
  return uploadSupabaseFile({
    path,
    data: buffer,
    contentType: "text/plain; charset=utf-8",
    bucket,
    upsert,
  });
};

/**
 * Downloads a file from Supabase Storage.
 *
 * Retrieves file data from Supabase Storage and returns it as a Buffer.
 * The file path must be in Supabase storage format (supabase://bucket/path).
 *
 * @param filePath - Supabase storage path string (e.g., "supabase://bucket/path/to/file").
 * @returns Promise that resolves to a Buffer containing the file data.
 * @throws {Error} Throws an error if the path is invalid, download fails, or
 *   Supabase is not configured.
 */
export const downloadSupabaseFile = async (
  filePath: string,
): Promise<Buffer> => {
  const location = parseSupabaseStoragePath(filePath);
  if (!location) {
    throw new Error("Invalid Supabase storage path");
  }
  const client = getSupabaseClient();
  const { data, error } = await client.storage
    .from(location.bucket)
    .download(location.path);
  if (error || !data) {
    throw new Error(
      error?.message || "Failed to download from Supabase storage",
    );
  }
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

/**
 * Gets the public URL for a file in Supabase Storage.
 *
 * Constructs a public URL that can be used to access a file stored in Supabase
 * Storage via HTTP. Public URLs allow direct access to files without authentication.
 * If the file path is not a Supabase storage path, returns the original path.
 *
 * @param filePath - Supabase storage path string (e.g., "supabase://bucket/path/to/file").
 * @returns Public URL string for accessing the file, or the original filePath
 *   if it's not a Supabase storage path or Supabase is not configured.
 *
 * @example
 * ```typescript
 * const publicUrl = getSupabasePublicUrl("supabase://pitchdecks/images/photo.jpg");
 * // Returns: "https://xxxxx.supabase.co/storage/v1/object/public/pitchdecks/images/photo.jpg"
 * ```
 */
export const getSupabasePublicUrl = (filePath: string): string => {
  const location = parseSupabaseStoragePath(filePath);
  if (!location) {
    return filePath;
  }
  const url = getSupabaseUrl();
  if (!url) {
    return filePath;
  }
  return `${url}/storage/v1/object/public/${location.bucket}/${location.path}`;
};

/**
 * Uploads a file to Supabase Storage and returns its public URL.
 *
 * Convenience function that combines file upload and public URL generation.
 * This is useful when you need both to store a file and immediately get a URL
 * to access it.
 *
 * @param path - File path within the bucket where the file should be stored.
 * @param data - Binary file data as a Buffer.
 * @param contentType - Optional MIME type of the file.
 * @param bucket - Optional bucket name. Defaults to the configured storage bucket.
 * @param upsert - Whether to overwrite existing files at the same path.
 * @returns Promise that resolves to a public URL string for accessing the
 *   uploaded file via HTTP.
 * @throws {Error} Throws an error if the upload fails or Supabase is not configured.
 */
export const uploadSupabaseFileAndGetPublicUrl = async ({
  path,
  data,
  contentType,
  bucket = getSupabaseStorageBucket(),
  upsert = false,
}: {
  path: string;
  data: Buffer;
  contentType?: string;
  bucket?: string;
  upsert?: boolean;
}): Promise<string> => {
  const storagePath = await uploadSupabaseFile({
    path,
    data,
    contentType,
    bucket,
    upsert,
  });
  return getSupabasePublicUrl(storagePath);
};
