import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { sanitizeFilename } from "@/app/(presentation-generator)/utils/others";
import { getAppDataDirectory, getTempDirectory } from "@/server/storage";
import {
  downloadSupabaseFile,
  isSupabaseEnabled,
  parseSupabaseStoragePath,
} from "@/server/supabase-storage";

/**
 * Determines the MIME content type for a file based on its extension.
 *
 * Maps common file extensions to their corresponding MIME types for proper
 * HTTP response headers. This ensures browsers handle files correctly
 * (e.g., displaying PDFs inline vs downloading).
 *
 * @param filePath - The file path (filename is sufficient, full path works too).
 * @returns The MIME type string for the file, or "application/octet-stream"
 *   for unknown extensions.
 */
const getContentType = (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".ppt":
      return "application/vnd.ms-powerpoint";
    case ".pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".md":
      return "text/markdown; charset=utf-8";
    default:
      return "application/octet-stream";
  }
};

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
 * Handles POST requests to preview document files.
 *
 * Reads a file from storage (local filesystem or Supabase) and returns it
 * as an HTTP response with appropriate content type headers. This allows
 * the frontend to display documents inline (e.g., PDF viewer, image viewer).
 *
 * Security:
 * - Validates file paths to prevent directory traversal attacks
 * - Only allows access to files within allowed base directories
 * - Sanitizes filenames before processing
 * - Supports both local filesystem and Supabase storage
 *
 * Request body:
 * - `filePath` (required): Path to the file to preview. Can be:
 *   - Local filesystem path (within allowed directories)
 *   - Supabase storage path (format: "supabase://bucket/path")
 *
 * Allowed base directories:
 * - App data directory (APP_DATA_DIRECTORY env var or default)
 * - Temp directory (TEMP_DIRECTORY env var or default)
 * - Standard paths: /app/user_data, /tmp
 *
 * @param request - The HTTP request object containing the file path in the body.
 * @returns An HTTP response with:
 *   - File contents as the response body
 *   - Content-Type header matching the file type
 *   - Content-Disposition header for inline display
 *
 * @throws Returns error responses for:
 *   - 400: Missing or invalid filePath
 *   - 403: File path is outside allowed directories (security violation)
 *   - 500: File read failed or Supabase not configured
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/documents/preview
 * // Body: { filePath: "/app/user_data/documents/report.pdf" }
 * // Response: PDF file content with Content-Type: application/pdf
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

    // Check if this is a Supabase storage path
    const storageLocation = parseSupabaseStoragePath(filePath);
    if (storageLocation) {
      // Verify Supabase is configured before attempting download
      if (!isSupabaseEnabled()) {
        return NextResponse.json(
          { error: "Supabase storage not configured" },
          { status: 500 },
        );
      }
      // Download file from Supabase storage
      const buffer = await downloadSupabaseFile(filePath);
      const filename = path.basename(storageLocation.path);
      // Return file with appropriate headers for inline display
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": getContentType(storageLocation.path),
          "Content-Disposition": `inline; filename="${filename}"`,
        },
      });
    }

    // Handle local filesystem path
    // Sanitize filename to prevent directory traversal attacks
    const sanitizedFilePath = sanitizeFilename(filePath);
    const normalizedPath = path.normalize(sanitizedFilePath);
    
    // Define allowed base directories for file access
    // This prevents access to files outside the application's data directories
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
    
    // Resolve both the requested path and base directories to absolute paths
    // This handles symlinks and relative paths correctly
    const resolvedPath = fs.realpathSync(path.resolve(normalizedPath));
    const resolvedBaseDirs = allowedBaseDirs.reduce<string[]>(
      (acc, baseDir) => {
        try {
          acc.push(fs.realpathSync(path.resolve(baseDir)));
        } catch {
          // If base directory doesn't exist, skip it
          return acc;
        }
        return acc;
      },
      [],
    );
    
    // Verify that the resolved path is within one of the allowed base directories
    // This is the critical security check that prevents directory traversal
    const isPathAllowed = resolvedBaseDirs.some((baseDir) => {
      return (
        resolvedPath.startsWith(baseDir + path.sep) || resolvedPath === baseDir
      );
    });
    if (!isPathAllowed) {
      // Log unauthorized access attempts for security monitoring
      console.error("Unauthorized file access attempt:", resolvedPath);
      return NextResponse.json(
        { error: "Access denied: File path not allowed" },
        { status: 403 },
      );
    }

    const buffer = fs.readFileSync(resolvedPath);
    const filename = path.basename(resolvedPath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": getContentType(resolvedPath),
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error loading file preview:", error);
    return NextResponse.json(
      { error: "Failed to load file preview" },
      { status: 500 },
    );
  }
}
