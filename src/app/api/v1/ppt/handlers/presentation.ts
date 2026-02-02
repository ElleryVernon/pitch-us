import {
  createPresentation,
  deletePresentation,
  getPresentationById,
  listPresentationSummaries,
  updatePresentation,
} from "@/server/db/presentations";
import {
  listSlidesByPresentation,
  replaceSlidesForPresentation,
} from "@/server/db/slides";
import { v4 as uuidv4 } from "uuid";

import { errorResponse, jsonResponse } from "../utils/responses";
import {
  LayoutPayload,
  Outline,
  SlideResponse,
  SlideSchema,
} from "../types/streaming";
import { createSseStream, sseChunk } from "@/server/sse";
import { buildDataFromSchema } from "@/server/schema";
import {
  buildOutlines,
  buildPlaceholderFromSchema,
  buildSlideContentStream,
  processImagesInContent,
  sanitizeAndRepairJson,
} from "../utils/content-builders";
import {
  buildFullSourceContent,
  resolveDocumentContent,
  waitForPresentationReady,
} from "../utils/document-resolver";
import {
  MAX_PRIORITY_START_DELAY_MS,
  MAX_STREAM_SLIDE_CONCURRENCY,
  MIN_DELTA_INTERVAL_MS,
  PRIORITY_START_DELAY_MS,
} from "../utils/constants";
import { SlideDeltaHandler } from "../types/streaming";
import { createOutlineDeltaParser } from "../utils/delta-parsers";
import { generateJsonStream } from "@/server/llm";
import { getOutlineModel } from "@/server/llm";
import { jsonrepair } from "jsonrepair";
import type { PptxPresentationModel } from "@/types/pptx-models";

/**
 * Default number of presentations to return per page when paginating.
 * This provides a reasonable default for most use cases while preventing
 * excessive data transfer.
 */
const DEFAULT_PAGE_LIMIT = 50;

/**
 * Maximum number of presentations that can be requested in a single page.
 * This limit prevents abuse and ensures reasonable response times even
 * for large datasets.
 */
const MAX_PAGE_LIMIT = 200;

/**
 * Parses the "limit" query parameter from a URL and validates it.
 *
 * Extracts the pagination limit from the URL's query string, ensuring it
 * is a valid positive integer within acceptable bounds. Invalid values
 * default to DEFAULT_PAGE_LIMIT.
 *
 * @param url - The URL object containing query parameters to parse.
 * @returns A valid page limit between 1 and MAX_PAGE_LIMIT (inclusive),
 *   defaulting to DEFAULT_PAGE_LIMIT if the parameter is missing or invalid.
 *
 * @example
 * ```typescript
 * const url = new URL("https://example.com/api?limit=100");
 * const limit = parsePageLimit(url); // Returns 100
 * ```
 */
const parsePageLimit = (url: URL) => {
  const raw = url.searchParams.get("limit");
  if (!raw) return DEFAULT_PAGE_LIMIT;
  const parsed = Number.parseInt(raw, 10);
  // Validate that the parsed value is a finite positive number
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_PAGE_LIMIT;
  }
  // Clamp the value to the maximum allowed limit
  return Math.min(parsed, MAX_PAGE_LIMIT);
};

/**
 * Parses the "cursor" query parameter from a URL for pagination.
 *
 * Cursor-based pagination uses opaque tokens to mark the position in
 * a result set, allowing efficient pagination without offset-based
 * queries. This function extracts and validates the cursor token.
 *
 * @param url - The URL object containing query parameters to parse.
 * @returns The cursor string if present and non-empty, null otherwise.
 *   Empty strings are treated as null to handle edge cases.
 *
 * @example
 * ```typescript
 * const url = new URL("https://example.com/api?cursor=abc123");
 * const cursor = parseCursor(url); // Returns "abc123"
 * ```
 */
const parseCursor = (url: URL) => {
  const raw = url.searchParams.get("cursor");
  if (!raw) return null;
  const trimmed = raw.trim();
  // Return null for empty strings to ensure consistent behavior
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Handles GET requests to retrieve all completed presentations with pagination.
 *
 * This endpoint returns a paginated list of presentations that have at least
 * one slide (completed presentations). It supports cursor-based pagination
 * for efficient traversal of large datasets.
 *
 * Query parameters:
 * - `limit` (optional): Number of items per page (default: 50, max: 200)
 * - `cursor` (optional): Pagination token from previous response
 *
 * @param request - Optional Request object containing URL with query parameters.
 *   If not provided, defaults are used for pagination.
 * @returns A JSON response containing:
 *   - `items`: Array of presentation summary objects, each including basic
 *     presentation metadata and the first slide for preview
 *   - `next_cursor`: Cursor token for the next page, or null if this is
 *     the last page
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/presentations?limit=20&cursor=abc123
 * const response = await handlePresentationGetAll(request);
 * // Response: { items: [...], next_cursor: "def456" }
 * ```
 */
export const handlePresentationGetAll = async (request?: Request) => {
  const url = request ? new URL(request.url) : null;
  const limit = url ? parsePageLimit(url) : DEFAULT_PAGE_LIMIT;
  const cursor = url ? parseCursor(url) : null;
  // Filter for presentations that have slides (completed)
  const { items, nextCursor } = await listPresentationSummaries({
    limit,
    cursor,
    slidesFilter: "completed",
  });
  return jsonResponse({ items, next_cursor: nextCursor });
};

/**
 * Handles GET requests to retrieve draft presentations with pagination.
 *
 * Draft presentations are those that have been created but do not yet have
 * any slides generated. This endpoint allows users to see their work-in-progress
 * presentations.
 *
 * Query parameters:
 * - `limit` (optional): Number of items per page (default: 50, max: 200)
 * - `cursor` (optional): Pagination token from previous response
 *
 * @param request - Optional Request object containing URL with query parameters.
 *   If not provided, defaults are used for pagination.
 * @returns A JSON response containing:
 *   - `items`: Array of presentation summary objects for drafts (presentations
 *     without slides)
 *   - `next_cursor`: Cursor token for the next page, or null if this is
 *     the last page
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/presentations/drafts?limit=10
 * const response = await handlePresentationGetDrafts(request);
 * // Response: { items: [...], next_cursor: null }
 * ```
 */
export const handlePresentationGetDrafts = async (request?: Request) => {
  const url = request ? new URL(request.url) : null;
  const limit = url ? parsePageLimit(url) : DEFAULT_PAGE_LIMIT;
  const cursor = url ? parseCursor(url) : null;
  // Filter for presentations without slides (drafts)
  const { items, nextCursor } = await listPresentationSummaries({
    limit,
    cursor,
    slidesFilter: "drafts",
  });
  return jsonResponse({ items, next_cursor: nextCursor });
};

/**
 * Handles GET requests to retrieve a single presentation by ID.
 *
 * Fetches the complete presentation data including all associated slides.
 * This is used when a user wants to view or edit a specific presentation.
 *
 * @param id - The unique identifier of the presentation to retrieve.
 *   This should be a valid UUID that exists in the database.
 * @returns A JSON response containing:
 *   - All presentation fields (id, content, language, metadata, etc.)
 *   - `slides`: Array of all slides belonging to this presentation,
 *     ordered by slide_index
 *
 * @throws Returns a 404 error response if the presentation does not exist.
 *
 * @example
 * ```typescript
 * // Request: GET /api/v1/presentations/abc-123-def
 * const response = await handlePresentationGet("abc-123-def");
 * // Response: { id: "abc-123-def", content: "...", slides: [...] }
 * ```
 */
export const handlePresentationGet = async (id: string) => {
  const presentation = await getPresentationById(id);
  if (!presentation) {
    return errorResponse("Presentation not found", 404);
  }
  // Fetch all slides for this presentation, ordered by index
  const slidesList = await listSlidesByPresentation(id);
  return jsonResponse({ ...presentation, slides: slidesList });
};

/**
 * Handles DELETE requests to remove a presentation from the database.
 *
 * Deletes a presentation and all its associated slides. This operation
 * is irreversible and will cascade delete related data.
 *
 * @param id - The unique identifier of the presentation to delete.
 *   This should be a valid UUID that exists in the database.
 * @returns An HTTP response with:
 *   - Status 204 (No Content) if deletion was successful
 *   - Status 404 (Not Found) if the presentation does not exist
 *
 * @example
 * ```typescript
 * // Request: DELETE /api/v1/presentations/abc-123-def
 * const response = await handlePresentationDelete("abc-123-def");
 * // Response: 204 No Content
 * ```
 */
export const handlePresentationDelete = async (id: string) => {
  const ok = await deletePresentation(id);
  // 204 No Content indicates successful deletion with no response body
  // 404 indicates the resource was not found
  return new Response(null, { status: ok ? 204 : 404 });
};

/**
 * Handles POST requests to create a new presentation.
 *
 * Creates a new presentation record in the database with user-provided
 * content and configuration. The presentation starts in a draft state
 * (no slides) and can be populated later through the outline and slide
 * generation endpoints.
 *
 * Request body fields:
 * - `language` (required): Language code for the presentation (e.g., "en", "ko")
 * - `content` (optional): User-provided text prompt describing the presentation
 * - `document_content` (optional): Extracted text content from uploaded files
 * - `n_slides` (optional): Target number of slides (default: 10)
 * - `tone` (optional): Desired tone for content generation
 * - `verbosity` (optional): Level of detail in generated content
 * - `instructions` (optional): Additional instructions for content generation
 * - `include_table_of_contents` (optional): Whether to include a TOC slide
 * - `include_title_slide` (optional): Whether to include a title slide (default: true)
 * - `web_search` (optional): Whether to enable web search for content
 * - `file_metadata` (optional): Metadata about uploaded source files
 *
 * Validation rules:
 * - At least one of `content` or `document_content` must be provided
 * - `language` is required
 * - `n_slides` defaults to 10 if not provided
 *
 * @param request - The HTTP request object containing the presentation
 *   creation payload in the request body.
 * @returns A JSON response containing the created presentation object
 *   with all its fields, including the generated UUID.
 *
 * @throws Returns a 400 error response if validation fails:
 *   - Missing required `language` field
 *   - Both `content` and `document_content` are missing or empty
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/presentations
 * // Body: { language: "en", content: "Startup pitch deck", n_slides: 12 }
 * const response = await handlePresentationCreate(request);
 * // Response: { id: "uuid", language: "en", content: "...", ... }
 * ```
 */
export const handlePresentationCreate = async (request: Request) => {
  const body = await request.json();

  // Validate required fields: language is required
  // n_slides defaults to 10 if not provided
  // Either content (prompt) OR document_content must be provided
  if (!body.language) {
    return errorResponse("language is required");
  }

  // Default to 10 slides if not specified
  const nSlides = typeof body.n_slides === "number" ? body.n_slides : 10;
  
  // Check if user provided a text prompt
  const hasContent =
    body.content &&
    typeof body.content === "string" &&
    body.content.trim().length > 0;
  
  // Check if user provided document content (from uploaded files)
  const hasDocumentContent =
    body.document_content &&
    typeof body.document_content === "string" &&
    body.document_content.trim().length > 0;

  // At least one source of content is required
  if (!hasContent && !hasDocumentContent) {
    return errorResponse(
      "Either content (prompt) or document_content must be provided",
    );
  }

  // Generate a unique identifier for the new presentation
  const id = uuidv4();
  const created = await createPresentation({
    id,
    content: body.content || "",
    n_slides: nSlides,
    language: body.language,
    document_content: body.document_content || null,
    file_metadata: body.file_metadata || null,
    tone: body.tone || null,
    verbosity: body.verbosity || null,
    instructions: body.instructions || null,
    include_table_of_contents: Boolean(body.include_table_of_contents),
    include_title_slide: body.include_title_slide !== false,
    web_search: Boolean(body.web_search),
    // These fields will be populated later during outline/layout generation
    outlines: null,
    layout: null,
    structure: null,
    title: null,
  });
  return jsonResponse(created);
};

/**
 * Payload structure for updating individual slides within a presentation.
 *
 * This type defines the fields that can be updated for a single slide.
 * All fields are optional, allowing partial updates.
 */
type SlideUpdatePayload = {
  id?: string;
  layout_group?: string | null;
  layout?: string | null;
  index?: number;
  speaker_note?: string | null;
  content?: Record<string, unknown>;
  html_content?: string | null;
};

/**
 * Handles PATCH requests to update an existing presentation.
 *
 * Updates presentation metadata and optionally replaces all slides.
 * This endpoint supports partial updates - only provided fields are updated,
 * others remain unchanged. If slides are provided, they completely replace
 * the existing slides for the presentation.
 *
 * Request body fields (all optional):
 * - `id` (required): The presentation ID to update
 * - `n_slides`: Target number of slides
 * - `title`: Presentation title
 * - `language`: Language code
 * - `tone`: Content tone preference
 * - `verbosity`: Content detail level
 * - `instructions`: Additional generation instructions
 * - `include_table_of_contents`: Whether to include TOC slide
 * - `include_title_slide`: Whether to include title slide
 * - `web_search`: Whether to enable web search
 * - `outlines`: Array of outline objects for slides
 * - `layout`: Layout configuration object
 * - `structure`: Structure mapping array
 * - `slides`: Array of slide objects to replace existing slides
 *
 * Layout handling:
 * - If layout is provided without slides array, existing slides are preserved
 * - If layout is provided with slides array, the new slides replace existing ones
 *
 * @param request - The HTTP request object containing update payload.
 * @param parsedBody - Optional pre-parsed body object. If provided, skips
 *   JSON parsing from the request. Useful when body is already parsed elsewhere.
 * @returns A JSON response containing the updated presentation object with
 *   all its slides.
 *
 * @throws Returns error responses for:
 *   - 400: Missing required `id` field
 *   - 404: Presentation not found
 *
 * @example
 * ```typescript
 * // Request: PATCH /api/v1/presentations/abc-123
 * // Body: { id: "abc-123", title: "New Title", n_slides: 15 }
 * const response = await handlePresentationUpdate(request);
 * // Response: { id: "abc-123", title: "New Title", ... }
 * ```
 */
export const handlePresentationUpdate = async (
  request: Request,
  parsedBody?: Record<string, unknown>,
) => {
  const body = parsedBody ?? (await request.json());
  const presentationId = body.id as string;
  if (!presentationId) {
    return errorResponse("id is required");
  }
  
  // Verify the presentation exists before attempting to update
  const existing = await getPresentationById(presentationId);
  if (!existing) {
    return errorResponse("Presentation not found", 404);
  }

  // Handle layout updates with special logic to preserve existing slides
  // if new layout doesn't include slides array
  let nextLayout = body.layout ?? undefined;
  if (nextLayout && typeof nextLayout === "object") {
    const incomingSlides = (nextLayout as LayoutPayload).slides;
    const hasIncomingSlides =
      Array.isArray(incomingSlides) && incomingSlides.length > 0;
    
    // If new layout doesn't have slides, merge with existing layout's slides
    // This allows updating layout metadata without losing slide definitions
    if (!hasIncomingSlides) {
      const existingLayout = existing.layout as LayoutPayload | null;
      if (existingLayout?.slides && existingLayout.slides.length > 0) {
        nextLayout = {
          ...existingLayout,
          ...nextLayout,
          slides: existingLayout.slides,
        };
      }
    }
  }

  // Update presentation metadata (only provided fields are updated)
  const updated = await updatePresentation(presentationId, {
    n_slides: body.n_slides ?? undefined,
    title: body.title ?? undefined,
    language: body.language ?? undefined,
    tone: body.tone ?? undefined,
    verbosity: body.verbosity ?? undefined,
    instructions: body.instructions ?? undefined,
    include_table_of_contents: body.include_table_of_contents ?? undefined,
    include_title_slide: body.include_title_slide ?? undefined,
    web_search: body.web_search ?? undefined,
    outlines: body.outlines ?? undefined,
    layout: nextLayout,
    structure: body.structure ?? undefined,
  });
  
  // Handle slide updates: if slides array is provided, replace all slides
  // Otherwise, return existing slides
  const slidesList = Array.isArray(body.slides)
    ? await replaceSlidesForPresentation(
        presentationId,
        // Transform slide payloads to database format
        (body.slides as SlideUpdatePayload[]).map((slide, idx) => ({
          id: slide.id || uuidv4(), // Generate ID if not provided
          presentation: presentationId,
          layout_group: slide.layout_group ?? null,
          layout: slide.layout ?? null,
          slide_index: slide.index ?? idx, // Use provided index or array position
          speaker_note: slide.speaker_note || "",
          content: slide.content || {},
          html_content: slide.html_content || null,
        })),
      )
    : await listSlidesByPresentation(presentationId);
  
  return jsonResponse({
    ...updated,
    slides: slidesList,
  });
};

/**
 * Handles POST requests to export a presentation as a PPTX file.
 *
 * Takes a PPTX presentation model (structured data representing slides)
 * and converts it to an actual .pptx file. The model contains slide
 * definitions with content, styling, and layout information that gets
 * transformed into PowerPoint's native format.
 *
 * Request body:
 * - `slides` (required): Array of slide objects, each containing:
 *   - Content data (text, images, charts, etc.)
 *   - Styling information (fonts, colors, positioning)
 *   - Layout metadata
 *
 * The export process:
 * 1. Validates the model structure
 * 2. Converts slide data to PPTX XML format
 * 3. Packages everything into a .pptx ZIP archive
 * 4. Saves to storage and returns the file path
 *
 * @param request - The HTTP request object containing the PPTX model
 *   in the request body.
 * @returns A JSON response containing the file path where the PPTX
 *   was saved, typically a URL-accessible path like `/app_data/exports/...`.
 *
 * @throws Returns error responses for:
 *   - 400: Invalid model payload (missing slides or empty array)
 *   - 500: Export process failed (file system error, conversion error, etc.)
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/presentations/abc-123/export/pptx
 * // Body: { slides: [{ content: {...}, style: {...} }, ...] }
 * const response = await handleExportPptx(request);
 * // Response: { path: "/app_data/exports/presentation.pptx" }
 * ```
 */
export const handleExportPptx = async (request: Request) => {
  try {
    const model = (await request.json()) as PptxPresentationModel;
    // Validate that model has required structure with at least one slide
    if (!model || !Array.isArray(model.slides) || model.slides.length === 0) {
      return errorResponse("Invalid PPTX model payload", 400);
    }
    // Dynamically import the export module to avoid loading it unless needed
    const { exportPptxModel } = await import("@/server/pptx/export");
    const path = await exportPptxModel(model);
    return jsonResponse(path);
  } catch (error) {
    console.error("PPTX export failed:", error);
    return errorResponse("Failed to export PPTX", 500);
  }
};

/**
 * Handles POST requests to prepare a presentation with outlines and layout.
 *
 * This endpoint is called after outlines are generated and a layout is selected.
 * It validates the outlines and layout data, creates a structure mapping that
 * determines which layout template to use for each slide, and saves everything
 * to the database. This prepares the presentation for slide content generation.
 *
 * Request body fields:
 * - `presentation_id` (required): The ID of the presentation to prepare
 * - `outlines` (required): Array of outline objects, each containing:
 *   - `content`: Text description of what the slide should contain
 * - `layout` (required): Layout configuration object containing:
 *   - `name`: Name of the layout template
 *   - `ordered`: Whether layouts should be applied sequentially or cyclically
 *   - `slides`: Array of layout slide definitions, each with:
 *     - `id`: Unique identifier for the layout
 *     - `json_schema`: JSON schema defining the structure of slide content
 *
 * Validation:
 * - All layout slides must have a non-empty json_schema
 * - Outlines array must not be empty
 * - Layout must have at least one slide definition
 *
 * Structure mapping:
 * - Creates an array mapping each outline to a layout index
 * - If `ordered` is true: uses layouts sequentially (slide 0 → layout 0, etc.)
 * - If `ordered` is false: cycles through layouts (slide 0 → layout 0, slide 1 → layout 1, slide 2 → layout 0, etc.)
 *
 * @param request - The HTTP request object containing preparation data.
 * @param parsedBody - Optional pre-parsed body object. If provided, skips
 *   JSON parsing from the request.
 * @returns A JSON response containing the updated presentation object with
 *   outlines, layout, and structure fields populated.
 *
 * @throws Returns error responses for:
 *   - 400: Missing required fields or invalid data structure
 *   - 404: Presentation not found
 *   - 500: Database update failed
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/presentations/abc-123/prepare
 * // Body: {
 * //   presentation_id: "abc-123",
 * //   outlines: [{ content: "Introduction slide" }, ...],
 * //   layout: { name: "modern", ordered: false, slides: [...] }
 * // }
 * const response = await handlePresentationPrepare(request);
 * ```
 */
export const handlePresentationPrepare = async (
  request: Request,
  parsedBody?: Record<string, unknown>,
) => {
  const body = parsedBody ?? (await request.json());

  const presentationId = body.presentation_id as string;
  const outlines = body.outlines as Outline[];
  const layout = body.layout as LayoutPayload;

  if (!presentationId) {
    return errorResponse("presentation_id is required", 400);
  }

  const presentation = await getPresentationById(presentationId);
  if (!presentation) {
    return errorResponse("Presentation not found", 404);
  }

  if (!Array.isArray(outlines) || !outlines.length) {
    return errorResponse("outlines are required", 400);
  }

  if (!layout || !Array.isArray(layout.slides) || !layout.slides.length) {
    return errorResponse("layout is required", 400);
  }

  // Validate that all layout slides have json_schema defined
  // The schema is required to generate content that matches the layout structure
  const emptySchemaSlides = layout.slides.filter((slide) => {
    const schemaKeys = Object.keys(slide?.json_schema || {});
    return schemaKeys.length === 0;
  });

  if (emptySchemaSlides.length > 0) {
    return errorResponse(
      "layout schema is missing for one or more slides",
      400,
    );
  }

  // Build structure mapping: determines which layout template to use for each slide
  // This creates an array where each index corresponds to a slide, and the value
  // is the index of the layout template to use for that slide
  const slideCount = outlines.length;
  const totalLayouts = layout.slides.length;
  const structureSlides: number[] = [];

  for (let i = 0; i < slideCount; i += 1) {
    if (layout.ordered) {
      // Sequential mode: use layouts in order, clamp to last layout if more slides than layouts
      structureSlides.push(Math.min(i, totalLayouts - 1));
    } else {
      // Cyclic mode: cycle through layouts (0, 1, 2, 0, 1, 2, ...)
      structureSlides.push(totalLayouts ? i % totalLayouts : 0);
    }
  }

  // Save to database
  const updated = await updatePresentation(presentationId, {
    outlines: { slides: outlines },
    layout,
    structure: { slides: structureSlides },
  });

  if (!updated) {
    return errorResponse("Failed to update presentation", 500);
  }

  return jsonResponse(updated);
};

/**
 * Prepares and validates presentation data for streaming.
 *
 * This function ensures that a presentation is ready for slide generation
 * by checking that it has both outlines and layout data. It uses a retry
 * mechanism to handle cases where the client navigates to the streaming
 * endpoint before the prepare endpoint has finished saving data.
 *
 * The function waits up to PRESENTATION_READY_MAX_RETRIES times with
 * PRESENTATION_READY_RETRY_DELAY_MS delays between attempts, allowing
 * time for async database operations to complete.
 *
 * @param presentationId - The unique identifier of the presentation to prepare.
 * @returns An object containing:
 *   - `presentation`: The presentation record if ready
 *   - `layoutData`: The parsed layout payload if valid
 *   - `error`: A Response object with error status if preparation fails
 *
 * @example
 * ```typescript
 * const prepared = await preparePresentationData("abc-123");
 * if (prepared.error) {
 *   return prepared.error; // 404 or 503 error response
 * }
 * const { presentation, layoutData } = prepared;
 * ```
 */
const preparePresentationData = async (presentationId: string) => {
  const presentation = await waitForPresentationReady(presentationId);
  if (!presentation) {
    return { error: new Response("Not found", { status: 404 }) };
  }

  const layoutData = presentation.layout as LayoutPayload | null;
  if (
    !layoutData ||
    !Array.isArray(layoutData.slides) ||
    layoutData.slides.length === 0
  ) {
    return {
      error: new Response(
        JSON.stringify({ error: "Layout data not ready. Please try again." }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      ),
    };
  }

  return { presentation, layoutData };
};

/**
 * Resolves outlines for a presentation, using saved outlines or generating new ones.
 *
 * Outlines define the high-level content structure for each slide. This function
 * first checks if outlines have already been generated and saved in the database.
 * If not, it generates new outlines using the presentation's content and any
 * uploaded document content.
 *
 * The generation process uses LLM to create slide outlines that follow VC pitch
 * deck standards, extracting key information from the source content.
 *
 * @param presentation - The presentation record from the database, or null if not found.
 * @param documentContent - Extracted text content from uploaded files (PDF, DOCX, etc.).
 *   This is used as additional context for outline generation.
 * @returns An array of outline objects, each containing a `content` field with
 *   a text description of what the slide should contain.
 *
 * @example
 * ```typescript
 * const outlines = await resolveOutlines(presentation, documentText);
 * // Returns: [{ content: "INTRO: Company tagline" }, { content: "PROBLEM: ..." }, ...]
 * ```
 */
const resolveOutlines = async (
  presentation: Awaited<ReturnType<typeof getPresentationById>>,
  documentContent: string,
): Promise<Outline[]> => {
  if (!presentation) {
    return [];
  }

  const outlinesData = presentation.outlines as { slides?: Outline[] } | null;
  if (outlinesData?.slides && Array.isArray(outlinesData.slides)) {
    return outlinesData.slides;
  }

  // Generate outlines if not stored
  return await buildOutlines(
    presentation.content || "",
    documentContent,
    presentation.n_slides || 10,
  );
};

/**
 * Builds a structure mapping that determines which layout template to use for each slide.
 *
 * The structure mapping is an array where each index corresponds to a slide, and the
 * value is the index of the layout template to use. This allows different slides to
 * use different layout templates while maintaining a consistent design system.
 *
 * Priority order:
 * 1. Use saved structure data if it exists (from previous prepare call)
 * 2. Otherwise, generate based on layout.ordered flag:
 *    - If ordered: sequential assignment (slide 0 → layout 0, slide 1 → layout 1, etc.)
 *    - If not ordered: cyclic assignment (slide 0 → layout 0, slide 1 → layout 1, slide 2 → layout 0, etc.)
 *
 * @param outlines - Array of outline objects, one per slide.
 * @param layoutData - Layout configuration containing available templates and ordering mode.
 * @param structureData - Previously saved structure mapping, if any.
 * @returns An array of layout indices, one per slide. Each value is clamped to
 *   valid layout indices (0 to totalLayouts - 1).
 *
 * @example
 * ```typescript
 * // With 3 slides and 2 layouts, ordered=false:
 * const mapping = buildStructureMapping(outlines, layout, null);
 * // Returns: [0, 1, 0] (cyclic: layout 0, layout 1, layout 0)
 *
 * // With 3 slides and 2 layouts, ordered=true:
 * // Returns: [0, 1, 1] (sequential: layout 0, layout 1, layout 1)
 * ```
 */
const buildStructureMapping = (
  outlines: Outline[],
  layoutData: LayoutPayload,
  structureData: { slides?: number[] } | null,
): number[] => {
  const totalLayouts = layoutData.slides?.length || 0;
  if (totalLayouts === 0) {
    return outlines.map(() => 0);
  }

  if (structureData?.slides && Array.isArray(structureData.slides)) {
    return structureData.slides.map((idx) => Math.min(idx, totalLayouts - 1));
  }

  return outlines.map((_, idx) =>
    layoutData.ordered
      ? Math.min(idx, totalLayouts - 1)
      : idx % totalLayouts,
  );
};

/**
 * Creates initial placeholder slides based on outlines and layout structure.
 *
 * Before slide content is generated, placeholder slides are created with empty
 * content matching the JSON schema of their assigned layout template. These
 * placeholders are immediately sent to the client so the UI can show the slide
 * structure, then they are progressively filled with actual content as generation
 * completes.
 *
 * Each placeholder slide:
 * - Has a unique UUID
 * - Is assigned to the correct layout template based on structure mapping
 * - Contains placeholder content matching the layout's JSON schema
 * - Has empty speaker notes (filled during content generation)
 *
 * @param outlines - Array of outline objects defining what each slide should contain.
 * @param structure - Array mapping each slide index to a layout template index.
 * @param layoutData - Layout configuration containing template definitions and schemas.
 * @param presentationId - The unique identifier of the parent presentation.
 * @returns An array of SlideResponse objects, one per outline, with placeholder
 *   content matching their assigned layout schemas.
 *
 * @example
 * ```typescript
 * const slides = createInitialSlides(outlines, [0, 1, 0], layoutData, "abc-123");
 * // Returns: [
 * //   { id: "uuid1", layout: "layout-0", content: { title: " ", ... }, ... },
 * //   { id: "uuid2", layout: "layout-1", content: { title: " ", ... }, ... },
 * //   ...
 * // ]
 * ```
 */
const createInitialSlides = (
  outlines: Outline[],
  structure: number[],
  layoutData: LayoutPayload,
  presentationId: string,
): SlideResponse[] => {
  const slidesSchema = layoutData.slides || [];

  return outlines.map((_, i) => {
    const schemaIndex = structure[i];
    const schema = slidesSchema[schemaIndex]?.json_schema || {};
    const schemaForSlide = slidesSchema[schemaIndex] || slidesSchema[0];
    const layoutId = schemaForSlide?.id || null;
    const placeholderContent = buildPlaceholderFromSchema(
      schema as SlideSchema,
    ) as Record<string, unknown>;

    return {
      id: uuidv4(),
      presentation: presentationId,
      layout_group: layoutData.name || null,
      layout: layoutId,
      index: i,
      speaker_note: "",
      content: placeholderContent,
    };
  });
};

/**
 * Generates content for a single slide and streams updates in real-time.
 *
 * This function handles the complete slide generation process for one slide:
 * 1. Generates slide content using LLM based on outline and schema
 * 2. Streams incremental updates (deltas) as content is generated
 * 3. Processes images referenced in the content (generates or fetches them)
 * 4. Extracts speaker notes from the generated content
 * 5. Sends the complete slide when generation finishes
 *
 * The streaming uses Server-Sent Events (SSE) to send updates to the client
 * as soon as content fields are generated, providing a responsive user experience.
 *
 * Error handling:
 * - If generation fails, falls back to schema-based placeholder content
 * - Always sends a slide object, even if generation failed
 *
 * @param slideIndex - Zero-based index of the slide being generated.
 * @param outline - Outline object containing the text description for this slide.
 * @param schemaIndex - Index into the layout slides array indicating which template to use.
 * @param schema - JSON schema object defining the structure of slide content.
 * @param fullSourceContent - Combined user prompt and document content for context.
 * @param slidesSchema - Array of all layout slide definitions from the layout template.
 * @param layoutData - Complete layout configuration object.
 * @param slides - Array of all slides (mutated in place as content is generated).
 * @param controller - SSE stream controller for sending events to the client.
 * @param encoder - TextEncoder for converting strings to Uint8Array for SSE.
 * @returns Promise that resolves when slide generation and streaming is complete.
 *
 * @example
 * ```typescript
 * await generateSlideWithStreaming({
 *   slideIndex: 0,
 *   outline: { content: "Introduction slide" },
 *   schemaIndex: 0,
 *   schema: { properties: { title: {...}, subtitle: {...} } },
 *   fullSourceContent: "User prompt and document text...",
 *   slidesSchema: [...],
 *   layoutData: {...},
 *   slides: [...],
 *   controller: sseController,
 *   encoder: new TextEncoder()
 * });
 * ```
 */
const generateSlideWithStreaming = async ({
  slideIndex,
  outline,
  schemaIndex,
  schema,
  fullSourceContent,
  slidesSchema,
  layoutData,
  slides,
  controller,
  encoder,
}: {
  slideIndex: number;
  outline: Outline;
  schemaIndex: number;
  schema: Record<string, unknown>;
  fullSourceContent: string;
  slidesSchema: Array<{ id?: string; json_schema?: Record<string, unknown> }>;
  layoutData: LayoutPayload;
  slides: SlideResponse[];
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
}): Promise<void> => {
  try {
    // Generate slide content using LLM with streaming support
    // The onDelta callback sends incremental updates as fields are generated
    const rawContent = await buildSlideContentStream({
      outline: outline.content,
      schema,
      slideIndex,
      sourceDocument: fullSourceContent,
      onDelta: ({ index, path, value }) => {
        // Skip internal fields from streaming - these are processed separately
        // and don't need to be sent to the client during generation
        if (
          path.includes("__image_url__") ||
          path.includes("__image_prompt__") ||
          path.includes("__speaker_note__")
        ) {
          return;
        }
        // Send delta update to client via SSE
        controller.enqueue(
          encoder.encode(
            sseChunk({ type: "slide_delta", index, path, value }),
          ),
        );
      },
    });

    // Process images: replace image prompts with actual image URLs
    // This may involve generating images using AI or fetching uploaded images
    const content = await processImagesInContent(rawContent);
    
    // Extract speaker notes from the generated content
    // Speaker notes are stored in a special __speaker_note__ field
    const speaker =
      typeof content.__speaker_note__ === "string"
        ? content.__speaker_note__
        : "";
    
    // Determine the layout ID for this slide based on the schema index
    const schemaForSlide = slidesSchema[schemaIndex] || slidesSchema[0];
    const layoutId = schemaForSlide?.id || null;

    // Update the slide with generated content
    const slide: SlideResponse = {
      ...slides[slideIndex],
      layout: layoutId,
      speaker_note: speaker,
      content,
    };
    slides[slideIndex] = slide;

    // Send the complete slide to the client
    controller.enqueue(
      encoder.encode(sseChunk({ type: "slide", index: slideIndex, slide })),
    );
  } catch (error) {
    // If generation fails, create fallback content from schema
    // This ensures the client always receives a valid slide object
    console.error(`Slide ${slideIndex} streaming failed:`, error);
    const fallbackContent = buildDataFromSchema(schema || {}, outline.content);
    const slide: SlideResponse = {
      ...slides[slideIndex],
      content: fallbackContent,
      speaker_note: "",
    };
    slides[slideIndex] = slide;
    // Send fallback slide to client
    controller.enqueue(
      encoder.encode(sseChunk({ type: "slide", index: slideIndex, slide })),
    );
  }
};

/**
 * Saves the generated slides and updated outlines to the database.
 *
 * After all slides have been generated and streamed to the client, this function
 * persists the results to the database. It replaces all existing slides for the
 * presentation with the newly generated ones and updates the presentation's outlines
 * and title.
 *
 * This is called at the end of the streaming process to ensure data persistence.
 * The slides are already sent to the client via SSE, so this is a background
 * save operation.
 *
 * @param presentationId - The unique identifier of the presentation to update.
 * @param slides - Array of completed SlideResponse objects with generated content.
 * @param outlines - Array of outline objects that were used to generate the slides.
 * @param title - The presentation title, typically extracted from the first outline
 *   or set by the user.
 * @returns The updated presentation record from the database.
 *
 * @example
 * ```typescript
 * const updated = await savePresentationResults(
 *   "abc-123",
 *   generatedSlides,
 *   outlines,
 *   "My Presentation"
 * );
 * ```
 */
const savePresentationResults = async (
  presentationId: string,
  slides: SlideResponse[],
  outlines: Outline[],
  title: string | null,
) => {
  await replaceSlidesForPresentation(
    presentationId,
    slides.map((slide) => ({
      id: slide.id,
      presentation: presentationId,
      layout_group: slide.layout_group,
      layout: slide.layout,
      slide_index: slide.index,
      speaker_note: slide.speaker_note,
      content: slide.content,
      html_content: null,
    })),
  );

  return await updatePresentation(presentationId, {
    outlines: { slides: outlines },
    title,
  });
};

/**
 * Handles GET requests to stream slide content generation in real-time.
 *
 * This is the main endpoint for generating presentation slides. It creates a
 * Server-Sent Events (SSE) stream that sends slide content to the client
 * as it is generated by the LLM. The process works as follows:
 *
 * 1. **Preparation**: Validates that the presentation has outlines and layout data
 * 2. **Initialization**: Creates placeholder slides and sends them immediately
 * 3. **Generation**: Generates content for each slide concurrently (with limits)
 * 4. **Streaming**: Sends incremental updates (deltas) as content is generated
 * 5. **Completion**: Saves all slides to the database and sends final event
 *
 * Concurrency control:
 * - Uses bounded concurrency (MAX_STREAM_SLIDE_CONCURRENCY) to limit parallel requests
 * - Implements staggered start delays to prevent API rate limiting
 * - Each slide starts with a delay based on its index (PRIORITY_START_DELAY_MS)
 *
 * SSE Event types sent to client:
 * - `heartbeat`: Keep-alive message to maintain connection
 * - `meta`: Presentation metadata (id, title, language, etc.)
 * - `slides_init`: Initial placeholder slides with empty content
 * - `slide_delta`: Incremental content updates as fields are generated
 * - `slide`: Complete slide object when generation finishes
 * - `progress`: Progress updates showing completed/total slides
 * - `slides_complete`: Notification that all slides are generated
 * - `complete`: Final event with complete presentation data
 *
 * @param presentationId - The unique identifier of the presentation to generate slides for.
 * @returns An HTTP Response with:
 *   - Content-Type: `text/event-stream` (SSE format)
 *   - Appropriate headers for streaming (no buffering, keep-alive)
 *   - A ReadableStream that sends SSE events as slides are generated
 *
 * @throws Returns error responses for:
 *   - 404: Presentation not found
 *   - 503: Layout data not ready (presentation not prepared yet)
 *
 * @example
 * ```typescript
 * // Client connects to: GET /api/v1/presentations/stream/abc-123
 * const response = await handlePresentationStream("abc-123");
 * // Client receives SSE stream with slide updates in real-time
 * ```
 */
export const handlePresentationStream = async (
  presentationId: string,
): Promise<Response> => {
  // Prepare presentation data and validate it's ready for generation
  const prepared = await preparePresentationData(presentationId);
  if (prepared.error) {
    return prepared.error;
  }

  const { presentation, layoutData } = prepared;

  // Resolve document content from uploaded files (if any)
  const documentContent = await resolveDocumentContent(presentation);
  
  // Combine user prompt and document content for LLM context
  const fullSourceContent = buildFullSourceContent(
    presentation.content || "",
    documentContent,
  );

  // Get outlines (either from database or generate new ones)
  const outlines = await resolveOutlines(presentation, documentContent);

  // Build structure mapping: determines which layout template each slide uses
  const structureData = presentation.structure as { slides?: number[] } | null;
  const structure = buildStructureMapping(
    outlines,
    layoutData,
    structureData,
  );

  // Create initial placeholder slides with empty content matching schemas
  // These are sent immediately so the UI can show slide structure
  const slides = createInitialSlides(
    outlines,
    structure,
    layoutData,
    presentationId,
  );

  const slidesSchema = layoutData.slides || [];

  // Create SSE stream for real-time updates
  const stream = createSseStream(async (controller) => {
    const encoder = new TextEncoder();

    // Send heartbeat to establish SSE connection and keep it alive
    // SSE connections can timeout, so heartbeats prevent disconnection
    controller.enqueue(encoder.encode(": heartbeat\n\n"));

    // Send presentation metadata so client knows what's being generated
    const presentationMeta = {
      id: presentation.id,
      title: presentation.title,
      language: presentation.language || "",
      n_slides: presentation.n_slides || outlines.length,
      layout: presentation.layout || { name: "", ordered: false, slides: [] },
      slides: [], // Slides array sent separately in slides_init event
    };
    controller.enqueue(
      encoder.encode(sseChunk({ type: "meta", presentation: presentationMeta })),
    );

    // Send initial placeholder slides immediately
    // This allows the UI to show slide structure before content is generated
    controller.enqueue(
      encoder.encode(sseChunk({ type: "slides_init", slides })),
    );

    // Generate slides with bounded concurrency + staggered start
    // Staggered start prevents API rate limiting by spacing out requests
    const slideIndices = outlines.map((_, i) => i);
    const totalSlides = slideIndices.length;
    let completedCount = 0;

    /**
     * Generates a single slide with staggered delay.
     * 
     * Each slide waits a calculated delay before starting generation:
     * - First slide starts immediately (delay = 0)
     * - Subsequent slides have increasing delays
     * - Maximum delay is capped at MAX_PRIORITY_START_DELAY_MS
     * 
     * This prevents overwhelming the LLM API with simultaneous requests.
     */
    const startSlide = async (i: number) => {
      // Calculate delay: slide 0 = 0ms, slide 1 = 40ms, slide 2 = 80ms, etc.
      // Capped at MAX_PRIORITY_START_DELAY_MS (400ms) to prevent excessive delays
      const delayMs = Math.min(
        i * PRIORITY_START_DELAY_MS,
        MAX_PRIORITY_START_DELAY_MS,
      );
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      // Get the schema for this slide based on structure mapping
      const schemaIndex = structure[i];
      const schema = slidesSchema[schemaIndex]?.json_schema || {};

      // Generate and stream the slide content
      await generateSlideWithStreaming({
        slideIndex: i,
        outline: outlines[i],
        schemaIndex,
        schema,
        fullSourceContent,
        slidesSchema,
        layoutData,
        slides,
        controller,
        encoder,
      });
      
      // Update progress counter and notify client
      completedCount += 1;
      controller.enqueue(
        encoder.encode(
          sseChunk({
            type: "progress",
            completed: completedCount,
            total: totalSlides,
            index: i,
          }),
        ),
      );
    };

    // Calculate concurrency: use configured max, but don't exceed total slides
    // Ensures at least 1 worker even if MAX_STREAM_SLIDE_CONCURRENCY is 0
    const concurrency = Math.min(
      Math.max(1, MAX_STREAM_SLIDE_CONCURRENCY),
      totalSlides,
    );
    
    // Create a queue of slide indices to process
    const queue = [...slideIndices];
    
    // Create worker pool: each worker processes slides from the queue
    // Workers run concurrently, but each slide still has its staggered delay
    const workers = Array.from({ length: concurrency }, async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (next === undefined) return;
        await startSlide(next);
      }
    });
    
    // Wait for all workers to finish processing all slides
    await Promise.all(workers);

    // Notify client that all slides have been generated
    controller.enqueue(
      encoder.encode(
        sseChunk({
          type: "slides_complete",
          total: totalSlides,
        }),
      ),
    );

    // Save all generated slides and updated outlines to database
    // This persists the results so they can be retrieved later
    const updated = await savePresentationResults(
      presentationId,
      slides,
      outlines,
      // Use existing title, or extract from first outline, or null
      presentation.title || outlines[0]?.content || null,
    );

    // Send final completion event with complete presentation data
    // Client can use this to update UI and mark generation as complete
    controller.enqueue(
      encoder.encode(
        sseChunk({
          type: "complete",
          presentation: {
            ...updated,
            slides,
          },
        }),
      ),
    );
  });

  // Return SSE response with appropriate headers for streaming
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream", // SSE MIME type
      "Cache-Control": "no-cache, no-transform", // Prevent caching of stream
      Connection: "keep-alive", // Keep connection open for streaming
      "X-Accel-Buffering": "no", // Disable nginx buffering for real-time updates
      "Content-Encoding": "none", // No compression (SSE requires plain text)
    },
  });
};

/**
 * Streams and saves placeholder outlines when no content is available.
 *
 * If a presentation is created without any content (no prompt and no document),
 * this function creates simple placeholder outlines like "Slide 1", "Slide 2", etc.
 * These can be edited later by the user.
 *
 * The function streams the outlines in JSON format via SSE and then saves them
 * to the database.
 *
 * @param presentationId - The unique identifier of the presentation.
 * @param presentation - The presentation record from the database.
 * @param nSlides - The number of slides to create placeholders for.
 * @param controller - SSE stream controller for sending events to the client.
 * @param encoder - TextEncoder for converting strings to Uint8Array for SSE.
 * @returns Promise that resolves when placeholders are streamed and saved.
 */
const streamPlaceholderOutlines = async (
  presentationId: string,
  presentation: Awaited<ReturnType<typeof getPresentationById>>,
  nSlides: number,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
) => {
  const placeholderOutlines = Array.from({ length: nSlides }, (_, idx) => ({
    content: `Slide ${idx + 1}`,
  }));

  controller.enqueue(
    encoder.encode(sseChunk({ type: "chunk", chunk: '{ "slides": [ ' })),
  );
  placeholderOutlines.forEach((outline, idx) => {
    controller.enqueue(
      encoder.encode(
        sseChunk({
          type: "chunk",
          chunk:
            JSON.stringify(outline) +
            (idx === placeholderOutlines.length - 1 ? "" : ", "),
        }),
      ),
    );
  });
  controller.enqueue(
    encoder.encode(sseChunk({ type: "chunk", chunk: " ] }" })),
  );

  const updated = await updatePresentation(presentationId, {
    outlines: { slides: placeholderOutlines },
    title: presentation?.title ?? placeholderOutlines[0]?.content ?? null,
  });

  controller.enqueue(
    encoder.encode(sseChunk({ type: "complete", presentation: updated })),
  );
};

/**
 * Builds the user prompt for LLM-based outline generation.
 *
 * Constructs a comprehensive prompt that combines document content (if available)
 * with user instructions, and includes specific requirements for VC pitch deck
 * formatting. The prompt follows a structured format that guides the LLM to
 * generate outlines in the desired style.
 *
 * Prompt structure:
 * 1. Source document content (if available)
 * 2. Additional user instructions (if provided)
 * 3. Requirements section with:
 *    - Number of slides
 *    - Language and audience specifications
 *    - Critical formatting rules (hero elements, character limits, etc.)
 * 4. Output format specification (JSON structure)
 *
 * @param documentContent - Extracted text from uploaded files (PDF, DOCX, etc.).
 *   Used as the primary source of information for outline generation.
 * @param promptContent - User-provided text prompt with additional instructions.
 *   Combined with document content to guide outline generation.
 * @param nSlides - Target number of slides to generate outlines for.
 * @returns A formatted string prompt ready to send to the LLM.
 *
 * @example
 * ```typescript
 * const prompt = buildOutlineUserPrompt(
 *   "Company revenue: $10M ARR...",
 *   "Focus on growth metrics",
 *   12
 * );
 * // Returns formatted prompt string for LLM
 * ```
 */
const buildOutlineUserPrompt = (
  documentContent: string,
  promptContent: string,
  nSlides: number,
): string => {
  let userPrompt = "";

  if (documentContent) {
    userPrompt += `## SOURCE DOCUMENT CONTENT:\n${documentContent}\n\n`;
  }
  if (promptContent) {
    userPrompt += `## ADDITIONAL INSTRUCTIONS FROM USER:\n${promptContent}\n\n`;
  }

  userPrompt += `## REQUIREMENTS (Modern Toss/OpenAI Style):
- Number of slides: ${nSlides}
- Language: English (US)
- Audience: US Venture Capital investors (Sequoia, a16z, YC)

## CRITICAL INSTRUCTIONS:
1. Each outline MUST identify the HERO ELEMENT (ONE big number/stat)
2. Headlines: 3-5 words MAX, create intrigue
3. Extract EXACT metrics from source: "$48B", "$1.2M ARR", "+127%"
4. NEVER use ranges like "$X-$Y" - pick ONE specific number
5. Format: "[SLIDE TYPE] - Hero: [METRIC] | Supporting: [2-3 points]"
6. If source lacks data, use placeholder: "[HERO: $XM needed]"
7. NO paragraphs, NO markdown formatting
8. English only. Translate non-English terms; romanize names into Latin characters (no Hangul).

## OUTPUT FORMAT:
Return JSON: { "slides": [{ "content": "..." }, ...] }
Do NOT wrap in code fences.

Generate a modern, data-forward pitch deck outline.`;

  return userPrompt;
};

/**
 * Generates presentation outlines using LLM and streams them in real-time.
 *
 * This function orchestrates the outline generation process:
 * 1. Sends prompts to the LLM with VC pitch deck requirements
 * 2. Streams JSON tokens as they arrive from the LLM
 * 3. Parses partial JSON progressively to detect completed outlines
 * 4. Sends delta updates for each outline as it becomes parseable
 * 5. Sends raw tokens for backward compatibility
 * 6. Returns the final parsed outlines array
 *
 * The streaming uses a delta parser that tracks JSON structure and extracts
 * outline content as it becomes available, allowing the UI to show progress
 * in real-time.
 *
 * Error handling:
 * - If streaming fails, the error is logged and re-thrown
 * - The caller should have a fallback mechanism (e.g., buildOutlines)
 *
 * @param userPrompt - The formatted prompt string containing document content
 *   and instructions for the LLM.
 * @param controller - SSE stream controller for sending events to the client.
 * @param encoder - TextEncoder for converting strings to Uint8Array for SSE.
 * @returns Promise that resolves to an array of Outline objects when generation
 *   completes successfully.
 *
 * @throws Re-throws any errors from the LLM streaming process.
 *
 * @example
 * ```typescript
 * const outlines = await generateOutlinesStream({
 *   userPrompt: "## SOURCE DOCUMENT...",
 *   controller: sseController,
 *   encoder: new TextEncoder()
 * });
 * // Returns: [{ content: "INTRO: ..." }, { content: "PROBLEM: ..." }, ...]
 * ```
 */
const generateOutlinesStream = async ({
  userPrompt,
  controller,
  encoder,
}: {
  userPrompt: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
}): Promise<Outline[]> => {
  const OUTLINES_SYSTEM_PROMPT = `You are a YC Group Partner reviewing pitch decks. Generate outlines that would pass YC and 500 Startups screening.

## DESIGN PHILOSOPHY
1. ONE NUMBER PER SLIDE - Each slide has ONE hero metric
2. 3-SECOND RULE - Instant comprehension
3. DATA AS DESIGN - Numbers ARE the visual
4. NO FLUFF - Every word must earn its place

## YC STANDARD SLIDE ORDER (MUST follow exactly):

1. INTRO - "[What] for [Who]" tagline
   VC looks for: Instant clarity on what you do
   GOOD: "Stripe for Healthcare" | BAD: "Innovative Platform"
   Outline example: "INTRO: K-Beauty Commerce for US Retailers - connecting Korean brands to American stores"

2. PROBLEM - ONE pain + ONE shocking stat
   VC looks for: Is this pain real? How big?
   Include: Source for stat (KOTRA, Gartner, etc.)
   Outline example: "PROBLEM: Hero $2.3B - US retailers lose $2.3B/yr failing to source K-beauty (KOTRA 2024)"

3. SOLUTION - "We [verb] X" + 3 outcomes
   VC looks for: Does it directly solve the problem?
   Outline example: "SOLUTION: We connect brands to buyers - 3x faster sourcing, verified quality, zero inventory risk"

4. MARKET - TAM as hero + SAM/SOM
   VC looks for: Is it big enough? Bottom-up math?
   Outline example: "MARKET: Hero $48B TAM - Global K-beauty $48B, US import $8B SAM, Initial $800M SOM"

5. TRACTION - MRR or ARR (realistic for stage)
   VC looks for: Hockey stick? Retention? Unit economics improving?
   SEED REALITY: $10K-100K MRR typical, NOT millions
   RED FLAG: $100M+ revenue at Seed = instant reject
   Outline example: "TRACTION: Hero $85K MRR - 127% MoM growth, 3 enterprise pilots, 94% retention"

6. BUSINESS MODEL - Revenue model + unit economics
   VC looks for: How do you make money? Path to profitability?
   Outline example: "BUSINESS MODEL: SaaS + transaction fee - $99/mo base + 2.9% GMV, LTV:CAC 4.2x"

7. COMPETITION - Your unique position
   VC looks for: Why will YOU win? (NOT competitor bashing)
   Outline example: "COMPETITION: Only player with verified sales data - vs. Influencer DBs (no proof), Agencies (high cost)"

8. TEAM - 3 people, founder-market fit
   VC looks for: Why is THIS team the one to win?
   Format: "Ex-[Company], [specific achievement]"
   Outline example: "TEAM: CEO Ex-Amazon (scaled K-beauty $50M), CTO Ex-Stripe (payments infra), COO Ex-Coupang"

9. ROADMAP - 3 phases, H1/H2 format
   VC looks for: Realistic milestones? Clear priorities?
   Outline example: "ROADMAP: H1 2026 beta + 10 brands, H2 2026 $500K ARR, 2027 Series A"

10. ASK - Funding + 3 use-of-funds
    VC looks for: Clear ask, specific allocation
    Outline example: "ASK: $2M Seed - 40% product, 35% GTM, 25% ops - target $1M ARR in 18mo"

## RED FLAGS TO AVOID:
- Generic taglines ("AI-powered solution")
- Unrealistic traction ($100M revenue at Seed)
- Number ranges ("$500M-$800M")
- Missing sources for market data
- "We have no competitors"
- Full sentences instead of phrases

## Output Format:
Return ONLY valid JSON:
{
  "slides": [
    { "content": "INTRO: [tagline] - [one line context]" },
    { "content": "PROBLEM: Hero [stat] - [pain point with source]" },
    ...
  ]
}

CRITICAL:
- No code fences, no markdown
- English only. Translate non-English terms; romanize names into Latin characters (no Hangul).
- Numbers: $48B, $1.8M, 127% (NO ranges)
- Each outline: 1 sentence with hero element identified`;

  // Accumulate JSON tokens as they arrive from the LLM
  let accumulatedJson = "";
  // Track how many slides we've detected so far for progressive parsing
  let lastParsedSlideCount = 0;
  
  // Get the model configured for outline generation (may differ from default)
  const outlineModel = getOutlineModel();
  
  // Create delta parser to extract outline content from JSON stream
  // The parser tracks JSON structure and calls onDelta when outline content is detected
  const deltaParser = createOutlineDeltaParser({
    minIntervalMs: MIN_DELTA_INTERVAL_MS, // Throttle delta updates to prevent spam
    onDelta: (index, content) => {
      // Send delta update when outline content is detected
      controller.enqueue(
        encoder.encode(sseChunk({ type: "delta", index, content })),
      );
    },
  });

  try {
    // Stream JSON tokens from LLM
    for await (const token of generateJsonStream(
      OUTLINES_SYSTEM_PROMPT,
      userPrompt,
      outlineModel,
    )) {
      // Accumulate tokens to build complete JSON
      accumulatedJson += token;
      // Feed token to delta parser for real-time extraction
      deltaParser.push(token);

      // Progressive parsing: try to parse partial JSON to detect new slides
      // This allows us to send slide events as soon as they're complete,
      // rather than waiting for the entire response
      try {
        // Repair any malformed JSON (trailing commas, etc.)
        const repaired = jsonrepair(accumulatedJson);
        const partial = JSON.parse(repaired) as {
          slides?: { content: string }[];
        };
        const currentSlideCount = partial.slides?.length || 0;

        // If we detected new slides, send events for them
        if (currentSlideCount > lastParsedSlideCount) {
          for (let i = lastParsedSlideCount; i < currentSlideCount; i++) {
            controller.enqueue(
              encoder.encode(
                sseChunk({
                  type: "slide",
                  index: i,
                  slide: partial.slides![i],
                }),
              ),
            );
          }
          lastParsedSlideCount = currentSlideCount;
        }
      } catch {
        // JSON isn't complete yet, continue accumulating tokens
        // This is expected during streaming - JSON may be incomplete
      }

      // Also send raw token for backward compatibility
      // Some clients may want to handle parsing themselves
      controller.enqueue(
        encoder.encode(sseChunk({ type: "chunk", chunk: token })),
      );
    }

    // Parse final JSON to extract outlines
    const repairedJson = sanitizeAndRepairJson(accumulatedJson);
    const parsed = JSON.parse(repairedJson) as {
      slides?: { content: string }[];
    };
    return parsed.slides || [];
  } catch (error) {
    console.error("Outline streaming failed:", error);
    throw error;
  }
};

/**
 * Streams and saves fallback outlines when LLM generation fails.
 *
 * If outline generation via LLM fails (API error, timeout, etc.), this function
 * uses a simpler fallback method (buildOutlines) to generate basic outlines.
 * These outlines are then streamed to the client and saved to the database.
 *
 * The fallback ensures the user always gets some result, even if the primary
 * generation method fails.
 *
 * @param presentationId - The unique identifier of the presentation.
 * @param presentation - The presentation record from the database.
 * @param fallbackOutlines - Array of outline objects generated by the fallback method.
 * @param controller - SSE stream controller for sending events to the client.
 * @param encoder - TextEncoder for converting strings to Uint8Array for SSE.
 * @returns Promise that resolves when fallback outlines are streamed and saved.
 */
const streamFallbackOutlines = async (
  presentationId: string,
  presentation: Awaited<ReturnType<typeof getPresentationById>>,
  fallbackOutlines: Outline[],
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
) => {
  controller.enqueue(
    encoder.encode(sseChunk({ type: "chunk", chunk: '{ "slides": [ ' })),
  );
  fallbackOutlines.forEach((outline, idx) => {
    controller.enqueue(
      encoder.encode(
        sseChunk({
          type: "chunk",
          chunk:
            JSON.stringify(outline) +
            (idx === fallbackOutlines.length - 1 ? "" : ", "),
        }),
      ),
    );
  });
  controller.enqueue(
    encoder.encode(sseChunk({ type: "chunk", chunk: " ] }" })),
  );

  const updated = await updatePresentation(presentationId, {
    outlines: { slides: fallbackOutlines },
    title: presentation?.title ?? fallbackOutlines[0]?.content ?? null,
  });

  controller.enqueue(
    encoder.encode(sseChunk({ type: "complete", presentation: updated })),
  );
};

/**
 * Handles GET requests to stream outline generation in real-time.
 *
 * This endpoint generates presentation outlines (high-level slide descriptions)
 * using an LLM and streams the results via Server-Sent Events (SSE). Outlines
 * define what content each slide should contain and follow VC pitch deck
 * standards.
 *
 * Process flow:
 * 1. Validates presentation exists
 * 2. Loads document content from uploaded files (if any)
 * 3. Checks if content is available (prompt or document)
 * 4. If no content: streams placeholder outlines
 * 5. If content exists: generates outlines via LLM with streaming
 * 6. Saves outlines to database
 * 7. Falls back to simpler generation if LLM fails
 *
 * SSE Event types sent to client:
 * - `heartbeat`: Keep-alive message
 * - `status`: Status updates ("Preparing outline...", "Generating outline...")
 * - `chunk`: Raw JSON tokens as they arrive from LLM
 * - `delta`: Incremental outline content updates
 * - `slide`: Complete outline object when detected
 * - `error`: Error message if something fails
 * - `complete`: Final event with saved presentation data
 *
 * @param presentationId - The unique identifier of the presentation to generate
 *   outlines for.
 * @returns An HTTP Response with:
 *   - Content-Type: `text/event-stream` (SSE format)
 *   - Appropriate headers for streaming
 *   - A ReadableStream that sends SSE events as outlines are generated
 *
 * @throws Returns error responses for:
 *   - 404: Presentation not found
 *
 * @example
 * ```typescript
 * // Client connects to: GET /api/v1/outlines/stream/abc-123
 * const response = await handleOutlinesStream("abc-123");
 * // Client receives SSE stream with outline updates in real-time
 * ```
 */
export const handleOutlinesStream = async (
  presentationId: string,
): Promise<Response> => {
  // Check presentation first for fast 404 handling
  // This avoids creating SSE stream if presentation doesn't exist
  const presentation = await getPresentationById(presentationId);
  if (!presentation) {
    return new Response("Not found", { status: 404 });
  }

  // Create SSE stream for real-time outline generation
  const stream = createSseStream(async (controller) => {
    const encoder = new TextEncoder();

    // Send heartbeat to establish SSE connection
    controller.enqueue(encoder.encode(": heartbeat\n\n"));

    // Helper function to send status updates to client
    const sendStatus = (message: string) => {
      controller.enqueue(encoder.encode(sseChunk({ type: "status", message })));
    };
    sendStatus("Preparing outline...");

    // Load document content from uploaded files
    let documentContent = "";
    try {
      sendStatus("Loading document content...");
      documentContent = await resolveDocumentContent(presentation);
    } catch (error) {
      // If document loading fails, send error and abort
      const message =
        error instanceof Error ? error.message : "Failed to load documents";
      controller.enqueue(
        encoder.encode(sseChunk({ type: "error", detail: message })),
      );
      return;
    }

    const promptContent = presentation.content || "";
    const nSlides = presentation.n_slides || 10;

    // If no content at all (no prompt and no document), return placeholder slides
    // This handles edge case where presentation is created but user hasn't provided content
    if (!promptContent && !documentContent) {
      await streamPlaceholderOutlines(
        presentationId,
        presentation,
        nSlides,
        controller,
        encoder,
      );
      return;
    }

    // Build comprehensive prompt for LLM with document content and user instructions
    const userPrompt = buildOutlineUserPrompt(
      documentContent,
      promptContent,
      nSlides,
    );

    sendStatus("Generating outline...");

    try {
      // Generate outlines with streaming - sends updates as they're generated
      const outlines = await generateOutlinesStream({
        userPrompt,
        controller,
        encoder,
      });

      // Save generated outlines to database
      // Also update title if not set (use first outline's content)
      const updated = await updatePresentation(presentationId, {
        outlines: { slides: outlines },
        title: presentation.title || outlines[0]?.content || null,
      });

      // Send completion event with saved presentation data
      controller.enqueue(
        encoder.encode(
          sseChunk({
            type: "complete",
            presentation: updated,
          }),
        ),
      );
    } catch (error) {
      // If LLM generation fails, use fallback method
      // This ensures user always gets some result
      console.error("Outline streaming failed:", error);
      // Fallback: use buildOutlines as backup (simpler, non-streaming method)
      const fallbackOutlines = await buildOutlines(
        promptContent,
        documentContent,
        nSlides,
      );

      // Stream and save fallback outlines
      await streamFallbackOutlines(
        presentationId,
        presentation,
        fallbackOutlines,
        controller,
        encoder,
      );
    }
  });

  // Return SSE response with appropriate headers for streaming
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream", // SSE MIME type
      "Cache-Control": "no-cache, no-transform", // Prevent caching
      Connection: "keep-alive", // Keep connection open
      "X-Accel-Buffering": "no", // Disable nginx buffering
      "Content-Encoding": "none", // No compression
    },
  });
};
