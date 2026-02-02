/**
 * React hook for presentation generation workflow.
 *
 * Manages the presentation generation process, including input validation,
 * API calls, loading states, and navigation. Handles the transition from
 * outline editing to presentation generation and tracks analytics events.
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { usePresentationDataStore } from "@/stores";
import { PresentationGenerationApi } from "../../services/api/presentation-generation";
import { Template, LoadingState, TABS, OutlineSlide } from "../types/index";
import { MixpanelEvent, trackEvent } from "@/utils/mixpanel";

/**
 * Default loading state for presentation generation.
 */
const DEFAULT_LOADING_STATE: LoadingState = {
  message: "",
  isLoading: false,
  showProgress: false,
  duration: 0,
};

/**
 * Hook for managing presentation generation workflow.
 *
 * Provides functions for validating inputs, generating presentations from
 * outlines, and handling loading states. Validates that outlines and templates
 * are selected before generation, calls the API, and navigates to the
 * presentation page on success.
 *
 * @param presentationId - Unique identifier of the presentation, or null.
 * @param outlines - Array of outline slides to generate from, or null.
 * @param selectedTemplate - Selected template for generation, or null.
 * @param setActiveTab - Callback to switch active tab (e.g., to layouts tab).
 * @returns Object containing isSubmitting flag, loadingState, and
 *   generatePresentation function.
 */
export const usePresentationGeneration = (
  presentationId: string | null,
  outlines: OutlineSlide[] | null,
  selectedTemplate: Template | null,
  setActiveTab: (tab: string) => void,
) => {
  const clearPresentationData = usePresentationDataStore((state) => state.clearPresentationData);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Keep loadingState for backward compatibility with GenerateButton
  const [loadingState, setLoadingState] = useState<LoadingState>(
    DEFAULT_LOADING_STATE,
  );

  const validateInputs = useCallback(() => {
    if (!outlines || outlines.length === 0) {
      toast.error("No Outlines", {
        description:
          "Please wait for outlines to load before generating presentation",
      });
      return false;
    }

    if (!selectedTemplate) {
      toast.error("Select Layout Group", {
        description:
          "Please select a layout group before generating presentation",
      });
      return false;
    }
    if (!selectedTemplate.slides?.length) {
      toast.error("No Slide Schema found", {
        description: "Please select a Group before generating presentation",
      });
      return false;
    }

    const slides = (selectedTemplate.slides || []) as Array<{
      id?: string;
      json_schema?: unknown;
    }>;
    const getSchemaKeys = (schema: unknown) =>
      schema && typeof schema === "object"
        ? Object.keys(schema as Record<string, unknown>)
        : [];
    const emptySchemaSlides = slides.filter(
      (slide) => getSchemaKeys(slide.json_schema).length === 0,
    );
    if (emptySchemaSlides.length > 0) {
      toast.error("Slide schema missing", {
        description:
          "Template schema is missing. Please reselect a template or refresh.",
      });
      return false;
    }

    return true;
  }, [outlines, selectedTemplate]);

  const prepareLayoutData = useCallback(() => {
    if (!selectedTemplate) return null;
    return {
      name: selectedTemplate.name,
      ordered: selectedTemplate.ordered,
      slides: selectedTemplate.slides,
    };
  }, [selectedTemplate]);

  const handleSubmit = useCallback(async () => {
    if (!selectedTemplate) {
      setActiveTab(TABS.LAYOUTS);
      return;
    }
    if (!validateInputs()) return;
    if (!outlines) return;
    if (isSubmitting) return;

    const layoutData = prepareLayoutData();
    if (!layoutData) return;

    setIsSubmitting(true);
    setLoadingState({
      message: "Preparing...",
      isLoading: true,
      showProgress: false,
      duration: 0,
    });

    try {
      trackEvent(MixpanelEvent.Presentation_Prepare_API_Call);
      const outlinesPayload = outlines.map((outline) => ({
        content: outline.content,
      }));

      // Wait for prepare API to complete before navigating
      // This ensures layout data is saved to DB before streaming starts
      if (!presentationId) {
        throw new Error("Presentation ID is required");
      }
      const response = await PresentationGenerationApi.presentationPrepare({
        presentation_id: presentationId,
        outlines: outlinesPayload,
        layout: layoutData,
      });

      if (response) {
        clearPresentationData();
        router.replace(`/presentation?id=${presentationId}&stream=true`);
      }
    } catch (error) {
      console.error("Error In Presentation Generation(prepare).", error);
      toast.error("Generation Error", {
        description:
          error instanceof Error ? error.message : "Error In Presentation Generation(prepare).",
      });
    } finally {
      setIsSubmitting(false);
      setLoadingState(DEFAULT_LOADING_STATE);
    }
  }, [
    validateInputs,
    prepareLayoutData,
    presentationId,
    outlines,
    clearPresentationData,
    router,
    selectedTemplate,
    isSubmitting,
    setActiveTab,
  ]);

  return { loadingState, handleSubmit };
};
