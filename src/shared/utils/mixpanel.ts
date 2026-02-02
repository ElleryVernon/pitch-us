/**
 * Mixpanel analytics integration utilities.
 *
 * This module provides functions for tracking user events and analytics
 * using Mixpanel. It handles initialization, event tracking, user identification,
 * and respects user telemetry preferences. All tracking functions check for
 * telemetry consent before sending data.
 *
 * The module is marked as "use client" because Mixpanel requires browser
 * environment and cannot run on the server side.
 */

"use client";

import mixpanel from "mixpanel-browser";

/**
 * Mixpanel project token for this application.
 *
 * This token identifies the Mixpanel project where analytics data will be
 * sent. The token is used during Mixpanel initialization to connect to the
 * correct project.
 *
 * @remarks
 * In a production environment, consider moving this to an environment variable
 * for better security and configuration management.
 */
const MIXPANEL_TOKEN = "d726e8bea8ec147f4c7720060cb2e6d1";

/**
 * Enumeration of all trackable events in the application.
 *
 * Defines all user actions and system events that can be tracked for analytics.
 * Each event name is a human-readable string that describes the action being
 * tracked. Event names follow a pattern of "Page_Action_Element" or similar
 * hierarchical naming.
 *
 * These events are used throughout the application to track user behavior,
 * feature usage, and application performance. Event tracking helps understand
 * how users interact with the application and identify areas for improvement.
 *
 * @remarks
 * When adding new events, follow the existing naming convention and ensure
 * the event name clearly describes what action is being tracked.
 */
export enum MixpanelEvent {
  PageView = "Page View",
  Navigation = "Navigation",
  Home_SaveConfiguration_Button_Clicked = "Home Save Configuration Button Clicked",
  Home_SaveConfiguration_API_Call = "Home Save Configuration API Call",
  Home_CheckOllamaModelPulled_API_Call = "Home Check Ollama Model Pulled API Call",
  Home_DownloadOllamaModel_API_Call = "Home Download Ollama Model API Call",
  Outline_Generate_Presentation_Button_Clicked = "Outline Generate Presentation Button Clicked",
  Outline_Select_Template_Button_Clicked = "Outline Select Template Button Clicked",
  Outline_Add_Slide_Button_Clicked = "Outline Add Slide Button Clicked",
  Presentation_Prepare_API_Call = "Presentation Prepare API Call",
  Presentation_Stream_API_Call = "Presentation Stream API Call",
  Group_Layout_Selected_Clicked = "Group Layout Selected Clicked",
  Header_Export_PDF_Button_Clicked = "Header Export PDF Button Clicked",
  Header_Export_PPTX_Button_Clicked = "Header Export PPTX Button Clicked",
  Header_UpdatePresentationContent_API_Call = "Header Update Presentation Content API Call",
  Header_ExportAsPDF_API_Call = "Header Export As PDF API Call",
  Header_GetPptxModel_API_Call = "Header Get PPTX Model API Call",
  Header_ExportAsPPTX_API_Call = "Header Export As PPTX API Call",
  Slide_Add_New_Slide_Button_Clicked = "Slide Add New Slide Button Clicked",
  Slide_Delete_Slide_Button_Clicked = "Slide Delete Slide Button Clicked",
  Slide_Update_From_Prompt_Button_Clicked = "Slide Update From Prompt Button Clicked",
  Slide_Edit_API_Call = "Slide Edit API Call",
  Slide_Delete_API_Call = "Slide Delete API Call",
  TemplatePreview_Back_Button_Clicked = "Template Preview Back Button Clicked",
  TemplatePreview_All_Groups_Button_Clicked = "Template Preview All Groups Button Clicked",
  TemplatePreview_Delete_Templates_Button_Clicked = "Template Preview Delete Templates Button Clicked",
  TemplatePreview_Delete_Templates_API_Call = "Template Preview Delete Templates API Call",
  TemplatePreview_Open_Editor_Button_Clicked = "Template Preview Open Editor Button Clicked",
  CustomTemplate_Save_Templates_API_Call = "Custom Template Save Templates API Call",
  PdfMaker_Retry_Button_Clicked = "PDF Maker Retry Button Clicked",
  Upload_Upload_Documents_API_Call = "Upload Upload Documents API Call",
  Upload_Decompose_Documents_API_Call = "Upload Decompose Documents API Call",
  Upload_Create_Presentation_API_Call = "Upload Create Presentation API Call",
  DocumentsPreview_Create_Presentation_API_Call = "Documents Preview Create Presentation API Call",
  DocumentsPreview_Next_Button_Clicked = "Documents Preview Next Button Clicked",
  Settings_SaveConfiguration_Button_Clicked = "Settings Save Configuration Button Clicked",
  Settings_SaveConfiguration_API_Call = "Settings Save Configuration API Call",
  Settings_CheckOllamaModelPulled_API_Call = "Settings Check Ollama Model Pulled API Call",
  Settings_DownloadOllamaModel_API_Call = "Settings Download Ollama Model API Call",
  PresentationPage_Refresh_Page_Button_Clicked = "Presentation Page Refresh Page Button Clicked",
  PresentationMode_Fullscreen_Toggle_Clicked = "Presentation Mode Fullscreen Toggle Clicked",
  PresentationMode_Exit_Clicked = "Presentation Mode Exit Clicked",
  ImageEditor_GetPreviousGeneratedImages_API_Call = "Image Editor Get Previous Generated Images API Call",
  ImageEditor_GenerateImage_API_Call = "Image Editor Generate Image API Call",
  ImageEditor_UploadImage_API_Call = "Image Editor Upload Image API Call",
  Header_ReGenerate_Button_Clicked = "Header ReGenerate Button Clicked",
}

/**
 * Type for Mixpanel event properties.
 *
 * Defines the structure for additional data that can be sent with tracked
 * events. Properties provide context about the event, such as user actions,
 * page information, or feature usage details. All property values must be
 * serializable (strings, numbers, booleans, or arrays/objects of these types).
 */
export type MixpanelProps = Record<string, unknown>;

/**
 * Global window interface extensions for Mixpanel state.
 *
 * Extends the Window interface to include flags for tracking Mixpanel
 * initialization and telemetry consent status. These flags are stored on
 * the window object to persist across page navigations and component re-renders.
 */
declare global {
  interface Window {
    /**
     * Flag indicating whether Mixpanel has been initialized.
     *
     * Set to true after Mixpanel.init() is called. Used to prevent multiple
     * initializations and to check if tracking is ready.
     */
    __mixpanel_initialized?: boolean;
    /**
     * Flag indicating whether telemetry/tracking is enabled for this user.
     *
     * Set based on user preferences fetched from the telemetry API. If false,
     * no events will be tracked. If undefined, the status hasn't been checked
     * yet and will be fetched on first use.
     */
    __mixpanel_telemetry_enabled?: boolean;
  }
}

/**
 * Checks if Mixpanel can be used in the current environment.
 *
 * Verifies that the code is running in a browser environment (not server-side)
 * and that a Mixpanel token is configured. Mixpanel requires browser APIs and
 * cannot run during server-side rendering.
 *
 * @returns True if Mixpanel can be used (browser environment with token),
 *   false otherwise (server-side or no token).
 */
function canUseMixpanel(): boolean {
  return typeof window !== "undefined" && Boolean(MIXPANEL_TOKEN);
}

/**
 * Promise for the telemetry status check API call.
 *
 * Caches the promise for the telemetry status check to prevent multiple
 * simultaneous API calls. Once resolved, the result is stored in
 * window.__mixpanel_telemetry_enabled.
 */
let trackingCheckPromise: Promise<boolean> | null = null;

/**
 * Ensures telemetry consent status has been checked and cached.
 *
 * Checks the user's telemetry preference by calling the telemetry API endpoint.
 * The result is cached in window.__mixpanel_telemetry_enabled to avoid repeated
 * API calls. If the API call fails or returns invalid data, defaults to
 * enabling tracking (opt-out model).
 *
 * This function is called before initializing Mixpanel or tracking events to
 * ensure we respect user preferences. The check is performed asynchronously
 * and cached to minimize API calls.
 *
 * @returns Promise that resolves to true if telemetry is enabled, false if
 *   disabled. Returns false immediately if running server-side. Defaults to
 *   true if the API call fails (opt-out model).
 */
async function ensureTelemetryStatus(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (typeof window.__mixpanel_telemetry_enabled === "boolean") {
    return window.__mixpanel_telemetry_enabled;
  }
  if (!trackingCheckPromise) {
    trackingCheckPromise = fetch("/api/v1/config/telemetry")
      .then(async (res) => {
        try {
          const data = await res.json();
          const enabled = Boolean(data?.telemetryEnabled);
          window.__mixpanel_telemetry_enabled = enabled;
          return enabled;
        } catch {
          // If the API response is malformed, default to enabling tracking
          window.__mixpanel_telemetry_enabled = true;
          return true;
        }
      })
      .catch(() => {
        // If the API call fails, default to enabling tracking
        window.__mixpanel_telemetry_enabled = true;
        return true;
      });
  }
  return trackingCheckPromise;
}

/**
 * Initializes the Mixpanel analytics library.
 *
 * Sets up Mixpanel for tracking by calling mixpanel.init() with the project
 * token. This function respects user telemetry preferences and only initializes
 * if tracking is enabled. Page view tracking is disabled (track_pageview: false)
 * because we handle page views manually for more control.
 *
 * After initialization, identifies the user with their distinct ID to enable
 * user-level analytics. The initialization flag is set to prevent multiple
 * initializations.
 *
 * This function is safe to call multiple times - it will only initialize once
 * and will check telemetry consent before proceeding.
 *
 * @remarks
 * This function is asynchronous internally (checks telemetry status) but
 * doesn't return a promise. Initialization happens in the background.
 */
export function initMixpanel(): void {
  if (!canUseMixpanel()) return;
  if (window.__mixpanel_initialized) return;
  // Ensure telemetry is allowed before initializing
  void ensureTelemetryStatus().then((enabled) => {
    if (!enabled) return;
    if (window.__mixpanel_initialized) return;
    mixpanel.init(MIXPANEL_TOKEN as string, { track_pageview: false });
    mixpanel.identify(mixpanel.get_distinct_id());
    window.__mixpanel_initialized = true;
  });
}

/**
 * Tracks a custom event with optional properties.
 *
 * Sends an event to Mixpanel with the given name and optional properties.
 * This is the low-level tracking function that all other tracking functions
 * use internally. Before tracking, it verifies:
 * 1. Mixpanel can be used (browser environment)
 * 2. Telemetry is enabled for this user
 * 3. Mixpanel is initialized (initializes if needed)
 *
 * If any check fails, the event is silently dropped (no error thrown).
 *
 * @param eventName - Name of the event to track. Should be a descriptive
 *   string that clearly identifies the action (e.g., "Button Clicked",
 *   "Page Viewed"). For consistency, prefer using MixpanelEvent enum values.
 * @param props - Optional object containing additional event properties.
 *   Properties provide context about the event (e.g., { buttonName: "Save",
 *   page: "Settings" }). All values must be serializable.
 *
 * @example
 * ```typescript
 * track("User Login", { method: "email", userId: "123" });
 * track(MixpanelEvent.PageView, { path: "/dashboard" });
 * ```
 */
export function track(
  eventName: string,
  props?: Record<string, unknown>,
): void {
  if (!canUseMixpanel()) return;
  if (
    typeof window !== "undefined" &&
    window.__mixpanel_telemetry_enabled === false
  ) {
    return;
  }
  if (!window.__mixpanel_initialized) {
    initMixpanel();
    return;
  }
  mixpanel.track(eventName, props);
}

/**
 * Tracks a typed event using the MixpanelEvent enum.
 *
 * Type-safe wrapper around the track() function that ensures only valid
 * event names from the MixpanelEvent enum are used. This helps prevent
 * typos and ensures consistency in event naming across the application.
 *
 * @param event - Event from the MixpanelEvent enum to track. Provides
 *   type safety and autocomplete support.
 * @param props - Optional event properties object. Same as track() function.
 *
 * @example
 * ```typescript
 * trackEvent(MixpanelEvent.PageView, { path: "/outline" });
 * trackEvent(MixpanelEvent.Navigation, { from: "/home", to: "/outline" });
 * ```
 */
export function trackEvent(event: MixpanelEvent, props?: MixpanelProps): void {
  track(event, props);
}

/**
 * Gets the current user's distinct ID from Mixpanel.
 *
 * Retrieves the unique identifier that Mixpanel uses to track users across
 * sessions. This ID is automatically generated by Mixpanel and persists
 * across browser sessions (stored in localStorage). It can be used to
 * identify users or correlate events.
 *
 * Before returning the ID, this function verifies:
 * 1. Mixpanel can be used (browser environment)
 * 2. Telemetry is enabled
 * 3. Mixpanel is initialized (initializes if needed)
 *
 * @returns The user's distinct ID string if available, undefined otherwise.
 *   Returns undefined if Mixpanel can't be used, telemetry is disabled, or
 *   initialization fails.
 *
 * @example
 * ```typescript
 * const userId = getDistinctId();
 * if (userId) {
 *   console.log("User ID:", userId);
 * }
 * ```
 */
export function getDistinctId(): string | undefined {
  if (!canUseMixpanel()) return undefined;
  if (
    typeof window !== "undefined" &&
    window.__mixpanel_telemetry_enabled === false
  ) {
    return undefined;
  }
  if (!window.__mixpanel_initialized) {
    initMixpanel();
    return undefined;
  }
  if (!window.__mixpanel_initialized) return undefined;
  return mixpanel.get_distinct_id();
}

/**
 * Identifies the current user with their anonymous distinct ID.
 *
 * Explicitly identifies the user in Mixpanel using their current distinct ID.
 * This is useful for ensuring user identity is set up correctly. The distinct
 * ID is the anonymous ID generated by Mixpanel (stored in localStorage).
 *
 * This function is typically called during app initialization or after user
 * actions that should be associated with the current session. It respects
 * telemetry preferences and only identifies if tracking is enabled.
 *
 * @remarks
 * This uses the anonymous distinct ID. For logged-in users, you may want to
 * use mixpanel.identify() with a user ID directly instead.
 */
export function identifyAnonymous(): void {
  if (!canUseMixpanel()) return;
  if (
    typeof window !== "undefined" &&
    window.__mixpanel_telemetry_enabled === false
  ) {
    return;
  }
  if (!window.__mixpanel_initialized) {
    initMixpanel();
    return;
  }
  mixpanel.identify(mixpanel.get_distinct_id());
}

export default {
  initMixpanel,
  track,
  trackEvent,
  getDistinctId,
  identifyAnonymous,
};
