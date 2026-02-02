/**
 * Main outline page component for editing presentation outlines.
 *
 * This is the primary component for the outline editing page. It orchestrates
 * outline management, streaming, template selection, and presentation generation.
 *
 * Key responsibilities:
 * - Loads presentation data from server or URL params
 * - Manages outline streaming from LLM via SSE
 * - Handles pending uploads from previous page
 * - Provides auto-save functionality for outline changes
 * - Manages template selection and layout configuration
 * - Coordinates presentation generation workflow
 * - Handles scroll position preservation during streaming
 *
 * The component integrates multiple hooks for state management:
 * - useOutlineStreaming: Real-time outline generation via SSE
 * - usePendingUpload: Processes file uploads and creates presentations
 * - useOutlineManagement: CRUD operations for outline slides
 * - usePresentationGeneration: Triggers presentation generation from outlines
 *
 * Auto-save is debounced (1.5s) and saves outlines, template selection, and
 * upload configuration to the database. Scroll position is preserved when
 * streaming completes to maintain user context.
 */

"use client";

import React, {
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, FileText } from "lucide-react";
import PptFlowLayout from "../../components/ppt-flow-layout";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";
import OutlineContent from "./outline-content";
import EmptyStateView from "./empty-state-view";
import GenerateButton from "./generate-button";

import { Template } from "../types/index";
import type { OutlineSlide } from "../types/index";
import { useOutlineStreaming } from "../hooks/use-outline-streaming";
import { useOutlineManagement } from "../hooks/use-outline-management";
import { usePresentationGeneration } from "../hooks/use-presentation-generation";
import { usePendingUpload } from "../hooks/use-pending-upload";
import { useLayout } from "../../context/layout-context";
import { usePresentationDataStore, useUploadStore } from "@/stores";
import { DashboardApi } from "../../services/api/dashboard";
import { createOutlineId } from "../utils/outline-ids";
import { PresentationGenerationApi } from "../../services/api/presentation-generation";
import { LanguageType, ToneType, VerbosityType } from "../../utils/type";

/**
 * File metadata structure for uploaded files.
 *
 * Used to display file information in the UI (name, size, type).
 *
 * @property name - Original filename of the uploaded file.
 * @property size - File size in bytes.
 * @property type - MIME type of the file (e.g., "application/pdf").
 */
type FileMetadata = {
  name: string;
  size: number;
  type: string;
};

/**
 * Formats file size in bytes to human-readable string.
 *
 * Converts bytes to appropriate unit (B, KB, MB, GB) with one decimal place.
 * Handles edge cases like zero or undefined values.
 *
 * @param bytes - File size in bytes.
 * @returns Formatted string like "1.5 MB" or "0 B".
 *
 * @example
 * ```typescript
 * formatFileSize(1536) // Returns "1.5 KB"
 * formatFileSize(1048576) // Returns "1.0 MB"
 * ```
 */
const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Props for the OutlinePage component.
 *
 * @property initialPresentationId - Presentation ID passed from server component.
 *   Used to initialize presentation data without waiting for URL params.
 * @property initialTemplateId - Template ID passed from server component.
 *   Used to pre-select template without waiting for URL params.
 */
interface OutlinePageProps {
  initialPresentationId?: string;
  initialTemplateId?: string;
}

/**
 * Main outline page component.
 *
 * Orchestrates the entire outline editing experience including data loading,
 * streaming, template management, and presentation generation. Manages complex
 * state synchronization between multiple hooks and Zustand stores.
 *
 * @param props - Component props with optional initial IDs from server.
 * @returns JSX element containing the complete outline editing interface.
 */
const OutlinePage: React.FC<OutlinePageProps> = ({
  initialPresentationId,
  initialTemplateId,
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Zustand store selectors for presentation data
  // These provide reactive state updates when store values change
  const presentation_id = usePresentationDataStore((state) => state.presentation_id);
  const outlines = usePresentationDataStore((state) => state.outlines);
  const selectedTemplateId = usePresentationDataStore((state) => state.selectedTemplateId);
  const setPresentationId = usePresentationDataStore((state) => state.setPresentationId);
  const setOutlines = usePresentationDataStore((state) => state.setOutlines);
  const setSelectedTemplateId = usePresentationDataStore((state) => state.setSelectedTemplateId);
  
  // Upload configuration from upload store
  // Contains user settings like slide count, language, tone, etc.
  const uploadConfig = useUploadStore((state) => state.config);
  const setUploadConfig = useUploadStore((state) => state.setConfig);
  
  // Layout context provides template and layout information
  const { getAllTemplateIDs, getTemplateSetting, getLayoutsByTemplateID } =
    useLayout();

  // Local state for file metadata display
  // Loaded from presentation data and shown in UI badges
  const [fileMetadata, setFileMetadata] = useState<FileMetadata[]>([]);

  /**
   * Memoized list of available templates.
   *
   * Transforms template IDs into Template objects with metadata and layouts.
   * Each template includes its ID, name, description, ordering mode, default
   * flag, and associated slide layouts.
   *
   * Recomputes when template IDs or settings change.
   */
  const templates = useMemo(() => {
    const templateIds = getAllTemplateIDs();
    return templateIds.map((templateId) => {
      const settings = getTemplateSetting(templateId);
      return {
        id: templateId,
        name: templateId,
        description:
          settings?.description || `${templateId} presentation templates`,
        ordered: settings?.ordered || false,
        default: settings?.default || false,
        slides: getLayoutsByTemplateID(templateId),
      } satisfies Template;
    });
  }, [getAllTemplateIDs, getTemplateSetting, getLayoutsByTemplateID]);

  /**
   * Memoized default template selection.
   *
   * Returns the template marked as default, or the first template if none
   * is marked default. Used as fallback when no template is selected.
   */
  const defaultTemplate = useMemo(() => {
    if (!templates.length) return null;
    return templates.find((template) => template.default) || templates[0];
  }, [templates]);

  /**
   * Memoized currently selected template.
   *
   * Returns the template matching selectedTemplateId, or falls back to
   * defaultTemplate if no selection exists. Ensures a template is always
   * available for generation.
   */
  const selectedTemplate = useMemo(() => {
    if (!templates.length) return null;
    if (!selectedTemplateId) return defaultTemplate;
    return (
      templates.find((template) => template.id === selectedTemplateId) ||
      defaultTemplate
    );
  }, [templates, selectedTemplateId, defaultTemplate]);

  // Custom hooks for managing outline workflow
  // Each hook handles a specific aspect of the outline editing experience
  
  // Manages real-time outline streaming from LLM via SSE
  const streamState = useOutlineStreaming(presentation_id);
  
  // Handles pending file uploads from previous page
  // Creates presentation and clears pending state
  const pendingState = usePendingUpload(presentation_id);
  
  // Provides CRUD operations for outline slides
  // Handles reordering, adding, updating, and deleting slides
  const {
    commitReorder,
    handleAddSlide,
    handleUpdateSlide,
    handleDeleteSlide,
  } = useOutlineManagement(outlines);
  
  // Manages presentation generation workflow
  // Validates inputs, calls prepare API, and navigates to presentation page
  const { loadingState, handleSubmit } = usePresentationGeneration(
    presentation_id,
    outlines,
    selectedTemplate,
    () => {}, // setActiveTab callback (not used in outline page)
  );
  
  // Refs for managing auto-save debouncing and scroll position
  // autosaveTimerRef: Stores timeout ID for debounced save
  // autosaveHashRef: Tracks last saved payload to avoid duplicate saves
  // autosaveErrorRef: Throttles error toasts (max once per 10s)
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveHashRef = useRef<string>("");
  const autosaveErrorRef = useRef<number>(0);
  
  // Refs for scroll position management during streaming
  // outlineScrollRef: Reference to scrollable container element
  // scrollStateRef: Stores scroll position before streaming starts
  // wasStreamingRef: Tracks previous streaming state for transition detection
  const outlineScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollStateRef = useRef({ top: 0, height: 0, client: 0 });
  const wasStreamingRef = useRef(false);

  /**
   * Handles scroll events to track scroll position.
   *
   * Stores current scroll position, container height, and client height.
   * Used to restore scroll position when streaming completes, maintaining
   * user's viewing context.
   */
  const handleOutlineScroll = () => {
    const container = outlineScrollRef.current;
    if (!container) return;
    scrollStateRef.current = {
      top: container.scrollTop,
      height: container.scrollHeight,
      client: container.clientHeight,
    };
  };

  /**
   * Effect: Initialize presentation data from server or URL params.
   *
   * Loads presentation data when:
   * - Initial presentation ID is provided from server, OR
   * - URL search params contain presentation ID
   *
   * Fetches presentation data including:
   * - Existing outlines (if any)
   * - Selected template
   * - Upload configuration (slide count, language, tone, etc.)
   * - File metadata for display
   *
   * Only runs once when presentation_id is not yet set to avoid duplicate loads.
   */
  useEffect(() => {
    const queryId = initialPresentationId || searchParams.get("id");
    if (!queryId || presentation_id) return;

    setPresentationId(queryId);
    DashboardApi.getPresentation(queryId)
      .then((response) => {
        const data = response as {
          outlines?: { slides?: Array<{ content?: unknown }> };
          layout?: { templateId?: string; name?: string; ordered?: boolean };
          n_slides?: number | null;
          language?: string | null;
          tone?: string | null;
          verbosity?: string | null;
          instructions?: string | null;
          include_table_of_contents?: boolean | null;
          include_title_slide?: boolean | null;
          web_search?: boolean | null;
          file_metadata?: FileMetadata[] | null;
        } | null;
        const outlineSlides = data?.outlines?.slides;
          if (Array.isArray(outlineSlides) && outlineSlides.length > 0) {
            const mapped: OutlineSlide[] = outlineSlides.map((slide) => ({
              id: createOutlineId(),
              content: typeof slide.content === "string" ? slide.content : "",
            }));
            setOutlines(mapped);
          }
          const templateId = data?.layout?.templateId || data?.layout?.name;
          if (templateId) {
            setSelectedTemplateId(templateId);
          }
          // Store file metadata for display
          if (data?.file_metadata && Array.isArray(data.file_metadata)) {
            setFileMetadata(data.file_metadata);
          }
          if (data) {
            const languageValue = Object.values(LanguageType).includes(
              data.language as LanguageType,
            )
              ? (data.language as LanguageType)
              : null;
            const toneValue = Object.values(ToneType).includes(
              data.tone as ToneType,
            )
              ? (data.tone as ToneType)
              : ToneType.Default;
            const verbosityValue = Object.values(VerbosityType).includes(
              data.verbosity as VerbosityType,
            )
              ? (data.verbosity as VerbosityType)
              : VerbosityType.Standard;
            setUploadConfig({
              slides: data.n_slides ? String(data.n_slides) : null,
              language: languageValue,
              prompt: "",
              tone: toneValue,
              verbosity: verbosityValue,
              instructions: data.instructions ?? "",
              includeTableOfContents:
                data.include_table_of_contents ?? false,
              includeTitleSlide: data.include_title_slide ?? true,
              webSearch: data.web_search ?? false,
            });
          }
      })
      .catch(() => {
        // ignore - Outline streaming will handle if available
      });
  }, [presentation_id, searchParams, initialPresentationId, setPresentationId, setOutlines, setSelectedTemplateId, setUploadConfig]);

  /**
   * Effect: Auto-select template when templates are loaded.
   *
   * Selects a template in this priority order:
   * 1. Keep existing selection if valid
   * 2. Use initialTemplateId from server if available
   * 3. Use default template (marked as default or first template)
   *
   * Ensures a template is always selected for generation. Only runs when
   * templates are loaded and no valid selection exists.
   */
  useEffect(() => {
    if (!templates.length) return;
    // Skip if already has a valid selection
    if (selectedTemplateId && templates.some((t) => t.id === selectedTemplateId)) {
      return;
    }
    // Use initialTemplateId from server if available
    if (initialTemplateId && templates.some((t) => t.id === initialTemplateId)) {
      setSelectedTemplateId(initialTemplateId);
      return;
    }
    if (defaultTemplate) {
      setSelectedTemplateId(defaultTemplate.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, defaultTemplate, initialTemplateId, setSelectedTemplateId]);

  /**
   * Effect: Auto-save outline changes to database.
   *
   * Debounced auto-save (1.5s delay) that saves:
   * - Outline slides content
   * - Selected template/layout
   * - Upload configuration (slide count, language, tone, etc.)
   *
   * Skips save when:
   * - No presentation ID
   * - Currently loading or streaming (to avoid conflicts)
   * - No outlines exist
   * - Payload hasn't changed (hash comparison)
   *
   * Error handling throttles error toasts to max once per 10 seconds to
   * avoid spam during network issues.
   */
  useEffect(() => {
    if (!presentation_id) return;
    if (pendingState.isLoading || streamState.isStreaming) return;
    if (!outlines.length) return;

    // Build payload with current outline and configuration state
    const outlinesPayload = outlines.map((outline) => ({
      content: outline.content,
    }));
    const slideCount =
      uploadConfig?.slides && Number.isFinite(Number(uploadConfig.slides))
        ? Number.parseInt(uploadConfig.slides, 10)
        : undefined;
    const layoutPayload = selectedTemplate
      ? {
          templateId: selectedTemplate.id,
          name: selectedTemplate.id,
          ordered: selectedTemplate.ordered,
        }
      : undefined;
    const payload = {
      id: presentation_id,
      title: outlines[0]?.content ?? undefined,
      outlines: { slides: outlinesPayload },
      layout: layoutPayload,
      n_slides: slideCount,
      language: uploadConfig?.language ?? undefined,
      tone: uploadConfig?.tone ?? undefined,
      verbosity: uploadConfig?.verbosity ?? undefined,
      instructions: uploadConfig?.instructions ?? undefined,
      include_table_of_contents:
        uploadConfig?.includeTableOfContents ?? undefined,
      include_title_slide: uploadConfig?.includeTitleSlide ?? undefined,
      web_search: uploadConfig?.webSearch ?? undefined,
    };

    // Check if payload has changed to avoid unnecessary saves
    const payloadHash = JSON.stringify(payload);
    if (payloadHash === autosaveHashRef.current) return;

    // Clear existing timer and set new debounced save
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(() => {
      PresentationGenerationApi.updatePresentationContent(payload)
        .then(() => {
          // Update hash to track successful save
          autosaveHashRef.current = payloadHash;
        })
        .catch((error) => {
          // Throttle error toasts (max once per 10 seconds)
          const now = Date.now();
          if (now - autosaveErrorRef.current > 10000) {
            autosaveErrorRef.current = now;
            const message =
              error instanceof Error
                ? error.message
                : "Auto-save failed.";
            toast.error("Auto-save failed", { description: message });
          }
        });
    }, 1500);

    // Cleanup: clear timer on unmount or dependency change
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [
    outlines,
    uploadConfig,
    presentation_id,
    pendingState.isLoading,
    streamState.isStreaming,
    selectedTemplate,
  ]);

  const outlineLoading = pendingState.isLoading
    ? true
    : presentation_id
      ? streamState.isLoading
      : false;
  const outlineStreaming = presentation_id ? streamState.isStreaming : false;
  const outlineActiveIndex = presentation_id
    ? streamState.activeSlideIndex
    : null;
  const outlineHighestIndex = presentation_id
    ? streamState.highestActiveIndex
    : -1;
  const outlineStatusMessage = presentation_id ? streamState.statusMessage : "";
  const expectedSlideCount =
    uploadConfig?.slides && Number.isFinite(Number(uploadConfig.slides))
      ? Math.max(1, Number.parseInt(uploadConfig.slides, 10))
      : outlines.length > 0
        ? outlines.length
        : 10;

  const getLoadingStatusMessage = (): string => {
    if (loadingState.isLoading) return loadingState.message;
    return pendingState.message || outlineStatusMessage || "";
  };

  useEffect(() => {
    handleOutlineScroll();
  }, [presentation_id]);

  /**
   * Layout effect: Preserve scroll position when streaming completes.
   *
   * When streaming starts, saves current scroll position. When streaming ends,
   * restores scroll position intelligently:
   * - If user was near bottom: Keep them near bottom (for watching new content)
   * - Otherwise: Restore exact scroll position
   *
   * Uses useLayoutEffect to run synchronously before paint, preventing
   * visible scroll jumps.
   */
  useLayoutEffect(() => {
    const container = outlineScrollRef.current;
    const wasStreaming = wasStreamingRef.current;
    wasStreamingRef.current = outlineStreaming;
    if (!container) return;

    // When streaming starts, save current scroll state
    if (outlineStreaming) {
      scrollStateRef.current = {
        top: container.scrollTop,
        height: container.scrollHeight,
        client: container.clientHeight,
      };
      return;
    }

    // When streaming ends, restore scroll position intelligently
    if (wasStreaming && !outlineStreaming) {
      const { top, height, client } = scrollStateRef.current;
      const distanceFromBottom = height - (top + client);
      const newMax = container.scrollHeight - container.clientHeight;
      
      // If user was near bottom (within 80px), keep them near bottom
      // This allows watching new content as it streams in
      const nearBottom = distanceFromBottom <= 80;
      const nextTop = nearBottom
        ? Math.max(0, newMax - distanceFromBottom)
        : Math.min(top, Math.max(0, newMax));
      
      // Only update if position changed significantly (avoid micro-adjustments)
      if (Math.abs(container.scrollTop - nextTop) > 1) {
        container.scrollTop = nextTop;
      }
    }
  }, [outlineStreaming, outlines.length]);

  // Show empty state if no presentation and no pending upload
  if (!presentation_id && !pendingState.hasPending) {
    return <EmptyStateView />;
  }

  return (
    <PptFlowLayout
      topSlot={
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-stagger-1">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.35em] text-text-400">
              Outline
            </p>
            <h1 className="text-2xl sm:text-3xl font-serif font-normal text-text-200">
              Refine your narrative
            </h1>
            <p className="text-sm text-text-300">
              Arrange slides, then choose a template to generate.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-bg-200 bg-bg-100/80 backdrop-blur-sm px-3 py-1.5 text-xs text-text-300 shadow-sm hover:border-bg-300 transition-colors">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {outlines.length} slides
            </span>
            {selectedTemplate?.name && (
              <span className="inline-flex items-center gap-2 rounded-full border border-bg-200 bg-bg-100/80 backdrop-blur-sm px-3 py-1.5 text-xs text-text-300 shadow-sm hover:border-bg-300 transition-colors">
                Template: {selectedTemplate.name}
              </span>
            )}
            {fileMetadata.length > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-bg-200 bg-bg-100/80 backdrop-blur-sm px-3 py-1.5 text-xs text-text-300 shadow-sm hover:border-bg-300 transition-colors">
                <FileText className="w-3.5 h-3.5" />
                {fileMetadata.length === 1
                  ? `${fileMetadata[0].name.length > 20 ? fileMetadata[0].name.slice(0, 20) + "..." : fileMetadata[0].name} (${formatFileSize(fileMetadata[0].size)})`
                  : `${fileMetadata.length} files (${formatFileSize(fileMetadata.reduce((acc, f) => acc + f.size, 0))})`}
              </span>
            )}
            <button
              onClick={() => {
                trackEvent(
                  MixpanelEvent.Outline_Generate_Presentation_Button_Clicked,
                  { pathname },
                );
                handleSubmit();
              }}
              disabled={
                loadingState.isLoading ||
                streamState.isLoading ||
                streamState.isStreaming ||
                outlines.length === 0
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-accent text-white px-4 py-1.5 text-xs font-medium shadow-sm hover:bg-accent-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate
            </button>
          </div>
        </div>
      }
      contentClassName="gap-6"
    >
      <div
        ref={outlineScrollRef}
        onScroll={handleOutlineScroll}
        className="flex-1 min-h-0 rounded-2xl border border-bg-200 bg-bg-100/80 p-4 sm:p-5 shadow-sm overflow-y-auto custom_scrollbar animate-stagger-2"
      >
        <OutlineContent
          outlines={outlines}
          isLoading={outlineLoading}
          isStreaming={outlineStreaming}
          activeSlideIndex={outlineActiveIndex}
          highestActiveIndex={outlineHighestIndex}
          expectedSlideCount={expectedSlideCount}
          onReorder={commitReorder}
          onUpdateSlide={handleUpdateSlide}
          onDeleteSlide={handleDeleteSlide}
          onAddSlide={handleAddSlide}
          statusMessage={getLoadingStatusMessage()}
        />
      </div>

      <div className="pt-4 border-t border-bg-200/80 animate-stagger-3">
        <GenerateButton
          outlineCount={outlines.length}
          loadingState={loadingState}
          streamState={streamState}
          selectedTemplate={selectedTemplate}
          onSubmit={handleSubmit}
        />
      </div>
    </PptFlowLayout>
  );
};

export default OutlinePage;
