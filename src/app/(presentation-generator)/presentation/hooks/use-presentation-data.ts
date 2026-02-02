/**
 * React hook for fetching and managing presentation data.
 *
 * Provides a function to fetch presentation data from the server and update
 * the presentation store. Handles loading states, errors, and clears undo/redo
 * history after fetching fresh data.
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { DashboardApi } from '../../services/api/dashboard';
import { useUndoRedoStore, usePresentationDataStore } from "@/stores";

/**
 * Hook for fetching presentation data.
 *
 * Provides a function to fetch presentation data by ID and update the store.
 * Handles loading and error states via callbacks, and clears undo/redo history
 * after successful fetch.
 *
 * @param presentationId - Unique identifier of the presentation to fetch.
 * @param setLoading - Callback to set loading state.
 * @param setError - Callback to set error state.
 * @returns Object with fetchUserSlides function.
 */
export const usePresentationData = (
  presentationId: string,
  setLoading: (loading: boolean) => void,
  setError: (error: boolean) => void
) => {
  const setPresentationData = usePresentationDataStore((state) => state.setPresentationData);
  const clearHistory = useUndoRedoStore((state) => state.clearHistory);

  const fetchUserSlides = useCallback(async () => {
    try {
      const data = await DashboardApi.getPresentation(presentationId);
      if (data) {
        setPresentationData(data);
        clearHistory();
        setLoading(false);
      }
    } catch (error) {
      setError(true);
      toast.error("Failed to load presentation");
      console.error("Error fetching user slides:", error);
      setLoading(false);
    }
  }, [presentationId, setPresentationData, setLoading, setError, clearHistory]);

  return {
    fetchUserSlides,
  };
};
