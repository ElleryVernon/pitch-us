/**
 * Dashboard API client for presentation management.
 *
 * Provides methods for fetching presentations, drafts, and managing
 * presentation data. Handles pagination, error handling, and response
 * transformation for the dashboard interface.
 */

import { getHeader } from "@/app/(presentation-generator)/services/api/header";
import { ApiResponseHandler } from "@/app/(presentation-generator)/services/api/api-error-handler";

import type { Slide } from "@/types/slide";
import type { PresentationData } from "@/stores";

/**
 * Presentation response structure from API.
 *
 * Contains complete presentation data including slides, metadata, and
 * generation parameters.
 *
 * @property id - Unique presentation identifier.
 * @property title - Presentation title, or null if untitled.
 * @property created_at - ISO timestamp when presentation was created.
 * @property updated_at - ISO timestamp when presentation was last updated.
 * @property slides - Array of slide objects.
 * @property slideCount - Optional total number of slides.
 * @property n_slides - Optional number of slides requested during generation.
 * @property content - Optional prompt/content used for generation.
 * @property document_content - Optional extracted document content.
 * @property language - Optional language code used for generation.
 */
export interface PresentationResponse {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  slides: Slide[];
  slideCount?: number;
  n_slides?: number;
  content?: string;
  document_content?: string | null;
  language?: string;
}

/**
 * Draft presentation response structure.
 *
 * Extends PresentationResponse with outline data for draft presentations
 * that haven't been fully generated yet.
 *
 * @property outlines - Optional outline data containing slide content.
 * @property slideCount - Optional number of slides in the outline.
 */
export interface DraftPresentationResponse extends PresentationResponse {
  outlines?: {
    slides?: Array<{ content?: string }>;
  } | null;
  slideCount?: number;
}

/**
 * Paginated list response structure.
 *
 * Generic type for paginated API responses with cursor-based pagination.
 *
 * @property items - Array of items in this page.
 * @property next_cursor - Cursor string for fetching the next page, or null
 *   if this is the last page.
 */
export type PresentationListResponse<T> = {
  items: T[];
  next_cursor: string | null;
};

/**
 * Options for paginated list queries.
 *
 * @property limit - Maximum number of items to return per page.
 * @property cursor - Cursor string from previous response for pagination.
 */
type ListQueryOptions = {
  limit?: number;
  cursor?: string | null;
};

/**
 * Builds a query string for list API requests.
 *
 * Constructs URL query parameters from list query options, including
 * limit and cursor for pagination.
 *
 * @param options - Optional list query options.
 * @returns Query string (e.g., "?limit=50&cursor=abc123") or empty string.
 */
const buildListQuery = (options?: ListQueryOptions) => {
  if (!options) return "";
  const params = new URLSearchParams();
  if (typeof options.limit === "number") {
    params.set("limit", String(options.limit));
  }
  if (options.cursor) {
    params.set("cursor", options.cursor);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
};

/**
 * Dashboard API client class.
 *
 * Provides static methods for interacting with the dashboard API endpoints,
 * including fetching presentations and drafts with pagination support.
 */
export class DashboardApi {
  /**
   * Fetches a paginated list of presentations.
   *
   * Retrieves presentations from the server with optional pagination.
   * Handles 404 responses gracefully (returns empty list) and normalizes
   * response format for both paginated and non-paginated responses.
   *
   * @param options - Optional pagination options (limit, cursor).
   * @returns Promise resolving to paginated presentation list response.
   * @throws Error if the request fails (except 404 which returns empty list).
   */
  static async getPresentations(
    options?: ListQueryOptions,
  ): Promise<PresentationListResponse<PresentationResponse>> {
    try {
      const query = buildListQuery(options);
      const response = await fetch(`/api/v1/presentations${query}`, {
        method: "GET",
      });

      // Handle the special case where 404 means "no presentations found"
      if (response.status === 404) {
        console.log("No presentations found");
        return { items: [], next_cursor: null };
      }

      const data = (await ApiResponseHandler.handleResponse(
        response,
        "Failed to fetch presentations",
      )) as PresentationListResponse<PresentationResponse> | PresentationResponse[];
      if (Array.isArray(data)) {
        return { items: data, next_cursor: null };
      }
      return {
        items: Array.isArray(data?.items) ? data.items : [],
        next_cursor: data?.next_cursor ?? null,
      };
    } catch (error) {
      console.error("Error fetching presentations:", error);
      throw error;
    }
  }

  /**
   * Fetches a paginated list of draft presentations.
   *
   * Retrieves draft presentations (in-progress outlines) from the server
   * with optional pagination. Handles 404 responses gracefully (returns
   * empty list) and normalizes response format.
   *
   * @param options - Optional pagination options (limit, cursor).
   * @returns Promise resolving to paginated draft presentation list response.
   * @throws Error if the request fails (except 404 which returns empty list).
   */
  static async getDraftPresentations(
    options?: ListQueryOptions,
  ): Promise<PresentationListResponse<DraftPresentationResponse>> {
    try {
      const query = buildListQuery(options);
      const response = await fetch(`/api/v1/presentations/drafts${query}`, {
        method: "GET",
      });

      if (response.status === 404) {
        console.log("No draft presentations found");
        return { items: [], next_cursor: null };
      }

      const data = (await ApiResponseHandler.handleResponse(
        response,
        "Failed to fetch draft presentations",
      )) as
        | PresentationListResponse<DraftPresentationResponse>
        | DraftPresentationResponse[];
      if (Array.isArray(data)) {
        return { items: data, next_cursor: null };
      }
      return {
        items: Array.isArray(data?.items) ? data.items : [],
        next_cursor: data?.next_cursor ?? null,
      };
    } catch (error) {
      console.error("Error fetching draft presentations:", error);
      throw error;
    }
  }

  /**
   * Fetches a single presentation by ID.
   *
   * Retrieves complete presentation data including slides and metadata.
   *
   * @param id - Unique identifier of the presentation to fetch.
   * @returns Promise resolving to PresentationData object.
   * @throws Error if presentation is not found or request fails.
   */
  static async getPresentation(id: string): Promise<PresentationData> {
    try {
      const response = await fetch(`/api/v1/presentations/${id}`, {
        method: "GET",
      });

      return await ApiResponseHandler.handleResponse<PresentationData>(
        response,
        "Presentation not found",
      );
    } catch (error) {
      console.error("Error fetching presentation:", error);
      throw error;
    }
  }

  /**
   * Deletes a presentation by ID.
   *
   * Sends a DELETE request to remove a presentation from the server.
   *
   * @param presentation_id - Unique identifier of the presentation to delete.
   * @returns Promise resolving to deletion result.
   * @throws Error if deletion fails.
   */
  static async deletePresentation(presentation_id: string) {
    try {
      const response = await fetch(
        `/api/v1/presentations/${presentation_id}`,
        {
          method: "DELETE",
          headers: getHeader(),
        },
      );

      return await ApiResponseHandler.handleResponseWithResult(
        response,
        "Failed to delete presentation",
      );
    } catch (error) {
      console.error("Error deleting presentation:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete presentation",
      };
    }
  }
}
