/**
 * Error model definitions for API error handling.
 *
 * This module defines error classes and types used throughout the application
 * for consistent error handling. These error types are used when API calls
 * fail or when application-level errors need to be thrown and caught.
 */

/**
 * Custom error class for API-related errors.
 *
 * Represents errors that occur during API calls or when processing API
 * responses. This class extends the standard Error behavior with a structured
 * detail field that contains error information returned from the API.
 *
 * Use this class when you need to throw or catch API-specific errors with
 * structured error details. The detail field typically contains error messages
 * or error objects returned from the API server.
 *
 * @property detail - Error detail message or object describing what went wrong.
 *   This is typically the error message or error data returned from the API
 *   endpoint. Can be a string message or a structured error object.
 *
 * @example
 * ```typescript
 * // Throwing an API error
 * throw new ApiError("Failed to create presentation: Invalid input");
 *
 * // Catching and handling
 * try {
 *   await createPresentation(data);
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.error("API Error:", error.detail);
 *   }
 * }
 * ```
 */
export class ApiError {
  detail: string;

  /**
   * Creates a new ApiError instance.
   *
   * @param detail - Error detail message or object. Describes what went wrong
   *   with the API call or processing. Typically a string message from the
   *   API response.
   */
  constructor(detail: string) {
    this.detail = detail;
  }
}
