/**
 * Type definitions for presentation generation API requests and responses.
 *
 * This module defines the data structures used for communicating with the
 * presentation generation API endpoints. These types are used throughout the
 * application for type-safe API interactions.
 */

/**
 * Request body structure for generating a new presentation.
 *
 * Used when calling the presentation generation API endpoint to create a new
 * pitch deck. The API will use the provided prompt and/or document content
 * to generate the requested number of slides.
 *
 * @property prompt - Optional user-provided text prompt describing what the
 *   presentation should be about. Used as additional context or instructions
 *   for the LLM when generating content.
 * @property document - Optional extracted text content from uploaded documents
 *   (PDF, DOCX, etc.). This content serves as the primary source of information
 *   for generating presentation slides. If provided, the LLM will extract key
 *   information from this document to populate the slides.
 * @property n_slides - Required number of slides to generate in the presentation.
 *   Must be a positive integer. Typical values range from 8-15 slides for a
 *   standard pitch deck.
 */
export interface GenerateRequestBody {
  prompt?: string;
  document?: string;
  n_slides: number;
}

/**
 * Data structure representing a single slide in a presentation response.
 *
 * Returned by the API after presentation generation. Contains the unique
 * identifier for the slide and a URL/path to the slide's thumbnail image
 * for preview purposes.
 *
 * @property id - Unique identifier string for the slide. Used to reference
 *   the slide in subsequent API calls (e.g., fetching slide content, updating
 *   slide data).
 * @property thumbnail - URL or file path to the thumbnail image of the slide.
 *   Used to display a preview of the slide in the UI before loading the full
 *   slide content.
 */
export interface SlideData {
  id: string;
  thumbnail: string;
}

/**
 * Complete response structure from the presentation generation API.
 *
 * Returned after successfully generating a new presentation. Contains metadata
 * about the created presentation and an array of all slides that were generated.
 * This structure is used by the frontend to display the presentation list and
 * initialize the presentation editor.
 *
 * @property presentation - Metadata object containing information about the
 *   created presentation.
 * @property presentation.id - Unique identifier for the presentation. Used
 *   for all subsequent operations on this presentation.
 * @property presentation.created_at - ISO 8601 timestamp string indicating when
 *   the presentation was created.
 * @property presentation.prompt - The prompt text that was used to generate
 *   this presentation. Stored for reference and potential regeneration.
 * @property presentation.n_slides - Number of slides that were generated in
 *   this presentation.
 * @property presentation.file - File path or URL to the generated presentation
 *   file (e.g., PPTX export). May be null if the presentation hasn't been
 *   exported yet.
 * @property slides - Array of SlideData objects, one for each slide that was
 *   generated. The order of slides in this array matches the presentation order.
 *   Each slide can be individually accessed using its ID.
 */
export interface PresentationResponse {
  presentation: {
    id: string;
    created_at: string;
    prompt: string;
    n_slides: number;
    file: string;
  };
  slides: SlideData[];
}
