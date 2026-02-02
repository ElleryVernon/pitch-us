import path from "node:path";
import { promises as fs } from "node:fs";

import { getFontsDirectory } from "@/server/storage";

import { MAX_FONT_UPLOAD_BYTES } from "../utils/constants";
import { errorResponse, jsonResponse } from "../utils/responses";

/**
 * Handles POST requests to upload a font file.
 *
 * Accepts a multipart/form-data request with a font file (TTF, OTF, WOFF, etc.),
 * validates its size, saves it to the fonts directory, and returns metadata
 * about the uploaded font.
 *
 * Request body (multipart/form-data):
 * - `font_file` (required): Font file to upload
 *
 * Validation:
 * - File size must not exceed MAX_FONT_UPLOAD_BYTES (20MB default)
 * - Filename is sanitized to prevent directory traversal attacks
 *
 * @param request - The HTTP request object containing the font file in form data.
 * @returns A JSON response containing:
 *   - `success`: Boolean indicating operation success
 *   - `font_name`: Name of the font (extracted from filename)
 *   - `font_url`: URL-accessible path to the font file
 *   - `font_path`: Full filesystem path where the font was saved
 *
 * @throws Returns error responses for:
 *   - 400: Missing file or file exceeds maximum size
 *   - 500: File save operation failed
 */
export const handleFontsUpload = async (request: Request) => {
  const formData = await request.formData();
  const file = formData.get("font_file");
  if (!(file instanceof File)) {
    return errorResponse("font_file is required");
  }
  if (file.size > MAX_FONT_UPLOAD_BYTES) {
    return errorResponse("Font exceeded max upload size");
  }
  const fontsDir = getFontsDirectory();
  const safeName = file.name.replace(/[^\w.\-]/g, "_");
  const filePath = path.join(fontsDir, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);
  return jsonResponse({
    success: true,
    font_name: path.parse(safeName).name,
    font_url: `/app_data/fonts/${safeName}`,
    font_path: filePath,
  });
};

/**
 * Handles GET requests to list all available font files.
 *
 * Scans the fonts directory and returns metadata about each font file including
 * filename, font name (extracted from filename), file size, and file type.
 *
 * @returns A JSON response containing:
 *   - `success`: Boolean indicating operation success
 *   - `fonts`: Array of font objects, each with:
 *     - `filename`: Original filename
 *     - `font_name`: Name extracted from filename (without extension)
 *     - `original_name`: Original filename
 *     - `font_url`: URL-accessible path to the font
 *     - `font_type`: File extension (e.g., "ttf", "otf", "woff")
 *     - `file_size`: Size of the font file in bytes
 *   - `message`: Summary message with font count
 */
export const handleFontsList = async () => {
  const fontsDir = getFontsDirectory();
  const entries = await fs.readdir(fontsDir);
  const fonts = await Promise.all(
    entries.map(async (filename) => {
      const filePath = path.join(fontsDir, filename);
      const stats = await fs.stat(filePath);
      return {
        filename,
        font_name: path.parse(filename).name,
        original_name: filename,
        font_url: `/app_data/fonts/${filename}`,
        font_type: path.extname(filename).slice(1),
        file_size: stats.size,
      };
    }),
  );
  return jsonResponse({
    success: true,
    fonts,
    message: `Found ${fonts.length} font files`,
  });
};

/**
 * Handles DELETE requests to remove a font file.
 *
 * Deletes a font file from the fonts directory. This operation is irreversible.
 *
 * @param filename - The filename of the font to delete (must match exactly).
 * @returns A JSON response with:
 *   - `success`: Boolean indicating operation success
 *   - `message`: Success message
 *
 * @throws May throw filesystem errors if the file doesn't exist or can't be deleted.
 */
export const handleFontsDelete = async (filename: string) => {
  const fontsDir = getFontsDirectory();
  const filePath = path.join(fontsDir, filename);
  await fs.unlink(filePath);
  return jsonResponse({ success: true, message: "Font deleted successfully" });
};
