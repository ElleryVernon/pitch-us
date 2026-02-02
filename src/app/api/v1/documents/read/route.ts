import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { sanitizeFilename } from "@/app/(presentation-generator)/utils/others";
import { getAppDataDirectory, getTempDirectory } from "@/server/storage";
import {
  downloadSupabaseFile,
  isSupabaseEnabled,
  parseSupabaseStoragePath,
} from "@/server/supabase-storage";

/**
 * Runtime configuration for this API route.
 * - nodejs: Runs on Node.js runtime (required for file system access)
 * - maxDuration: Maximum execution time of 300 seconds (5 minutes)
 * - force-dynamic: Always generates dynamic responses (no caching)
 */
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Handles POST requests to read text content from document files.
 *
 * Reads a text-based file (TXT, MD, etc.) from storage and returns its
 * content as a JSON response. This is used to extract text from uploaded
 * documents for use in presentation generation.
 *
 * Security:
 * - Validates file paths to prevent directory traversal attacks
 * - Only allows access to files within allowed base directories
 * - Sanitizes filenames before processing
 * - Supports both local filesystem and Supabase storage
 *
 * Request body:
 * - `filePath` (required): Path to the file to read. Can be:
 *   - Local filesystem path (within allowed directories)
 *   - Supabase storage path (format: "supabase://bucket/path")
 *
 * Allowed base directories:
 * - App data directory (APP_DATA_DIRECTORY env var or default)
 * - Temp directory (TEMP_DIRECTORY env var or default)
 * - Standard paths: /app/user_data, /tmp
 *
 * @param request - The HTTP request object containing the file path in the body.
 * @returns A JSON response with:
 *   - `content`: The file's text content as a UTF-8 string
 *
 * @throws Returns error responses for:
 *   - 400: Missing or invalid filePath
 *   - 403: File path is outside allowed directories (security violation)
 *   - 500: File read failed or Supabase not configured
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/documents/read
 * // Body: { filePath: "/app/user_data/documents/notes.txt" }
 * // Response: { content: "File content here..." }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { filePath?: string };
    const filePath = body.filePath;
    if (typeof filePath !== "string" || filePath.length === 0) {
      return NextResponse.json(
        { error: "filePath is required" },
        { status: 400 },
      );
    }

    const storageLocation = parseSupabaseStoragePath(filePath);
    if (storageLocation) {
      if (!isSupabaseEnabled()) {
        return NextResponse.json(
          { error: "Supabase storage not configured" },
          { status: 500 },
        );
      }
      const buffer = await downloadSupabaseFile(filePath);
      return NextResponse.json({ content: buffer.toString("utf-8") });
    }
    const sanitizedFilePath = sanitizeFilename(filePath);
    const normalizedPath = path.normalize(sanitizedFilePath);
    const allowedBaseDirs = Array.from(
      new Set(
        [
          getAppDataDirectory(),
          getTempDirectory(),
          process.env.APP_DATA_DIRECTORY,
          process.env.TEMP_DIRECTORY,
          "/app/user_data",
          "/tmp",
        ].filter((dir): dir is string => Boolean(dir)),
      ),
    );
    const resolvedPath = fs.realpathSync(path.resolve(normalizedPath));
    const resolvedBaseDirs = allowedBaseDirs.reduce<string[]>(
      (acc, baseDir) => {
        try {
          acc.push(fs.realpathSync(path.resolve(baseDir)));
        } catch {
          return acc;
        }
        return acc;
      },
      [],
    );
    const isPathAllowed = resolvedBaseDirs.some((baseDir) => {
      return (
        resolvedPath.startsWith(baseDir + path.sep) || resolvedPath === baseDir
      );
    });
    if (!isPathAllowed) {
      console.error("Unauthorized file access attempt:", resolvedPath);
      return NextResponse.json(
        { error: "Access denied: File path not allowed" },
        { status: 403 },
      );
    }
    const content = fs.readFileSync(resolvedPath, "utf-8");

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 },
    );
  }
}
