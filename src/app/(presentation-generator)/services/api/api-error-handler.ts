/**
 * API error response handler utilities.
 *
 * Provides centralized error handling for API responses, including parsing
 * error messages from various response formats and generating user-friendly
 * error messages based on HTTP status codes.
 */

/**
 * Structure of error responses from the API.
 *
 * APIs may return errors in different formats. This interface covers common
 * error message field names used across different endpoints.
 *
 * @property detail - Detailed error message (common in FastAPI/Starlette).
 * @property message - Generic error message field.
 * @property error - Alternative error message field.
 */
interface ApiErrorResponse {
  detail?: string;
  message?: string;
  error?: string;
}

/**
 * API response handler utility class.
 *
 * Provides static methods for handling API responses, including success
 * cases, error parsing, and status code-based error messages. Ensures
 * consistent error handling across the application.
 */
export class ApiResponseHandler {
 
  /**
   * Handles an API response and returns parsed data or throws an error.
   *
   * Parses successful responses as JSON and returns the data. For error
   * responses, extracts error messages from the response body (checking
   * detail, message, and error fields) or generates status-based messages.
   *
   * @param response - Fetch Response object from API request.
   * @param defaultErrorMessage - Default error message if parsing fails.
   * @returns Promise resolving to parsed response data (type T).
   * @throws Error with appropriate message if response is not ok.
   *
   * @example
   * ```typescript
   * const data = await ApiResponseHandler.handleResponse<MyType>(
   *   response,
   *   "Request failed"
   * );
   * ```
   */
  static async handleResponse<T = unknown>(response: Response, defaultErrorMessage: string): Promise<T> {
    // Handle successful responses
    if (response.ok) {
      // Handle 204 No Content responses
      if (response.status === 204) {
        return undefined as T;
      }
      
      // Try to parse JSON response
      try {
        return (await response.json()) as T;
      } catch (error) {
        // If JSON parsing fails but response is ok, return empty object
        return {} as T;
      }
    }

    // Handle error responses
    let errorMessage = defaultErrorMessage;
    
    try {
      const errorData: ApiErrorResponse = await response.json();
      
      // Extract error message in order of preference
      if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (parseError) {
      // If JSON parsing fails, use status-based messages
      errorMessage = this.getStatusBasedErrorMessage(response.status, defaultErrorMessage);
    }

    // Throw error with appropriate message
    throw new Error(errorMessage);
  }

  /**
   * Handles an API response and returns a result object instead of throwing.
   *
   * Similar to handleResponse but returns a result object with success flag
   * and optional message instead of throwing errors. Useful when you want to
   * handle errors gracefully without try-catch blocks.
   *
   * @param response - Fetch Response object from API request.
   * @param defaultErrorMessage - Default error message if parsing fails.
   * @returns Promise resolving to result object with success flag and message.
   *
   * @example
   * ```typescript
   * const result = await ApiResponseHandler.handleResponseWithResult(
   *   response,
   *   "Operation failed"
   * );
   * if (result.success) {
   *   // Handle success
   * } else {
   *   // Handle error: result.message
   * }
   * ```
   */
  static async handleResponseWithResult(response: Response, defaultErrorMessage: string): Promise<{success: boolean, message?: string}> {
    try {
      // Handle successful responses
      if (response.ok) {
        return { success: true };
      }

      // Handle error responses
      let errorMessage = defaultErrorMessage;
      
      try {
        const errorData: ApiErrorResponse = await response.json();
        
        // Extract error message in order of preference
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        // If JSON parsing fails, use status-based messages
        errorMessage = this.getStatusBasedErrorMessage(response.status, defaultErrorMessage);
      }

      return {
        success: false,
        message: errorMessage,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : defaultErrorMessage,
      };
    }
  }

  /**
   * Generates a user-friendly error message based on HTTP status code.
   *
   * Maps common HTTP status codes to descriptive error messages that are
   * helpful for end users. Used as a fallback when error response parsing fails.
   *
   * @param status - HTTP status code from the response.
   * @param defaultMessage - Default message to use if status is not recognized.
   * @returns User-friendly error message string.
   */
  private static getStatusBasedErrorMessage(status: number, defaultMessage: string): string {
    switch (status) {
      case 400:
        return "Bad request. Please check your input and try again.";
      case 401:
        return "Unauthorized. Please log in and try again.";
      case 403:
        return "Access forbidden. You don't have permission to perform this action.";
      case 404:
        return "Resource not found. The requested item may have been deleted or moved.";
      case 409:
        return "Conflict. The resource already exists or there's a conflict with the current state.";
      case 422:
        return "Validation error. Please check your input and try again.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
        return "Internal server error. Please try again later.";
      case 502:
        return "Bad gateway. The server is temporarily unavailable.";
      case 503:
        return "Service unavailable. Please try again later.";
      case 504:
        return "Gateway timeout. The request took too long to process.";
      default:
        return defaultMessage;
    }
  }
}

export type { ApiErrorResponse }; 