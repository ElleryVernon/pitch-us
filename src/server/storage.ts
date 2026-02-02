/**
 * File system directory management utilities.
 *
 * This module provides functions for managing application data directories
 * on the file system. It handles directory creation, path resolution, and
 * provides consistent access to various data directories (images, exports,
 * uploads, fonts, temporary files) used throughout the application.
 *
 * All directories are created automatically if they don't exist, ensuring
 * the application can write files without manual setup.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/**
 * Ensures a directory exists, creating it if necessary.
 *
 * Checks if a directory exists at the given path, and creates it (including
 * all parent directories) if it doesn't exist. Uses recursive creation to
 * handle nested directory structures.
 *
 * This is a helper function used by all directory getter functions to ensure
 * directories are available before use.
 *
 * @param dir - Absolute or relative path to the directory that should exist.
 * @returns The directory path (same as input), after ensuring it exists.
 */
const ensureDir = (dir: string): string => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

/**
 * Gets the main application data directory.
 *
 * Returns the root directory where all application data is stored. This
 * includes subdirectories for images, exports, uploads, and fonts. The
 * directory can be configured via the APP_DATA_DIRECTORY environment variable,
 * or defaults to a relative path from the project root.
 *
 * @returns Absolute path to the application data directory. The directory
 *   is created if it doesn't exist.
 */
export const getAppDataDirectory = (): string => {
  const fallback = path.resolve(process.cwd(), "..", "..", "app_data");
  return ensureDir(process.env.APP_DATA_DIRECTORY || fallback);
};

/**
 * Gets the temporary files directory.
 *
 * Returns a directory for storing temporary files that can be safely deleted.
 * Uses the system's temporary directory (via os.tmpdir()) with an application-
 * specific subdirectory. Can be overridden via TEMP_DIRECTORY environment variable.
 *
 * @returns Absolute path to the temporary directory. The directory is created
 *   if it doesn't exist.
 */
export const getTempDirectory = (): string => {
  const fallback = path.join(os.tmpdir(), "pitch-us");
  return ensureDir(process.env.TEMP_DIRECTORY || fallback);
};

/**
 * Gets the directory for storing image files.
 *
 * Returns a subdirectory within the application data directory specifically
 * for image assets. Images stored here include both uploaded images and
 * generated images used in presentations.
 *
 * @returns Absolute path to the images directory. The directory is created
 *   if it doesn't exist.
 */
export const getImagesDirectory = (): string => {
  return ensureDir(path.join(getAppDataDirectory(), "images"));
};

/**
 * Gets the directory for storing exported files.
 *
 * Returns a subdirectory within the application data directory for exported
 * presentation files (PDFs, PPTX files, etc.). These are the final output
 * files generated from presentations.
 *
 * @returns Absolute path to the exports directory. The directory is created
 *   if it doesn't exist.
 */
export const getExportsDirectory = (): string => {
  return ensureDir(path.join(getAppDataDirectory(), "exports"));
};

/**
 * Gets the directory for storing uploaded files.
 *
 * Returns a subdirectory within the application data directory for files
 * uploaded by users (PDFs, DOCX files, etc.). These files are processed
 * to extract content for presentation generation.
 *
 * @returns Absolute path to the uploads directory. The directory is created
 *   if it doesn't exist.
 */
export const getUploadsDirectory = (): string => {
  return ensureDir(path.join(getAppDataDirectory(), "uploads"));
};

/**
 * Gets the directory for storing font files.
 *
 * Returns a subdirectory within the application data directory for custom
 * font files used in presentations. Fonts stored here are available for
 * use in slide rendering and PowerPoint exports.
 *
 * @returns Absolute path to the fonts directory. The directory is created
 *   if it doesn't exist.
 */
export const getFontsDirectory = (): string => {
  return ensureDir(path.join(getAppDataDirectory(), "fonts"));
};
