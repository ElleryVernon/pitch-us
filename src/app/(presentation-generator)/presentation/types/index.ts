/**
 * Type definitions for presentation page state management.
 *
 * Defines types for presentation UI state, streaming state, and page props
 * used in the presentation editing interface.
 */

/**
 * Presentation UI state structure.
 *
 * Tracks the current UI state of the presentation editor, including loading
 * status, selected slide, fullscreen mode, errors, and panel visibility.
 *
 * @property loading - Whether the presentation is currently loading.
 * @property selectedSlide - Index of the currently selected slide (0-based).
 * @property isFullscreen - Whether the presentation is in fullscreen mode.
 * @property error - Whether an error has occurred.
 * @property isMobilePanelOpen - Whether the mobile side panel is open.
 * @property autoSaveLoading - Whether an auto-save operation is in progress.
 */
export interface PresentationState {
  loading: boolean;
  selectedSlide: number;
  isFullscreen: boolean;
  error: boolean;
  isMobilePanelOpen: boolean;
  autoSaveLoading: boolean;
}

export interface StreamState {
  isStreaming: boolean;
}

/**
 * Props for the PresentationPage component.
 *
 * @property presentation_id - Unique identifier of the presentation to display/edit.
 */
export interface PresentationPageProps {
  presentation_id: string;
} 