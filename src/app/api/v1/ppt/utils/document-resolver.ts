import { getPresentationById } from "@/server/db/presentations";
import { LayoutPayload } from "../types/streaming";
import {
  PRESENTATION_READY_MAX_RETRIES,
  PRESENTATION_READY_RETRY_DELAY_MS,
} from "./constants";

/**
 * Waits for a presentation to be ready for slide generation with retry logic.
 *
 * Checks if a presentation has both outlines and layout data set. Uses a retry
 * mechanism to handle race conditions where the client navigates to the streaming
 * endpoint before the prepare endpoint has finished saving data to the database.
 *
 * The function polls the database up to PRESENTATION_READY_MAX_RETRIES times,
 * waiting PRESENTATION_READY_RETRY_DELAY_MS between attempts. This allows
 * async database operations to complete.
 *
 * A presentation is considered "ready" when:
 * - It exists in the database
 * - It has a valid layout object with a non-empty slides array
 * - It has an outlines object (structure doesn't matter, just existence)
 *
 * @param presentationId - The unique identifier of the presentation to check.
 * @param maxRetries - Maximum number of retry attempts (default: PRESENTATION_READY_MAX_RETRIES).
 * @param retryDelayMs - Delay in milliseconds between retry attempts
 *   (default: PRESENTATION_READY_RETRY_DELAY_MS).
 * @returns Promise that resolves to the presentation record if ready, or null
 *   if not found or max retries exceeded.
 *
 * @example
 * ```typescript
 * const presentation = await waitForPresentationReady("abc-123");
 * if (!presentation) {
 *   // Presentation not found or not ready after retries
 * }
 * ```
 */
export const waitForPresentationReady = async (
  presentationId: string,
  maxRetries: number = PRESENTATION_READY_MAX_RETRIES,
  retryDelayMs: number = PRESENTATION_READY_RETRY_DELAY_MS,
): Promise<Awaited<ReturnType<typeof getPresentationById>>> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const presentation = await getPresentationById(presentationId);
    if (!presentation) {
      return null;
    }

    // Check that layout has slides array with content
    const layoutData = presentation.layout as LayoutPayload | null;
    const hasValidLayout =
      layoutData &&
      Array.isArray(layoutData.slides) &&
      layoutData.slides.length > 0;
    const hasValidOutlines =
      presentation.outlines &&
      typeof presentation.outlines === "object" &&
      "slides" in presentation.outlines;

    if (hasValidLayout && hasValidOutlines) {
      return presentation;
    }

    if (attempt < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  // Max retries reached, return current state
  return await getPresentationById(presentationId);
};

/**
 * Resolves document content from a presentation's stored document_content field.
 *
 * Extracts text content that was previously extracted from uploaded files
 * (PDF, DOCX, etc.) and stored in the presentation record. This content
 * is used as context for generating outlines and slide content.
 *
 * @param presentation - The presentation record from the database, or null
 *   if the presentation doesn't exist.
 * @returns The document content string if available, or an empty string
 *   if the presentation is null or has no document content.
 *
 * @example
 * ```typescript
 * const presentation = await getPresentationById("abc-123");
 * const docContent = await resolveDocumentContent(presentation);
 * // Returns: "Extracted text from PDF..." or ""
 * ```
 */
export const resolveDocumentContent = async (
  presentation: Awaited<ReturnType<typeof getPresentationById>>,
): Promise<string> => {
  if (!presentation) {
    return "";
  }
  return presentation.document_content || "";
};

/**
 * Combines user prompt and document content into a single source string.
 *
 * Merges the user's text prompt with extracted document content, separated
 * by a delimiter. This combined content is used as context for LLM-based
 * content generation, providing both user intent and factual information
 * from uploaded documents.
 *
 * Empty strings are filtered out, so if only one source is available,
 * only that source is returned (without the delimiter).
 *
 * @param promptContent - User-provided text prompt describing the presentation.
 *   Can be an empty string if not provided.
 * @param documentContent - Extracted text from uploaded files (PDF, DOCX, etc.).
 *   Can be an empty string if no documents were uploaded.
 * @returns Combined content string with sources separated by "\n\n---\n\n".
 *   Returns empty string if both inputs are empty.
 *
 * @example
 * ```typescript
 * const fullContent = buildFullSourceContent(
 *   "Create a pitch deck about our startup",
 *   "Company revenue: $10M ARR..."
 * );
 * // Returns: "Create a pitch deck...\n\n---\n\nCompany revenue: $10M ARR..."
 * ```
 */
export const buildFullSourceContent = (
  promptContent: string,
  documentContent: string,
): string => {
  return [promptContent || "", documentContent]
    .filter(Boolean)
    .join("\n\n---\n\n");
};
