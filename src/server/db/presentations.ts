/**
 * Database operations for presentations.
 *
 * This module provides functions for creating, reading, updating, and deleting
 * presentation records in the database. It handles the conversion between
 * database row formats (with JSON strings and Date objects) and application
 * record formats (with parsed JSON and ISO date strings).
 *
 * All functions use Prisma for type-safe database access and handle JSON
 * serialization/deserialization for complex fields like outlines, layouts,
 * and file metadata.
 */

import { prisma } from "../db";
import { mapSlideRow, SlideRecord } from "./slides";

/**
 * File metadata structure for uploaded documents.
 *
 * Stores information about files that were uploaded and processed for a
 * presentation. This metadata is displayed to users and used for file
 * management.
 *
 * @property name - Original filename of the uploaded file.
 * @property size - File size in bytes.
 * @property type - MIME type of the file (e.g., "application/pdf",
 *   "application/vnd.openxmlformats-officedocument.wordprocessingml.document").
 */
export type FileMetadata = {
  name: string;
  size: number;
  type: string;
};

/**
 * Complete presentation record structure.
 *
 * Represents a presentation stored in the database. Contains all metadata,
 * configuration, and content references for a presentation. JSON fields
 * (outlines, layout, structure, file_metadata) are stored as strings in
 * the database but parsed to objects in this type.
 *
 * @property id - Unique identifier for the presentation.
 * @property content - JSON string containing the presentation's slide content
 *   and structure. Stored as string in DB, typically parsed when used.
 * @property n_slides - Number of slides in the presentation.
 * @property language - Language code for the presentation content (e.g., "en", "ko").
 * @property document_content - Extracted text content from uploaded files.
 *   Used as source material for LLM content generation. Null if no documents uploaded.
 * @property file_metadata - Array of file metadata objects for uploaded documents.
 *   Stored as JSON string in DB, parsed to FileMetadata[] here. Null if no files.
 * @property tone - Optional tone setting for content generation (e.g., "professional", "casual").
 * @property verbosity - Optional verbosity level for content generation.
 * @property instructions - Optional custom instructions for content generation.
 * @property include_table_of_contents - Whether to include a table of contents slide.
 * @property include_title_slide - Whether to include a title slide.
 * @property web_search - Whether web search was enabled during generation.
 * @property outlines - JSON object containing slide outlines. Stored as JSON string in DB.
 * @property layout - JSON object containing layout configuration. Stored as JSON string in DB.
 * @property structure - JSON object containing presentation structure. Stored as JSON string in DB.
 * @property title - Optional presentation title.
 * @property created_at - ISO 8601 timestamp string of when the presentation was created.
 * @property updated_at - ISO 8601 timestamp string of when the presentation was last updated.
 */
export type PresentationRecord = {
  id: string;
  content: string;
  n_slides: number;
  language: string;
  document_content: string | null; // Extracted text content from uploaded files
  file_metadata: FileMetadata[] | null; // File metadata for display
  tone: string | null;
  verbosity: string | null;
  instructions: string | null;
  include_table_of_contents: boolean;
  include_title_slide: boolean;
  web_search: boolean;
  outlines: Record<string, unknown> | null;
  layout: Record<string, unknown> | null;
  structure: Record<string, unknown> | null;
  title: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Extended presentation record with slide information.
 *
 * Extends PresentationRecord to include slide data and slide count. Used when
 * listing presentations where slide information is needed for display or
 * filtering purposes.
 *
 * @property slides - Array of slide records belonging to this presentation.
 *   Typically limited to a small number (e.g., first slide) for preview purposes.
 * @property slideCount - Total number of slides in the presentation. Used for
 *   filtering and display purposes.
 */
export type PresentationSummaryRecord = PresentationRecord & {
  slides: SlideRecord[];
  slideCount: number;
};

/**
 * Options for listing presentations with pagination and filtering.
 *
 * @property limit - Maximum number of presentations to return. Must be at least 1.
 * @property cursor - Optional cursor for pagination. The ID of the last presentation
 *   from the previous page. Used to fetch the next page of results.
 * @property slidesFilter - Optional filter for presentation state:
 *   - "all": Return all presentations (default)
 *   - "drafts": Return only presentations with no slides (draft state)
 *   - "completed": Return only presentations with at least one slide
 */
export type PresentationListOptions = {
  limit: number;
  cursor?: string | null;
  slidesFilter?: "all" | "drafts" | "completed";
};

/**
 * Helper function to safely parse JSON strings.
 *
 * Attempts to parse a value as JSON if it's a string, otherwise returns the
 * value as-is or the fallback. Used throughout this module to convert JSON
 * strings from the database into JavaScript objects.
 *
 * @param value - Value to parse. Can be a JSON string, already parsed object,
 *   null, or undefined.
 * @param fallback - Fallback value to return if parsing fails or value is null/undefined.
 * @returns Parsed value of type T, or fallback if parsing fails.
 */
const fromJson = <T>(value: unknown, fallback: T): T => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
};

/**
 * Helper function to safely stringify values to JSON.
 *
 * Converts a value to a JSON string for storage in the database. Returns null
 * if the value is null or undefined. Used throughout this module to convert
 * JavaScript objects into JSON strings for database storage.
 *
 * @param value - Value to stringify. Can be any serializable value.
 * @returns JSON string representation, or null if value is null/undefined.
 */
const toJson = <T>(value: T): string | null => {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
};

/**
 * Converts a database row to a PresentationRecord.
 *
 * Transforms a Prisma database row (with Date objects and JSON strings) into
 * a PresentationRecord (with ISO date strings and parsed JSON objects). Handles
 * null values and JSON parsing errors gracefully.
 *
 * @param row - Database row from Prisma, or null if not found.
 * @returns PresentationRecord object, or null if row is null.
 */
const rowToPresentation = (
  row: {
    id: string;
    content: string;
    n_slides: number;
    language: string;
    document_content: string | null;
    file_metadata: string | null;
    tone: string | null;
    verbosity: string | null;
    instructions: string | null;
    include_table_of_contents: boolean;
    include_title_slide: boolean;
    web_search: boolean;
    outlines: string | null;
    layout: string | null;
    structure: string | null;
    title: string | null;
    created_at: Date;
    updated_at: Date;
  } | null,
): PresentationRecord | null => {
  if (!row) return null;
  return {
    id: row.id,
    content: row.content,
    n_slides: row.n_slides,
    language: row.language,
    document_content: row.document_content,
    file_metadata: fromJson<FileMetadata[] | null>(row.file_metadata, null),
    tone: row.tone,
    verbosity: row.verbosity,
    instructions: row.instructions,
    include_table_of_contents: row.include_table_of_contents,
    include_title_slide: row.include_title_slide,
    web_search: row.web_search,
    outlines: fromJson<Record<string, unknown> | null>(row.outlines, null),
    layout: fromJson<Record<string, unknown> | null>(row.layout, null),
    structure: fromJson<Record<string, unknown> | null>(row.structure, null),
    title: row.title,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
};

/**
 * Creates a new presentation in the database.
 *
 * Inserts a new presentation record with the provided data. Timestamps are
 * automatically set to the current time. JSON fields are serialized to strings
 * for database storage.
 *
 * @param payload - Presentation data to create. Must include all required
 *   fields except created_at and updated_at (which are auto-generated).
 * @returns Promise that resolves to the created PresentationRecord with
 *   timestamps set.
 *
 * @example
 * ```typescript
 * const presentation = await createPresentation({
 *   id: "pres-123",
 *   content: "{}",
 *   n_slides: 10,
 *   language: "en",
 *   // ... other fields
 * });
 * ```
 */
export const createPresentation = async (
  payload: Omit<PresentationRecord, "created_at" | "updated_at">,
): Promise<PresentationRecord> => {
  const now = new Date();

  const created = await prisma.presentation.create({
    data: {
      id: payload.id,
      content: payload.content,
      n_slides: payload.n_slides,
      language: payload.language,
      document_content: payload.document_content,
      file_metadata: toJson(payload.file_metadata),
      tone: payload.tone,
      verbosity: payload.verbosity,
      instructions: payload.instructions,
      include_table_of_contents: payload.include_table_of_contents,
      include_title_slide: payload.include_title_slide,
      web_search: payload.web_search,
      outlines: toJson(payload.outlines),
      layout: toJson(payload.layout),
      structure: toJson(payload.structure),
      title: payload.title,
      created_at: now,
      updated_at: now,
    },
  });

  return rowToPresentation(created)!;
};

/**
 * Retrieves a presentation by its ID.
 *
 * Fetches a single presentation record from the database using its unique
 * identifier. Returns null if no presentation with the given ID exists.
 *
 * @param id - Unique identifier of the presentation to retrieve.
 * @returns Promise that resolves to the PresentationRecord if found, or null
 *   if not found.
 */
export const getPresentationById = async (
  id: string,
): Promise<PresentationRecord | null> => {
  const row = await prisma.presentation.findUnique({
    where: { id },
  });
  return rowToPresentation(row);
};

/**
 * Lists all presentations in the database.
 *
 * Retrieves all presentation records, ordered by creation date (newest first).
 * This function does not support pagination - use listPresentationSummaries
 * for paginated results.
 *
 * @returns Promise that resolves to an array of all PresentationRecord objects.
 *
 * @remarks
 * For large datasets, consider using listPresentationSummaries with pagination
 * instead to avoid loading all presentations into memory.
 */
export const listPresentations = async (): Promise<PresentationRecord[]> => {
  const rows = await prisma.presentation.findMany({
    orderBy: { created_at: "desc" },
  });
  return rows
    .map(rowToPresentation)
    .filter((r): r is PresentationRecord => r !== null);
};

/**
 * Lists presentation summaries with pagination and filtering.
 *
 * Retrieves a paginated list of presentations with slide information included.
 * Supports cursor-based pagination and filtering by presentation state (drafts,
 * completed, or all). Each result includes the first slide for preview and
 * the total slide count.
 *
 * The function fetches one extra record to determine if there are more results.
 * If more results exist, the last item's ID is returned as nextCursor for
 * fetching the next page.
 *
 * @param limit - Maximum number of presentations to return. Must be at least 1.
 *   The function may fetch limit+1 records to check for more results.
 * @param cursor - Optional cursor for pagination. The ID of the last presentation
 *   from the previous page. If provided, results start after this cursor.
 * @param slidesFilter - Filter for presentation state:
 *   - "all": Return all presentations (default)
 *   - "drafts": Only presentations with no slides
 *   - "completed": Only presentations with at least one slide
 * @returns Promise that resolves to an object containing:
 *   - items: Array of PresentationSummaryRecord objects with slide data
 *   - nextCursor: ID of the last item if more results exist, null otherwise
 *
 * @example
 * ```typescript
 * const { items, nextCursor } = await listPresentationSummaries({
 *   limit: 20,
 *   cursor: null,
 *   slidesFilter: "completed"
 * });
 * // Fetch next page
 * const nextPage = await listPresentationSummaries({
 *   limit: 20,
 *   cursor: nextCursor
 * });
 * ```
 */
export const listPresentationSummaries = async ({
  limit,
  cursor,
  slidesFilter = "all",
}: PresentationListOptions): Promise<{
  items: PresentationSummaryRecord[];
  nextCursor: string | null;
}> => {
  const normalizedLimit = Math.max(1, limit);
  const where =
    slidesFilter === "drafts"
      ? { slides: { none: {} } }
      : slidesFilter === "completed"
        ? { slides: { some: {} } }
        : undefined;

  const rows = await prisma.presentation.findMany({
    where,
    take: normalizedLimit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    include: {
      slides: {
        take: 1,
        orderBy: { slide_index: "asc" },
      },
      _count: {
        select: { slides: true },
      },
    },
  });

  const hasMore = rows.length > normalizedLimit;
  const pageRows = hasMore ? rows.slice(0, normalizedLimit) : rows;
  const items = pageRows.map((row) => {
    const presentation = rowToPresentation(row)!;
    const slides = row.slides
      .map(mapSlideRow)
      .filter((s): s is SlideRecord => s !== null);
    return {
      ...presentation,
      slides,
      slideCount: row._count.slides,
    };
  });
  const nextCursor =
    hasMore && items.length > 0 ? items[items.length - 1].id : null;

  return { items, nextCursor };
};

/**
 * Updates an existing presentation.
 *
 * Modifies a presentation record with the provided partial data. Only fields
 * that are explicitly provided in the data parameter are updated; other fields
 * retain their existing values. The updated_at timestamp is automatically set
 * to the current time.
 *
 * If the presentation doesn't exist, returns null. JSON fields are serialized
 * to strings before storage.
 *
 * @param id - Unique identifier of the presentation to update.
 * @param data - Partial PresentationRecord containing only the fields to update.
 *   Fields not provided will retain their existing values. Undefined values are
 *   treated as "don't change", while null values explicitly set fields to null.
 * @returns Promise that resolves to the updated PresentationRecord if found,
 *   or null if the presentation doesn't exist.
 *
 * @example
 * ```typescript
 * const updated = await updatePresentation("pres-123", {
 *   title: "New Title",
 *   n_slides: 15
 * });
 * ```
 */
export const updatePresentation = async (
  id: string,
  data: Partial<PresentationRecord>,
): Promise<PresentationRecord | null> => {
  const existing = await getPresentationById(id);
  if (!existing) return null;

  const updated = await prisma.presentation.update({
    where: { id },
    data: {
      content: data.content ?? existing.content,
      n_slides: data.n_slides ?? existing.n_slides,
      language: data.language ?? existing.language,
      document_content:
        data.document_content !== undefined
          ? data.document_content
          : existing.document_content,
      file_metadata:
        data.file_metadata !== undefined
          ? toJson(data.file_metadata)
          : toJson(existing.file_metadata),
      tone: data.tone !== undefined ? data.tone : existing.tone,
      verbosity:
        data.verbosity !== undefined ? data.verbosity : existing.verbosity,
      instructions:
        data.instructions !== undefined
          ? data.instructions
          : existing.instructions,
      include_table_of_contents:
        data.include_table_of_contents ?? existing.include_table_of_contents,
      include_title_slide:
        data.include_title_slide ?? existing.include_title_slide,
      web_search: data.web_search ?? existing.web_search,
      outlines:
        data.outlines !== undefined
          ? toJson(data.outlines)
          : toJson(existing.outlines),
      layout:
        data.layout !== undefined
          ? toJson(data.layout)
          : toJson(existing.layout),
      structure:
        data.structure !== undefined
          ? toJson(data.structure)
          : toJson(existing.structure),
      title: data.title !== undefined ? data.title : existing.title,
      updated_at: new Date(),
    },
  });

  return rowToPresentation(updated);
};

/**
 * Deletes a presentation from the database.
 *
 * Removes a presentation record by its ID. This operation is irreversible.
 * Related slides are typically deleted via database cascade constraints.
 *
 * @param id - Unique identifier of the presentation to delete.
 * @returns Promise that resolves to true if deletion succeeded, false if
 *   the presentation doesn't exist or deletion failed.
 */
export const deletePresentation = async (id: string): Promise<boolean> => {
  try {
    await prisma.presentation.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
};
