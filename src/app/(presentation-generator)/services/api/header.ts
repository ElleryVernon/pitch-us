/**
 * HTTP header utilities for API requests.
 *
 * Provides functions for generating standard HTTP headers for JSON and
 * form data requests, including CORS headers for cross-origin requests.
 */

/**
 * Gets standard HTTP headers for JSON API requests.
 *
 * Returns headers configured for JSON content type with CORS support.
 * Used for standard API requests sending JSON payloads.
 *
 * @returns Object containing Content-Type, Accept, and CORS headers.
 */
export const getHeader = () => {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",  
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
};

/**
 * Gets HTTP headers for form data API requests.
 *
 * Returns headers configured for multipart/form-data requests with CORS
 * support. Used for file uploads and form submissions.
 *
 * @returns Object containing CORS headers (Content-Type is set automatically
 *   by the browser for FormData).
 */
export const getHeaderForFormData = () => {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
};
