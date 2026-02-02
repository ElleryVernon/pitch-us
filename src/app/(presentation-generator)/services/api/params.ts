/**
 * Type definitions for API request parameters.
 *
 * Defines interfaces for various API request payloads including image search,
 * image generation, icon search, and previous images response.
 */

/**
 * Image search request parameters.
 *
 * Parameters for searching images by query within a presentation context.
 *
 * @property presentation_id - Unique identifier of the presentation.
 * @property query - Search query string.
 * @property page - Page number for pagination (1-based).
 * @property limit - Maximum number of results per page.
 */
export interface ImageSearch {
  presentation_id: string;
  query: string;
  page: number;
  limit: number;
}

/**
 * Image generation request parameters.
 *
 * Parameters for generating an image using AI.
 *
 * @property prompt - Text prompt describing the image to generate.
 */
export interface ImageGenerate {
  

  prompt: string;
}

/**
 * Icon search request parameters.
 *
 * Parameters for searching icons by query.
 *
 * @property query - Search query string for icon names or tags.
 * @property limit - Maximum number of results to return.
 */
export interface IconSearch {
 

  query: string;

  limit: number;
}

/**
 * Previous generated images response structure.
 *
 * Contains information about previously generated images, including prompts,
 * creation date, and file paths.
 *
 * @property extras - Additional metadata including prompts.
 * @property created_at - ISO timestamp when the image was created.
 * @property id - Unique identifier for the image.
 * @property path - File path or URL to the image.
 */
export interface PreviousGeneratedImagesResponse {

    extras: {
      prompt: string;
      theme_prompt: string | null;
    },
    created_at: string;
    id: string;
    path: string;
}