/**
 * Generate button component for initiating presentation generation.
 *
 * This component renders a primary action button that triggers presentation
 * generation from outlines. It handles multiple states including loading,
 * streaming, and validation states. The button is disabled when:
 * - Outlines are being loaded or streamed
 * - No template is selected
 * - No outlines exist
 *
 * The component tracks analytics events when clicked and displays appropriate
 * loading states and messages based on the current operation status.
 *
 * Button states:
 * - Default: "Generate Presentation" (when template selected and outlines exist)
 * - Loading: Shows spinner and loading message
 * - Disabled: When no template selected or no outlines
 * - Streaming: Shows "Loading..." during outline streaming
 */

import React from "react";
import { usePathname } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";
import { Button } from "@/components/ui/button";
import { LoadingState, Template } from "../types/index";

/**
 * Props for the GenerateButton component.
 *
 * @property loadingState - Current loading state from presentation generation
 *   hook, containing message and isLoading flag.
 * @property streamState - State from outline streaming hook, indicating if
 *   outlines are currently being streamed or loaded.
 * @property selectedTemplate - Currently selected template for generation, or
 *   null if none selected.
 * @property onSubmit - Callback function invoked when button is clicked.
 *   Should trigger presentation generation workflow.
 * @property outlineCount - Number of outline slides available. Button is
 *   disabled when count is 0.
 */
interface GenerateButtonProps {
  loadingState: LoadingState;
  streamState: { isStreaming: boolean; isLoading: boolean };
  selectedTemplate: Template | null;
  onSubmit: () => void;
  outlineCount: number;
}

/**
 * Generate button component for presentation generation.
 *
 * Renders a full-width button that triggers presentation generation. Handles
 * multiple disabled states, loading indicators, and analytics tracking.
 *
 * @param props - Component props containing state and callbacks.
 * @returns JSX element containing the generate button with appropriate state.
 */
const GenerateButton: React.FC<GenerateButtonProps> = ({
  loadingState,
  streamState,
  selectedTemplate,
  outlineCount,
  onSubmit,
}) => {
  const pathname = usePathname();

  // Determine if button should be disabled based on current state
  // Disabled when: loading, streaming, or no outlines available
  const isDisabled =
    loadingState.isLoading ||
    streamState.isLoading ||
    streamState.isStreaming ||
    outlineCount === 0;

  /**
   * Gets the appropriate button text based on current state.
   *
   * Returns different messages for loading states, missing template, or default
   * generation action. Prioritizes loading messages over template selection.
   *
   * @returns String message to display on the button.
   */
  const getButtonText = () => {
    if (loadingState.isLoading) return loadingState.message;
    if (streamState.isLoading || streamState.isStreaming) return "Loading...";
    if (!selectedTemplate) return "Select a Template";
    return "Generate Presentation";
  };

  // Determine if button should show loading spinner
  // True when any loading or streaming operation is in progress
  const isLoading =
    loadingState.isLoading || streamState.isLoading || streamState.isStreaming;

  return (
    <Button
      disabled={isDisabled}
      onClick={() => {
        // Track analytics events only when not loading/streaming
        // Different events for template selection vs generation
        if (!streamState.isLoading && !streamState.isStreaming) {
          if (!selectedTemplate) {
            // User clicked but no template selected - track template selection prompt
            trackEvent(MixpanelEvent.Outline_Select_Template_Button_Clicked, {
              pathname,
            });
          } else {
            // User clicked with template selected - track generation start
            trackEvent(
              MixpanelEvent.Outline_Generate_Presentation_Button_Clicked,
              { pathname },
            );
          }
        }
        // Always call onSubmit - it handles validation internally
        onSubmit();
      }}
      className="w-full rounded-2xl bg-accent text-white text-base sm:text-lg py-4 sm:py-6 font-sans font-semibold shadow-md shadow-accent/20 transition-all duration-200 hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/30 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : (
        <Sparkles className="w-5 h-5 mr-2" />
      )}
      {getButtonText()}
    </Button>
  );
};

export default GenerateButton;
