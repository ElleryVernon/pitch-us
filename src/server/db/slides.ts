/**
 * Database operations for slides.
 *
 * This module provides functions for managing slide records in the database.
 * Slides belong to presentations and contain content, layout information, and
 * speaker notes. Functions handle JSON serialization/deserialization for content
 * fields and maintain slide ordering within presentations.
 */

import { prisma } from "../db";

/**
 * Slide record structure stored in the database.
 *
 * Represents a single slide within a presentation. Slides contain content
 * (stored as JSON), HTML rendering, layout information, and speaker notes.
 *
 * @property id - Unique identifier for the slide.
 * @property presentation - ID of the parent presentation this slide belongs to.
 * @property layout_group - Optional layout group identifier. Groups slides
 *   that share the same custom layout for consistent styling.
 * @property layout - Optional layout identifier string. Specifies which custom
 *   layout template to use for rendering this slide.
 * @property slide_index - Zero-based position of this slide within the presentation.
 *   Determines the order slides appear. Used for sorting and navigation.
 * @property speaker_note - Optional speaker notes text. Additional information
 *   for presenters, not displayed on the slide itself.
 * @property content - JSON object containing the slide's structured content.
 *   Stored as JSON string in DB, parsed to object here. Contains text, images,
 *   charts, and other slide elements.
 * @property html_content - Optional pre-rendered HTML content for the slide.
 *   Used for quick previews or exports without re-rendering.
 * @property created_at - ISO 8601 timestamp string of when the slide was created.
 */
export type SlideRecord = {
  id: string;
  presentation: string;
  layout_group: string | null;
  layout: string | null;
  slide_index: number;
  speaker_note: string | null;
  content: Record<string, unknown> | null;
  html_content: string | null;
  created_at: string;
};

/**
 * Helper function to safely parse JSON strings from database.
 *
 * Attempts to parse a value as JSON if it's a string, otherwise returns the
 * value as-is or the fallback. Used to convert JSON strings from the database
 * into JavaScript objects.
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
 * Helper function to safely stringify values to JSON for database storage.
 *
 * Converts a value to a JSON string. Returns null if the value is null or
 * undefined. Used to convert JavaScript objects into JSON strings for
 * database storage.
 *
 * @param value - Value to stringify. Can be any serializable value.
 * @returns JSON string representation, or null if value is null/undefined.
 */
const toJson = <T>(value: T): string | null => {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
};

/**
 * Converts a database row to a SlideRecord.
 *
 * Transforms a Prisma database row (with Date objects and JSON strings) into
 * a SlideRecord (with ISO date strings and parsed JSON objects). Handles null
 * values and JSON parsing errors gracefully.
 *
 * @param row - Database row from Prisma, or null if not found.
 * @returns SlideRecord object, or null if row is null.
 */
export const mapSlideRow = (
  row: {
    id: string;
    presentation: string;
    layout_group: string | null;
    layout: string | null;
    slide_index: number;
    speaker_note: string | null;
    content: string | null;
    html_content: string | null;
    created_at: Date;
  } | null,
): SlideRecord | null => {
  if (!row) return null;
  return {
    id: row.id,
    presentation: row.presentation,
    layout_group: row.layout_group,
    layout: row.layout,
    slide_index: row.slide_index,
    speaker_note: row.speaker_note,
    content: fromJson<Record<string, unknown> | null>(row.content, null),
    html_content: row.html_content,
    created_at: row.created_at.toISOString(),
  };
};

/**
 * Lists all slides for a specific presentation.
 *
 * Retrieves all slide records belonging to a presentation, ordered by their
 * slide_index (ascending). This ensures slides are returned in the correct
 * presentation order.
 *
 * @param presentationId - Unique identifier of the presentation to get slides for.
 * @returns Promise that resolves to an array of SlideRecord objects, ordered
 *   by slide_index ascending.
 */
export const listSlidesByPresentation = async (
  presentationId: string,
): Promise<SlideRecord[]> => {
  const rows = await prisma.slide.findMany({
    where: { presentation: presentationId },
    orderBy: { slide_index: "asc" },
  });
  return rows.map(mapSlideRow).filter((r): r is SlideRecord => r !== null);
};

/**
 * Replaces all slides for a presentation atomically.
 *
 * Deletes all existing slides for a presentation and inserts new ones in a
 * single database transaction. This ensures atomicity - either all slides are
 * replaced or none are (no partial updates). Also handles potential ID conflicts
 * by deleting any slides with matching IDs across all presentations.
 *
 * This function is typically used when regenerating or completely rebuilding
 * a presentation's slide set.
 *
 * @param presentationId - Unique identifier of the presentation whose slides
 *   should be replaced.
 * @param newSlides - Array of new slide records to insert. The created_at
 *   timestamp will be set to the current time for all slides.
 * @returns Promise that resolves to an array of SlideRecord objects representing
 *   the newly inserted slides (with created_at timestamps set).
 *
 * @remarks
 * This operation is performed in a transaction to ensure data consistency.
 * If any part fails, the entire operation is rolled back.
 */
export const replaceSlidesForPresentation = async (
  presentationId: string,
  newSlides: Omit<SlideRecord, "created_at">[],
): Promise<SlideRecord[]> => {
  const now = new Date();

  // Use transaction to ensure atomicity of delete + create
  await prisma.$transaction(async (tx) => {
    // Delete existing slides for this presentation
    await tx.slide.deleteMany({
      where: { presentation: presentationId },
    });

    // Also delete any slides with the same IDs to prevent conflicts
    // (in case of ID reuse across presentations)
    if (newSlides.length > 0) {
      const newSlideIds = newSlides.map((s) => s.id);
      await tx.slide.deleteMany({
        where: { id: { in: newSlideIds } },
      });

      // Insert new slides
      await tx.slide.createMany({
        data: newSlides.map((slide) => ({
          id: slide.id,
          presentation: slide.presentation,
          layout_group: slide.layout_group,
          layout: slide.layout,
          slide_index: slide.slide_index,
          speaker_note: slide.speaker_note,
          content: toJson(slide.content),
          html_content: slide.html_content,
          created_at: now,
        })),
      });
    }
  });

  return newSlides.map((slide) => ({
    ...slide,
    content: slide.content ?? null,
    created_at: now.toISOString(),
  }));
};

/**
 * Creates or updates a slide record.
 *
 * If a slide with the given ID exists, updates it with the provided data.
 * If it doesn't exist, creates a new slide record. This is useful for
 * saving slide edits where the slide may or may not already exist in the
 * database.
 *
 * @param slide - Slide data to upsert. Must include all fields except
 *   created_at (which is set automatically on create, preserved on update).
 * @returns Promise that resolves to the SlideRecord after upsert operation.
 */
export const upsertSlide = async (
  slide: Omit<SlideRecord, "created_at">,
): Promise<SlideRecord> => {
  const now = new Date();

  const upserted = await prisma.slide.upsert({
    where: { id: slide.id },
    update: {
      presentation: slide.presentation,
      layout_group: slide.layout_group,
      layout: slide.layout,
      slide_index: slide.slide_index,
      speaker_note: slide.speaker_note,
      content: toJson(slide.content),
      html_content: slide.html_content,
    },
    create: {
      id: slide.id,
      presentation: slide.presentation,
      layout_group: slide.layout_group,
      layout: slide.layout,
      slide_index: slide.slide_index,
      speaker_note: slide.speaker_note,
      content: toJson(slide.content),
      html_content: slide.html_content,
      created_at: now,
    },
  });

  return mapSlideRow(upserted)!;
};

/**
 * Retrieves a slide by its ID.
 *
 * Fetches a single slide record from the database using its unique identifier.
 * Returns null if no slide with the given ID exists.
 *
 * @param id - Unique identifier of the slide to retrieve.
 * @returns Promise that resolves to the SlideRecord if found, or null if not found.
 */
export const getSlideById = async (id: string): Promise<SlideRecord | null> => {
  const row = await prisma.slide.findUnique({
    where: { id },
  });
  return mapSlideRow(row);
};
