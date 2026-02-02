/**
 * Presentation UI state management using Zustand.
 *
 * This module provides a Zustand store for managing UI state related to
 * presentation loading, streaming, rendering, and error handling. This store
 * is separate from presentation data to keep UI concerns isolated from data
 * concerns.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * State interface for presentation UI store.
 *
 * Manages loading states, streaming status, rendering status, and error
 * messages for the presentation editor UI. These states control loading
 * indicators, progress displays, and error messages throughout the UI.
 *
 * @property isLoading - General loading state. True when any async operation
 *   is in progress (e.g., fetching presentation, saving changes).
 * @property isStreaming - Streaming state for real-time content generation.
 *   True when streaming is active, false when not streaming, null when
 *   streaming status is unknown or not applicable.
 * @property isSlidesRendered - Whether slides have been successfully rendered
 *   in the UI. Used to show/hide content until rendering is complete.
 * @property isLayoutLoading - Whether layout templates are currently being
 *   loaded or compiled. Used to show loading states during layout initialization.
 * @property error - Current error message string, or null if no error.
 *   When an error is set, isLoading is automatically set to false.
 * @property setLoading - Sets the general loading state.
 * @property setStreaming - Sets the streaming state.
 * @property setSlidesRendered - Sets whether slides are rendered.
 * @property setLayoutLoading - Sets the layout loading state.
 * @property setError - Sets an error message. Automatically clears loading
 *   state when an error is set.
 * @property reset - Resets all UI state to initial values.
 */
interface PresentationUIState {
  // Loading states
  isLoading: boolean;
  isStreaming: boolean | null;
  isSlidesRendered: boolean;
  isLayoutLoading: boolean;

  // Error state
  error: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean | null) => void;
  setSlidesRendered: (rendered: boolean) => void;
  setLayoutLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  isLoading: false,
  isStreaming: null,
  isSlidesRendered: false,
  isLayoutLoading: false,
  error: null,
};

export const usePresentationUIStore = create<PresentationUIState>()(
  devtools(
    (set) => ({
      ...initialState,

      setLoading: (loading) => set({ isLoading: loading }),

      setStreaming: (streaming) => set({ isStreaming: streaming }),

      setSlidesRendered: (rendered) => set({ isSlidesRendered: rendered }),

      setLayoutLoading: (loading) => set({ isLayoutLoading: loading }),

      setError: (error) =>
        set({
          error,
          isLoading: error ? false : undefined,
        }),

      reset: () => set(initialState),
    }),
    { name: "presentation-ui" }
  )
);
