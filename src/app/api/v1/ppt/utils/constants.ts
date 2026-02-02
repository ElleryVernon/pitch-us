/**
 * Maximum file upload size for general files (100MB).
 *
 * This limit applies to document uploads (PDF, DOCX, PPTX, etc.) and prevents
 * excessive memory usage and storage consumption.
 */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

/**
 * Maximum file upload size for image files (5MB).
 *
 * Images are typically smaller than documents, so a lower limit is appropriate.
 * This prevents abuse while allowing reasonable image sizes for presentations.
 */
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Maximum file upload size for font files (20MB).
 *
 * Font files can be larger than images but smaller than documents. This limit
 * accommodates most font formats (TTF, OTF, WOFF, WOFF2) while preventing
 * excessive storage usage.
 */
export const MAX_FONT_UPLOAD_BYTES = 20 * 1024 * 1024;

// Streaming related constants

/**
 * Base delay in milliseconds between starting each slide generation.
 *
 * When generating multiple slides concurrently, each slide waits this amount
 * multiplied by its index before starting. This staggers API requests to
 * prevent rate limiting. Slide 0 starts immediately, slide 1 waits 40ms,
 * slide 2 waits 80ms, etc.
 */
export const PRIORITY_START_DELAY_MS = 40;

/**
 * Maximum delay in milliseconds before starting slide generation.
 *
 * Caps the staggered start delay to prevent excessive waiting. Even if
 * PRIORITY_START_DELAY_MS * slideIndex would be larger, the delay is clamped
 * to this value.
 */
export const MAX_PRIORITY_START_DELAY_MS = 400;

/**
 * Minimum interval in milliseconds between delta updates for the same field.
 *
 * When streaming slide content, this throttles how frequently updates are
 * sent for the same field path. Prevents overwhelming the client with too
 * many rapid updates while still providing responsive feedback.
 */
export const MIN_DELTA_INTERVAL_MS = 40;

/**
 * Maximum number of slides to generate concurrently.
 *
 * Limits parallel LLM API requests to prevent rate limiting and excessive
 * resource usage. Slides beyond this limit wait in a queue until a worker
 * becomes available.
 */
export const MAX_STREAM_SLIDE_CONCURRENCY = 10;

/**
 * Maximum number of retry attempts when waiting for presentation to be ready.
 *
 * When a client requests slide generation before the prepare endpoint has
 * finished, this determines how many times to check if the presentation
 * has outlines and layout data before giving up.
 */
export const PRESENTATION_READY_MAX_RETRIES = 15;

/**
 * Delay in milliseconds between retry attempts when waiting for presentation readiness.
 *
 * Used with PRESENTATION_READY_MAX_RETRIES to poll the database for presentation
 * data. A 300ms delay provides reasonable responsiveness without excessive
 * database queries.
 */
export const PRESENTATION_READY_RETRY_DELAY_MS = 300;

/**
 * Transparent 1x1 pixel GIF image as a data URL.
 *
 * Used as a placeholder for images that haven't been generated yet or failed
 * to generate. This ensures slides always have valid image URLs even when
 * images are missing.
 */
export const TRANSPARENT_IMAGE_DATA_URL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

/**
 * Placeholder text used in slide content before generation.
 *
 * A single space character used to fill text fields in placeholder slides.
 * This ensures fields have content (preventing UI issues) while clearly
 * indicating they're not yet populated.
 */
export const PLACEHOLDER_TEXT = " ";
