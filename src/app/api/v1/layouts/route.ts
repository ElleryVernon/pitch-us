import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

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
 * Handles POST requests to save layout components to the file system.
 *
 * Takes React/TSX component code and saves it as individual files in a
 * layout-specific directory. This allows users to save custom slide layouts
 * that can be reused across presentations.
 *
 * Request body:
 * - `layout_name` (required): Name of the layout (used as directory name)
 * - `components` (required): Array of component objects, each containing:
 *   - `slide_number`: Index of the slide this component is for
 *   - `component_code`: React/TSX component code (may include markdown code fences)
 *   - `component_name`: Name of the component (used as filename)
 *
 * Process:
 * 1. Validates request body
 * 2. Creates layout directory if it doesn't exist
 * 3. For each component:
 *    - Cleans code (removes markdown code fences if present)
 *    - Saves as .tsx file in the layout directory
 * 4. Returns summary of saved files
 *
 * @param request - The HTTP request object containing layout data.
 * @returns A JSON response with:
 *   - `success`: Boolean indicating operation success
 *   - `layout_name`: Name of the saved layout
 *   - `path`: Filesystem path where components were saved
 *   - `saved_files`: Number of component files saved
 *   - `components`: Array of saved component metadata
 *
 * @throws Returns error responses for:
 *   - 400: Invalid request body (missing layout_name or components)
 *   - 500: File system operation failed
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/layouts
 * // Body: {
 * //   layout_name: "modern-template",
 * //   components: [
 * //     { slide_number: 1, component_code: "export default...", component_name: "Slide1" }
 * //   ]
 * // }
 * // Response: { success: true, layout_name: "...", path: "...", saved_files: 1, ... }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const { layout_name, components } = await request.json();

    // Validate request body
    if (!layout_name || !components || !Array.isArray(components)) {
      return NextResponse.json(
        {
          error:
            "Invalid request body. Expected layout_name and components array.",
        },
        { status: 400 },
      );
    }

    // Define the layouts directory path
    // Layouts are stored in app_data/layouts/{layout_name}/
    const layoutsDir = join(process.cwd(), "app_data", "layouts", layout_name);

    // Create the directory if it doesn't exist
    if (!existsSync(layoutsDir)) {
      await mkdir(layoutsDir, { recursive: true });
    }

    // Save each component as a separate file
    const savedFiles = [];

    for (const component of components) {
      const { slide_number, component_code, component_name } = component;

      // Skip components with missing required fields
      if (!component_code || !component_name) {
        console.warn(
          `Skipping component for slide ${slide_number}: missing code or name`,
        );
        continue;
      }

      // Generate filename from component name
      const fileName = `${component_name}.tsx`;
      const filePath = join(layoutsDir, fileName);
      
      // Clean component code: remove markdown code fences if present
      // This handles cases where LLM-generated code includes ```tsx fences
      const cleanComponentCode = component_code
        .replace(/```tsx/g, "")
        .replace(/```/g, "");

      // Write component code to file
      await writeFile(filePath, cleanComponentCode, "utf8");
      savedFiles.push({
        slide_number,
        component_name,
        file_path: filePath,
        file_name: fileName,
      });
    }

    return NextResponse.json({
      success: true,
      layout_name,
      path: layoutsDir,
      saved_files: savedFiles.length,
      components: savedFiles,
    });
  } catch (error) {
    console.error("Error saving layout:", error);
    return NextResponse.json(
      { error: "Failed to save layout components" },
      { status: 500 },
    );
  }
}
