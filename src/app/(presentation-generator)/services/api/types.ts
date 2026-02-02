/**
 * Type definitions for API response structures.
 *
 * Defines interfaces for chart assignment responses, deplot responses,
 * and image asset responses used in API communication.
 */

/**
 * Chart assignment response structure.
 *
 * Contains chart assignments for presentation slides, mapping slide titles
 * to chart IDs and providing chart data.
 *
 * @property title_with_charts - Array mapping slide titles to chart IDs.
 * @property charts - Array of chart definitions with data and metadata.
 */
export interface ChartAssignmentResponse {
    title_with_charts: {
        title: string;
        graph_id: string | null;
    }[];
    charts: {
        id: string;
        name: string;
        type: string;
        presentation: string;
        postfix: string | null;
        data: {
            categories: string[];
            series: {
                name: string;
                data: number[];
            }[];
        };
    }[];
}

/**
 * Deplot response structure.
 *
 * Contains presentation ID and chart assignment data returned from the
 * deplot API endpoint.
 *
 * @property presentation_id - Unique identifier of the presentation.
 * @property charts - Chart assignment response with title mappings and chart data.
 */
export interface DeplotResponse {
    presentation_id: string;
    charts: ChartAssignmentResponse;
}

/**
 * Image asset response structure.
 *
 * Contains information about an uploaded or generated image asset.
 *
 * @property message - Status or informational message.
 * @property path - File path or URL to the image.
 * @property id - Unique identifier for the image asset.
 */
export interface ImageAssetResponse {
  message:string;
  path:string;
  id:string;
}