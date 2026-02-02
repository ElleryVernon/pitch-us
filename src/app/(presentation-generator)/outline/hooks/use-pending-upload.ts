/**
 * React hook for processing pending file uploads from the upload page.
 *
 * This hook handles the transition from the upload page to the outline page.
 * When a user uploads files or enters a prompt on the upload page, the data
 * is stored in the upload store as "pending upload". This hook processes that
 * pending data by:
 *
 * 1. Validating that prompt or document content exists
 * 2. Creating a new presentation via API with the upload data
 * 3. Setting the presentation ID in the store
 * 4. Clearing pending upload state
 * 5. Clearing any existing outlines (fresh start)
 *
 * The hook only processes pending uploads when:
 * - A pending upload exists in the store
 * - No presentation ID is currently set (prevents duplicate processing)
 * - The operation hasn't already started (uses ref to prevent double execution)
 *
 * Error handling includes user-friendly toast notifications and allows retry
 * by resetting the started flag on error.
 */

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { PresentationGenerationApi } from "../../services/api/presentation-generation";
import { usePresentationDataStore, useUploadStore } from "@/stores";
import { MixpanelEvent, trackEvent } from "@/utils/mixpanel";

/**
 * State structure for pending upload processing.
 *
 * @property isLoading - Whether the upload is currently being processed.
 * @property message - Status message to display during processing (e.g., "Generating outline...").
 * @property hasPending - Whether there is a pending upload waiting to be processed.
 */
type PendingUploadState = {
  isLoading: boolean;
  message: string;
  hasPending: boolean;
};

/**
 * Default state when no pending upload exists.
 */
const DEFAULT_STATE: PendingUploadState = {
  isLoading: false,
  message: "",
  hasPending: false,
};

/**
 * Hook for processing pending file uploads.
 *
 * Monitors the upload store for pending uploads and processes them by creating
 * a new presentation. Only processes when no presentation ID exists yet, preventing
 * conflicts with existing presentations.
 *
 * @param presentationId - Current presentation ID, or null if none exists.
 *   If a presentation ID exists, pending uploads are ignored (already processed).
 * @returns State object containing loading status, message, and pending flag.
 */
export const usePendingUpload = (
  presentationId: string | null,
): PendingUploadState => {
  // Zustand store selectors for upload and presentation state
  const pendingUpload = useUploadStore((state) => state.pendingUpload);
  const clearPendingUpload = useUploadStore((state) => state.clearPendingUpload);
  const setPresentationId = usePresentationDataStore((state) => state.setPresentationId);
  const clearOutlines = usePresentationDataStore((state) => state.clearOutlines);
  
  // Local state for processing status
  // Initialized with hasPending flag based on current pending upload
  const [state, setState] = useState<PendingUploadState>(() => ({
    ...DEFAULT_STATE,
    hasPending: Boolean(pendingUpload),
  }));
  
  // Ref to prevent duplicate processing
  // Once processing starts, this flag prevents the effect from running again
  // until an error occurs (which resets it to allow retry)
  const startedRef = useRef(false);

  /**
   * Effect: Process pending upload when conditions are met.
   *
   * Processes pending uploads by:
   * 1. Validating that prompt or document content exists
   * 2. Creating presentation via API with all upload configuration
   * 3. Setting presentation ID and clearing pending state
   *
   * Only runs when:
   * - Pending upload exists
   * - No presentation ID is set (prevents duplicate processing)
   * - Processing hasn't already started (prevents double execution)
   *
   * On error, resets startedRef to allow retry. On success, clears all pending
   * state and sets the new presentation ID.
   */
  useEffect(() => {
    // Early return if no pending upload or presentation already exists
    if (!pendingUpload || presentationId) {
      setState((prev) => ({
        ...prev,
        hasPending: Boolean(pendingUpload),
      }));
      return;
    }
    
    // Prevent duplicate processing
    if (startedRef.current) return;
    startedRef.current = true;
    setState((prev) => ({
      ...prev,
      hasPending: true,
    }));

    /**
     * Async function that processes the pending upload.
     *
     * Validates input, creates presentation, and updates store state.
     * Handles errors with user-friendly notifications and allows retry.
     */
    const run = async () => {
      try {
        // Validate that at least prompt or document content exists
        const hasPrompt = Boolean(pendingUpload.config.prompt?.trim());
        const hasDocument = Boolean(pendingUpload.documentContent?.trim());
        if (!hasPrompt && !hasDocument) {
          toast.error("Please add a prompt or upload a readable file.");
          clearPendingUpload();
          setState(DEFAULT_STATE);
          startedRef.current = false;
          return;
        }
        
        // Set loading state and track analytics
        setState({
          isLoading: true,
          message: "Generating outline...",
          hasPending: true,
        });
        trackEvent(MixpanelEvent.Upload_Create_Presentation_API_Call);
        
        // Parse slide count from config (may be string or number)
        const slideCount = pendingUpload.config.slides
          ? Number.parseInt(pendingUpload.config.slides, 10)
          : null;
        
        // Create presentation with all upload configuration
        // Includes prompt, document content, file metadata, and all user settings
        const createResponse =
          (await PresentationGenerationApi.createPresentation({
            content: pendingUpload.config.prompt ?? "",
            n_slides: Number.isFinite(slideCount) ? slideCount : null,
            document_content: pendingUpload.documentContent ?? null,
            file_metadata: pendingUpload.fileMetadata ?? null,
            language: pendingUpload.config.language ?? "",
            tone: pendingUpload.config.tone,
            verbosity: pendingUpload.config.verbosity,
            instructions: pendingUpload.config.instructions || null,
            include_table_of_contents:
              pendingUpload.config.includeTableOfContents,
            include_title_slide: pendingUpload.config.includeTitleSlide,
            web_search: pendingUpload.config.webSearch,
          })) as { id: string };

        // Update store with new presentation ID
        setPresentationId(createResponse.id);
        
        // Clear outlines to start fresh (outlines will be streamed)
        clearOutlines();
        
        // Clear pending upload state (processing complete)
        clearPendingUpload();
        setState(DEFAULT_STATE);
      } catch (error) {
        // Handle errors with user-friendly notification
        const message =
          error instanceof Error
            ? error.message
            : "Failed to process pending upload";
        toast.error("Error", { description: message });
        clearPendingUpload();
        setState(DEFAULT_STATE);
        // Reset startedRef to allow retry after error
        // This allows the user to try again if something went wrong
        startedRef.current = false;
      }
    };

    void run();
  }, [pendingUpload, presentationId, clearPendingUpload, setPresentationId, clearOutlines]);

  return state;
};
