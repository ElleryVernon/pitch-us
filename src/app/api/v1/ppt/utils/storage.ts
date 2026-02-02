import path from "node:path";
import { promises as fs } from "node:fs";
import { v4 as uuidv4 } from "uuid";

import { getAppDataDirectory, getTempDirectory } from "@/server/storage";

/**
 * Converts a filesystem path to a URL-accessible app data path.
 *
 * Takes an absolute filesystem path within the app data directory and converts
 * it to a relative URL path that can be used in HTTP responses and frontend
 * image/src attributes. The path is normalized to use forward slashes for
 * cross-platform compatibility.
 *
 * @param filePath - Absolute filesystem path to a file in the app data directory.
 *   Must be within the app data directory or an error may occur.
 * @returns A URL path starting with `/app_data/` that can be used to access
 *   the file via HTTP. Path separators are normalized to forward slashes.
 *
 * @example
 * ```typescript
 * const fsPath = "/app/user_data/images/abc-123.png";
 * const urlPath = toAppDataUrl(fsPath);
 * // Returns: "/app_data/images/abc-123.png"
 * ```
 */
export const toAppDataUrl = (filePath: string): string => {
  const base = getAppDataDirectory();
  // Calculate relative path from app data directory
  const relative = path.relative(base, filePath).split(path.sep).join("/");
  return `/app_data/${relative}`;
};

/**
 * Creates a temporary directory with a unique name.
 *
 * Generates a UUID-based temporary directory within the system's temp directory.
 * This is useful for processing files that don't need to persist, such as
 * temporary conversions or intermediate processing steps.
 *
 * The directory is created immediately and should be cleaned up by the caller
 * when no longer needed.
 *
 * @returns Promise that resolves to the absolute path of the created temporary
 *   directory. The directory is guaranteed to exist when the promise resolves.
 *
 * @example
 * ```typescript
 * const tempDir = await ensureTempDir();
 * // Returns: "/tmp/uuid-1234-5678-..."
 * // Directory is created and ready to use
 * ```
 */
export const ensureTempDir = async (): Promise<string> => {
  const base = getTempDirectory();
  // Create a unique subdirectory using UUID
  const dir = path.join(base, uuidv4());
  // Create directory recursively (parent directories created if needed)
  await fs.mkdir(dir, { recursive: true });
  return dir;
};
