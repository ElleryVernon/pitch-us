/**
 * Presentation generation API client.
 *
 * Provides methods for creating presentations, editing slides, generating
 * images, searching icons, and managing presentation content. Handles
 * all API interactions related to presentation generation and editing.
 */

import { getHeader } from "./header";
import type { PptxPresentationModel } from "@/types/pptx-models";
import type { PresentationData } from "@/stores";
import {
  IconSearch,
  ImageGenerate,
  PreviousGeneratedImagesResponse,
} from "./params";
import { ApiResponseHandler } from "./api-error-handler";

/**
 * Presentation generation API client class.
 *
 * Provides static methods for presentation generation, slide editing,
 * image generation, icon search, and other presentation-related operations.
 */
export class PresentationGenerationApi {
  /**
   * Creates a new presentation.
   *
   * Sends a request to generate a presentation with the provided content,
   * configuration, and optional document content. Returns the generated
   * presentation data.
   *
   * @param content - Text prompt describing the presentation.
   * @param n_slides - Number of slides to generate, or null for default.
   * @param document_content - Optional extracted text from uploaded documents.
   * @param file_metadata - Optional metadata for uploaded files.
   * @param language - Language code for content generation, or null for default.
   * @param tone - Tone/style for content, or null for default.
   * @param verbosity - Detail level for content, or null for default.
   * @param instructions - Additional instructions for generation.
   * @param include_table_of_contents - Whether to include TOC slide.
   * @param include_title_slide - Whether to include title slide.
   * @param web_search - Whether to enable web search for content.
   * @returns Promise resolving to the created presentation data.
   * @throws Error if presentation creation fails.
   */
  static async createPresentation({
    content,
    n_slides,
    document_content,
    file_metadata,
    language,
    tone,
    verbosity,
    instructions,
    include_table_of_contents,
    include_title_slide,
    web_search,
  }: {
    content: string;
    n_slides: number | null;
    document_content?: string | null;
    file_metadata?: Array<{ name: string; size: number; type: string }> | null;
    language: string | null;
    tone?: string | null;
    verbosity?: string | null;
    instructions?: string | null;
    include_table_of_contents?: boolean;
    include_title_slide?: boolean;
    web_search?: boolean;
  }) {
    try {
      const response = await fetch(`/api/v1/presentations`, {
        method: "POST",
        headers: getHeader(),
        body: JSON.stringify({
          content,
          n_slides,
          document_content,
          file_metadata,
          language,
          tone,
          verbosity,
          instructions,
          include_table_of_contents,
          include_title_slide,
          web_search,
        }),
        cache: "no-cache",
      });

      return await ApiResponseHandler.handleResponse(
        response,
        "Failed to create presentation",
      );
    } catch (error) {
      console.error("error in presentation creation", error);
      throw error;
    }
  }

  /**
   * Edits an existing slide using a prompt.
   *
   * Sends a request to regenerate or modify a slide based on a text prompt.
   * The LLM will interpret the prompt and update the slide content accordingly.
   *
   * @param slide_id - Unique identifier of the slide to edit.
   * @param prompt - Text prompt describing desired changes or new content.
   * @returns Promise resolving to the updated slide data.
   * @throws Error if slide editing fails.
   */
  static async editSlide(slide_id: string, prompt: string) {
    try {
      const response = await fetch(`/api/v1/slides`, {
        method: "POST",
        headers: getHeader(),
        body: JSON.stringify({
          id: slide_id,
          prompt,
        }),
        cache: "no-cache",
      });

      return await ApiResponseHandler.handleResponse(
        response,
        "Failed to update slide",
      );
    } catch (error) {
      console.error("error in slide update", error);
      throw error;
    }
  }

  /**
   * Updates presentation content and metadata.
   *
   * Sends a PATCH request to update presentation data including slides,
   * metadata, and configuration. Requires a presentation ID in the body.
   *
   * @param body - Presentation data object with id and fields to update.
   * @returns Promise resolving to updated presentation data.
   * @throws Error if update fails or presentation ID is missing.
   */
  static async updatePresentationContent(
    body:
      | PresentationData
      | ({ id: string } & Record<string, unknown>)
      | null
      | undefined,
  ) {
    try {
      if (!body?.id) {
        throw new Error("Presentation ID is required");
      }
      const response = await fetch(`/api/v1/presentations/${body.id}`, {
        method: "PATCH",
        headers: getHeader(),
        body: JSON.stringify(body),
        cache: "no-cache",
      });

      return await ApiResponseHandler.handleResponse(
        response,
        "Failed to update presentation content",
      );
    } catch (error) {
      console.error("error in presentation content update", error);
      throw error;
    }
  }

  /**
   * Prepares a presentation for generation.
   *
   * Sends a POST request to prepare presentation data, typically used
   * before generating slides or processing presentation content.
   *
   * @param presentationData - Object containing presentation_id and other
   *   preparation parameters.
   * @returns Promise resolving to preparation result.
   * @throws Error if preparation fails.
   */
  static async presentationPrepare(presentationData: { presentation_id: string; [key: string]: unknown }) {
    try {
      const presentationId = presentationData.presentation_id;
      const response = await fetch(`/api/v1/presentations/${presentationId}/prepare`, {
        method: "POST",
        headers: getHeader(),
        body: JSON.stringify(presentationData),
        cache: "no-cache",
      });

      return await ApiResponseHandler.handleResponse(
        response,
        "Failed to prepare presentation",
      );
    } catch (error) {
      console.error("error in data generation", error);
      throw error;
    }
  }

  // IMAGE AND ICON SEARCH

  /**
   * Generates an image using AI based on a text prompt.
   *
   * Sends a request to generate an image using the provided prompt.
   * Returns the generated image asset information.
   *
   * @param imageGenerate - Object containing the image generation prompt.
   * @returns Promise resolving to generated image data.
   * @throws Error if image generation fails.
   */
  static async generateImage(imageGenerate: ImageGenerate) {
    try {
      const response = await fetch(
        `/api/v1/images/generate?prompt=${imageGenerate.prompt}`,
        {
          method: "GET",
          headers: getHeader(),
          cache: "no-cache",
        },
      );

      return await ApiResponseHandler.handleResponse(
        response,
        "Failed to generate image",
      );
    } catch (error) {
      console.error("error in image generation", error);
      throw error;
    }
  }

  /**
   * Retrieves previously generated images.
   *
   * Fetches a list of images that were previously generated by the user.
   * Useful for displaying image history or reusing generated images.
   *
   * @returns Promise resolving to array of previously generated image data.
   * @throws Error if request fails.
   */
  static getPreviousGeneratedImages = async (): Promise<
    PreviousGeneratedImagesResponse[]
  > => {
    try {
      const response = await fetch(`/api/v1/images/generated`, {
        method: "GET",
        headers: getHeader(),
      });

      return await ApiResponseHandler.handleResponse(
        response,
        "Failed to get previous generated images",
      );
    } catch (error) {
      console.error("error in getting previous generated images", error);
      throw error;
    }
  };

  /**
   * Searches for icons by query string.
   *
   * Sends a search request to find icons matching the provided query.
   * Returns matching icons with metadata.
   *
   * @param iconSearch - Object containing search query and result limit.
   * @returns Promise resolving to array of matching icon data.
   * @throws Error if search fails.
   */
  static async searchIcons(iconSearch: IconSearch) {
    try {
      const response = await fetch(
        `/api/v1/icons/search?query=${iconSearch.query}&limit=${iconSearch.limit}`,
        {
          method: "GET",
          headers: getHeader(),
          cache: "no-cache",
        },
      );

      return await ApiResponseHandler.handleResponse(
        response,
        "Failed to search icons",
      );
    } catch (error) {
      console.error("error in icon search", error);
      throw error;
    }
  }

  // EXPORT PRESENTATION
  static async exportAsPPTX(
    presentationData:
      | PptxPresentationModel
      | ({ id?: string; presentation_id?: string } & Record<string, unknown>),
    presentationId?: string,
  ): Promise<string> {
    try {
      const dataRecord = presentationData as Record<string, unknown>;
      const resolvedPresentationId =
        presentationId ||
        (typeof dataRecord.id === "string"
          ? dataRecord.id
          : typeof dataRecord.presentation_id === "string"
            ? dataRecord.presentation_id
            : undefined);
      if (!resolvedPresentationId) {
        throw new Error("Presentation ID is required");
      }
      const response = await fetch(
        `/api/v1/presentations/${resolvedPresentationId}/export/pptx`,
        {
        method: "POST",
        headers: getHeader(),
        body: JSON.stringify(presentationData),
        cache: "no-cache",
        },
      );
      return await ApiResponseHandler.handleResponse<string>(
        response,
        "Failed to export as PowerPoint",
      );
    } catch (error) {
      console.error("error in pptx export", error);
      throw error;
    }
  }
}
