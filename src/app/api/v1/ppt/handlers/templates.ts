import {
  deleteLayoutsByPresentation,
  listLayoutCodesByPresentation,
  listTemplates,
  upsertLayoutCodes,
  upsertTemplate,
  getTemplateById,
} from "@/server/db/templates";

import { errorResponse, jsonResponse } from "../utils/responses";

/**
 * Payload structure for saving a single layout within a template.
 *
 * A template can contain multiple layouts (different slide designs), and each
 * layout has its own code (React/TSX component code) and metadata.
 */
type TemplateLayoutPayload = {
  presentation: string;
  layout_id: string;
  layout_name: string;
  layout_code: string;
  fonts?: string[] | null;
};

/**
 * Payload structure for saving multiple layouts to a template.
 *
 * Used when saving a complete template with all its layout variations.
 */
type TemplateSavePayload = {
  layouts?: TemplateLayoutPayload[];
};

/**
 * Payload structure for updating template metadata.
 *
 * Template metadata includes name, description, and configuration options
 * like whether layouts should be applied in order or cyclically.
 */
type TemplateMetaPayload = {
  id?: string;
  name?: string;
  description?: string | null;
  ordered?: boolean;
  slides?: Record<string, unknown> | null;
};

/**
 * Handles GET requests to retrieve a summary of all templates.
 *
 * Returns aggregated statistics about templates including:
 * - Total number of templates
 * - Total number of layouts across all templates
 * - For each template: ID, name, description, layout count, last updated time
 *
 * This endpoint is useful for displaying a template management dashboard.
 * It gracefully handles database errors by returning an empty list rather
 * than failing, allowing the UI to degrade gracefully.
 *
 * @returns A JSON response containing:
 *   - `success`: Boolean indicating operation success
 *   - `presentations`: Array of template summary objects, each with:
 *     - `presentation_id`: Unique identifier
 *     - `layout_count`: Number of layouts in this template
 *     - `last_updated_at`: Timestamp of most recent update
 *     - `template`: Object with name and description
 *   - `total_presentations`: Total number of templates
 *   - `total_layouts`: Total number of layouts across all templates
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/templates/summary
 * const response = await handleTemplateSummary();
 * // Response: {
 * //   success: true,
 * //   presentations: [{ presentation_id: "...", layout_count: 5, ... }],
 * //   total_presentations: 10,
 * //   total_layouts: 45
 * // }
 * ```
 */
export const handleTemplateSummary = async () => {
  try {
    const templatesList = await listTemplates();
    const presentations = await Promise.all(
      templatesList.map(async (template) => {
        const layouts = await listLayoutCodesByPresentation(template.id);
        const lastUpdated = layouts.reduce((latest, layout) => {
          return layout.updated_at > latest ? layout.updated_at : latest;
        }, template.created_at);
        return {
          presentation_id: template.id,
          layout_count: layouts.length,
          last_updated_at: lastUpdated || template.created_at,
          template: {
            name: template.name,
            description: template.description,
          },
        };
      }),
    );

    const totalLayouts = presentations.reduce(
      (sum, p) => sum + p.layout_count,
      0,
    );
    return jsonResponse({
      success: true,
      presentations,
      total_presentations: presentations.length,
      total_layouts: totalLayouts,
    });
  } catch (error) {
    console.error("Failed to fetch template summary:", error);
    // Return empty list on database error to allow graceful degradation
    return jsonResponse({
      success: true,
      presentations: [],
      total_presentations: 0,
      total_layouts: 0,
    });
  }
};

/**
 * Handles GET requests to retrieve a complete template by presentation ID.
 *
 * Fetches all layout codes (React/TSX component code) for a template along
 * with template metadata. Also extracts and deduplicates all fonts used
 * across all layouts in the template.
 *
 * This endpoint is used when a user wants to view or edit a specific template,
 * or when loading a template to use for presentation generation.
 *
 * @param presentationId - The unique identifier of the template (presentation)
 *   to retrieve. This is the same ID used for presentations, as templates
 *   are stored as special presentations.
 * @returns A JSON response containing:
 *   - `success`: Boolean indicating operation success
 *   - `layouts`: Array of layout objects, each containing:
 *     - `layout_id`: Unique identifier for the layout
 *     - `layout_name`: Human-readable name
 *     - `layout_code`: React/TSX component code
 *     - `fonts`: Array of font names used in this layout
 *   - `template`: Template metadata object (id, name, description) or null
 *   - `fonts`: Deduplicated array of all fonts used across all layouts
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/templates/abc-123
 * const response = await handleTemplateGet("abc-123");
 * // Response: {
 * //   success: true,
 * //   layouts: [{ layout_id: "...", layout_code: "export default...", ... }],
 * //   template: { id: "abc-123", name: "Modern Template", ... },
 * //   fonts: ["Inter", "Roboto"]
 * // }
 * ```
 */
export const handleTemplateGet = async (presentationId: string) => {
  try {
    // Fetch all layouts (component code) for this template
    const layouts = await listLayoutCodesByPresentation(presentationId);
    // Fetch template metadata
    const template = await getTemplateById(presentationId);
    
    // Extract and deduplicate fonts from all layouts
    // Layouts may have fonts arrays, so we flatten and deduplicate
    const fonts = Array.from(
      new Set(layouts.flatMap((layout) => layout.fonts || [])),
    );
    
    return jsonResponse({
      success: true,
      layouts,
      template: template
        ? {
            id: template.id,
            name: template.name,
            description: template.description,
          }
        : null,
      fonts,
    });
  } catch (error) {
    // Gracefully handle errors by returning empty data
    // This allows the UI to handle missing templates gracefully
    console.error("Failed to fetch template:", error);
    return jsonResponse({
      success: true,
      layouts: [],
      template: null,
      fonts: [],
    });
  }
};

/**
 * Handles DELETE requests to remove a template and all its layouts.
 *
 * Deletes all layout codes associated with a template presentation. This
 * operation is irreversible and will remove all saved layout component code.
 *
 * Note: This only deletes layouts, not the template metadata itself. The
 * template presentation record may still exist in the database.
 *
 * @param presentationId - The unique identifier of the template to delete.
 * @returns A JSON response with `success: true` if deletion was successful.
 *
 * @throws Returns a 500 error response if deletion fails.
 *
 * @example
 * ```typescript
 * // Request: DELETE /api/v1/templates/abc-123
 * const response = await handleTemplateDelete("abc-123");
 * // Response: { success: true }
 * ```
 */
export const handleTemplateDelete = async (presentationId: string) => {
  try {
    // Delete all layouts for this template
    await deleteLayoutsByPresentation(presentationId);
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to delete template:", error);
    return errorResponse("Failed to delete template", 500);
  }
};

/**
 * Handles POST requests to save layout codes for a template.
 *
 * Saves or updates React/TSX component code for one or more layouts within
 * a template. Each layout represents a different slide design variation.
 * The layout code is stored as a string and can be executed to render slides.
 *
 * Request body:
 * - `layouts` (optional): Array of layout objects, each containing:
 *   - `presentation`: Template presentation ID
 *   - `layout_id`: Unique identifier for this layout
 *   - `layout_name`: Human-readable name
 *   - `layout_code`: React/TSX component code as a string
 *   - `fonts` (optional): Array of font names used in this layout
 *
 * The function uses upsert (insert or update) semantics, so calling it
 * multiple times with the same layout_id will update the existing layout.
 *
 * @param request - The HTTP request object containing layout data in the body.
 * @returns A JSON response containing:
 *   - `success`: Boolean indicating operation success
 *   - `saved_count`: Number of layouts that were saved/updated
 *
 * @throws Returns a 500 error response if save operation fails.
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/templates/save
 * // Body: {
 * //   layouts: [{
 * //     presentation: "abc-123",
 * //     layout_id: "layout-1",
 * //     layout_code: "export default function Slide() { ... }",
 * //     fonts: ["Inter"]
 * //   }]
 * // }
 * const response = await handleTemplateSave(request);
 * // Response: { success: true, saved_count: 1 }
 * ```
 */
export const handleTemplateSave = async (request: Request) => {
  try {
    const body = (await request.json()) as TemplateSavePayload;
    // Ensure layouts is an array (default to empty if not provided)
    const layouts = Array.isArray(body.layouts) ? body.layouts : [];
    
    // Upsert (insert or update) all layouts
    // Each layout gets a composite ID: presentation-layout_id
    const records = await upsertLayoutCodes(
      layouts.map((layout) => ({
        id: `${layout.presentation}-${layout.layout_id}`,
        presentation: layout.presentation,
        layout_id: layout.layout_id,
        layout_name: layout.layout_name,
        layout_code: layout.layout_code,
        fonts: layout.fonts || null,
      })),
    );
    return jsonResponse({ success: true, saved_count: records.length });
  } catch (error) {
    console.error("Failed to save template:", error);
    return errorResponse("Failed to save template", 500);
  }
};

/**
 * Handles POST requests to save or update template metadata.
 *
 * Creates or updates template metadata including name, description, and
 * configuration options. Templates are stored as special presentations
 * with additional metadata fields.
 *
 * Request body fields:
 * - `id` (required): Unique identifier for the template (presentation ID)
 * - `name` (required): Human-readable template name
 * - `description` (optional): Template description text
 * - `ordered` (optional): Whether layouts should be applied sequentially
 *   (true) or cyclically (false). Defaults to false if not provided.
 * - `slides` (optional): Object containing slide configuration data.
 *   Must be an object (not an array) if provided.
 *
 * The function uses upsert semantics, so it will create a new template
 * if one doesn't exist, or update an existing one.
 *
 * @param request - The HTTP request object containing template metadata in the body.
 * @returns A JSON response containing:
 *   - `success`: Boolean indicating operation success
 *   - `template`: The saved template object with all metadata fields
 *
 * @throws Returns error responses for:
 *   - 400: Missing required `id` or `name` fields
 *   - 500: Database save operation failed
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/templates
 * // Body: {
 * //   id: "abc-123",
 * //   name: "Modern Pitch Deck",
 * //   description: "Clean and professional design",
 * //   ordered: false
 * // }
 * const response = await handleTemplateMeta(request);
 * // Response: { success: true, template: { id: "...", name: "...", ... } }
 * ```
 */
export const handleTemplateMeta = async (request: Request) => {
  try {
    const body = (await request.json()) as TemplateMetaPayload;
    // Validate required fields
    if (!body.id || !body.name) {
      return errorResponse("id and name are required");
    }
    
    // Validate slides field: must be an object if provided, not an array
    // This ensures slides configuration is properly structured
    const slides =
      body.slides &&
      typeof body.slides === "object" &&
      !Array.isArray(body.slides)
        ? body.slides
        : null;
    
    // Upsert template metadata
    const template = await upsertTemplate({
      id: body.id,
      name: body.name,
      description: body.description || null,
      ordered: Boolean(body.ordered), // Convert to boolean explicitly
      slides,
    });
    return jsonResponse({ success: true, template });
  } catch (error) {
    console.error("Failed to save template meta:", error);
    return errorResponse("Failed to save template metadata", 500);
  }
};

/**
 * Handles GET requests to list all available built-in templates.
 *
 * Reads the templates manifest file (templates-manifest.json) from the
 * public directory, which contains metadata about pre-built template
 * designs that come with the application. These are templates that users
 * can select when creating a new presentation.
 *
 * The manifest file is generated by a build script and contains:
 * - Template names and IDs
 * - File paths for template components
 * - Settings like description, ordering mode, and default flag
 *
 * This endpoint gracefully handles missing manifest files by returning
 * an empty array, allowing the application to work even if templates
 * haven't been generated yet.
 *
 * @returns A JSON response containing an array of template objects, each with:
 *   - `templateName`: Human-readable template name
 *   - `templateID`: Unique identifier for the template
 *   - `files`: Array of file paths for template component files
 *   - `settings`: Object with description, ordered flag, and default flag
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/templates
 * const response = await handleTemplatesList();
 * // Response: [{
 * //   templateName: "Modern",
 * //   templateID: "modern-template",
 * //   files: ["slide1.tsx", "slide2.tsx"],
 * //   settings: { description: "...", ordered: false, default: true }
 * // }, ...]
 * ```
 */
export const handleTemplatesList = async () => {
  try {
    // 1. Built-in templates (templates-manifest.json)
    // Dynamically import fs and path to avoid loading them unless needed
    const { promises: fs } = await import("node:fs");
    const { join } = await import("node:path");
    
    let builtInTemplates: Array<{
      templateName: string;
      templateID: string;
      files: string[];
      settings: { description: string; ordered: boolean; default: boolean } | null;
    }> = [];
    
    try {
      // Read templates manifest from public directory
      // This file is generated during build and contains template metadata
      const manifestPath = join(process.cwd(), "public", "templates-manifest.json");
      const manifestContent = await fs.readFile(manifestPath, "utf-8");
      builtInTemplates = JSON.parse(manifestContent);
    } catch (manifestError) {
      // If manifest file doesn't exist or is invalid, log warning but continue
      // This allows the app to work even if templates haven't been generated
      console.warn("Failed to read templates manifest:", manifestError);
    }

    return jsonResponse(builtInTemplates);
  } catch (error) {
    // Gracefully handle any errors by returning empty array
    console.error("Failed to list templates:", error);
    return jsonResponse([]);
  }
};
