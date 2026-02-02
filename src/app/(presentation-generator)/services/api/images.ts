/**
 * Images API client for image asset management.
 *
 * Provides methods for uploading, retrieving, and deleting image assets.
 * Handles form data uploads and image asset responses.
 */

import { getHeaderForFormData } from "./header";
import { ApiResponseHandler } from "./api-error-handler";
import { ImageAssetResponse } from "./types";

/**
 * Images API client class.
 *
 * Provides static methods for managing image assets, including upload,
 * retrieval, and deletion operations.
 */
export class ImagesApi {
 
  /**
   * Uploads an image file to the server.
   *
   * Sends a file as multipart/form-data to the images API endpoint.
   * Returns the uploaded image asset information including path and ID.
   *
   * @param file - Image File object to upload.
   * @returns Promise resolving to ImageAssetResponse with upload details.
   * @throws Error if upload fails.
   */
 static async uploadImage(file: File): Promise<ImageAssetResponse> {
    try {
          const formData = new FormData();
      formData.append("file", file);
    const response = await fetch(`/api/v1/images`, {
      method: "POST",
      headers: getHeaderForFormData(),
      body: formData,
    });
    return await ApiResponseHandler.handleResponse(response, "Failed to upload image") as ImageAssetResponse;
  } catch (error:any) {
    console.log("Upload error:", error.message);
    throw error;
  }
  }

  /**
   * Retrieves a list of previously uploaded images.
   *
   * Fetches all images that have been uploaded by the current user.
   * Useful for displaying image galleries or recent uploads.
   *
   * @returns Promise resolving to array of ImageAssetResponse objects.
   * @throws Error if request fails.
   */
  static async getUploadedImages(): Promise<ImageAssetResponse[]> {
    try {
    const response = await fetch(`/api/v1/images/uploaded`);
   return await ApiResponseHandler.handleResponse(response, "Failed to get uploaded images") as ImageAssetResponse[];
  } catch (error:any) {
    console.log("Get uploaded images error:", error);
    throw error;
  }
  }

  /**
   * Deletes an image asset by ID.
   *
   * Sends a DELETE request to remove an image asset from the server.
   * Returns a result object indicating success or failure.
   *
   * @param image_id - Unique identifier of the image to delete.
   * @returns Promise resolving to result object with success flag and message.
   * @throws Error if deletion fails.
   */
  static async deleteImage(image_id: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`/api/v1/images/${image_id}`, {
        method: "DELETE"
      });
      return await ApiResponseHandler.handleResponse(response, "Failed to delete image") as {success: boolean, message?: string};
    } catch (error:any) {
      console.log("Delete image error:", error);
      throw error;
    }
  }
}


