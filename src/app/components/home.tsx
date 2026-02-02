/**
 * Home page component for the application.
 *
 * The main landing page that provides the primary user interface for creating
 * presentations. Features three tabs: Templates (template selection), Discover
 * (recent presentations), and Drafts (in-progress outlines). Includes a chat
 * input for starting new presentations with prompts and file uploads.
 */

"use client";

import ClaudeChatInput, {
  Icons,
  SendMessageResult,
} from "@/components/ui/claude-style-chat-input";
import type { ComponentProps } from "react";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  LanguageType,
  ToneType,
  VerbosityType,
} from "@/app/(presentation-generator)/utils/type";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";
import { usePresentationDataStore, useUploadStore } from "@/stores";
import { useLayout } from "@/app/(presentation-generator)/context/layout-context";
import TemplateSelection from "@/app/(presentation-generator)/outline/components/template-selection";
import { Template } from "@/app/(presentation-generator)/outline/types/index";
import type { OutlineSlide } from "@/app/(presentation-generator)/outline/types/index";
import {
  DashboardApi,
  DraftPresentationResponse,
  PresentationResponse,
} from "@/app/(presentation-generator)/services/api/dashboard";
import { useTemplateLayouts } from "@/app/(presentation-generator)/hooks/use-template-layouts";
import { createOutlineId } from "@/app/(presentation-generator)/outline/utils/outline-ids";

/**
 * Tab type for the home page tabs.
 * Determines which section is currently displayed.
 */
type TabType = "templates" | "discover" | "drafts";

/**
 * Slide data structure for presentation previews.
 * Used when rendering slide previews in the Discover section.
 */
type SlideData =
  | {
      layout?: string;
      layout_group?: string;
      index?: number;
      id?: string | null;
      content?: unknown;
      properties?: unknown;
    }
  | null
  | undefined;

/**
 * Props for the DiscoverSection component.
 *
 * @property presentations - Array of recent presentations to display.
 * @property loading - Whether presentations are currently being loaded.
 * @property renderSlideContent - Function to render slide preview content.
 * @property onNavigate - Callback when a presentation is clicked.
 * @property hasMoreFromServer - Whether more presentations are available from the server.
 * @property onLoadMoreFromServer - Callback to load more presentations.
 * @property loadingMore - Whether more presentations are currently being loaded.
 */
interface DiscoverSectionProps {
  presentations: PresentationResponse[];
  loading: boolean;
  renderSlideContent: (slide: SlideData, editable: boolean) => React.ReactNode;
  onNavigate: (id: string) => void;
  hasMoreFromServer?: boolean;
  onLoadMoreFromServer?: () => void;
  loadingMore?: boolean;
}

/**
 * Number of items to display per page in the Discover section.
 * Controls pagination for presentation previews.
 */
const ITEMS_PER_PAGE = 4;

/**
 * Maximum number of presentations to fetch per API request.
 * Used for pagination when loading presentations from the server.
 */
const PAGE_FETCH_LIMIT = 50;

/**
 * Discover section component for displaying recent presentations.
 *
 * Displays a grid of recent presentations with slide previews. Supports
 * pagination with "Load more" functionality. Shows loading skeletons while
 * fetching and an empty state when no presentations exist.
 *
 * @param presentations - Recent presentations to display.
 * @param loading - Loading state.
 * @param renderSlideContent - Function to render slide previews.
 * @param onNavigate - Navigation callback.
 * @param hasMoreFromServer - Whether more items are available.
 * @param onLoadMoreFromServer - Load more callback.
 * @param loadingMore - Loading more state.
 * @returns A grid of presentation previews with pagination controls.
 */
const DiscoverSection: React.FC<DiscoverSectionProps> = ({
  presentations,
  loading,
  renderSlideContent,
  onNavigate,
  hasMoreFromServer = false,
  onLoadMoreFromServer,
  loadingMore = false,
}) => {
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  const handleLoadMore = () => {
    const nextCount = displayCount + ITEMS_PER_PAGE;
    setDisplayCount(nextCount);
    if (
      onLoadMoreFromServer &&
      hasMoreFromServer &&
      nextCount > presentations.length &&
      !loadingMore
    ) {
      onLoadMoreFromServer();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-bg-200 rounded animate-pulse"></div>
          <div className="h-3 w-12 bg-bg-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-3 rounded-2xl border border-bg-200 bg-bg-100/80 animate-pulse"
            >
              <div className="aspect-video bg-bg-200 rounded-lg mb-3"></div>
              <div className="h-4 w-3/4 bg-bg-200 rounded mb-2"></div>
              <div className="h-3 w-16 bg-bg-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (presentations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-300">Recent Presentations</p>
          <span className="text-xs text-text-400">0 items</span>
        </div>
        <div className="text-center py-12 rounded-2xl border border-bg-200 bg-bg-100/70 shadow-sm">
          <svg
            className="w-10 h-10 mx-auto text-text-400 mb-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <p className="text-text-200 text-sm font-medium">
            No presentations yet
          </p>
          <p className="text-text-300 text-xs mt-1">
            Create your first presentation to see it here
          </p>
        </div>
      </div>
    );
  }

  const displayedPresentations = presentations.slice(0, displayCount);
  const hasMore = displayCount < presentations.length || hasMoreFromServer;
  const remainingCount = Math.max(0, presentations.length - displayCount);
  const loadMoreLabel =
    remainingCount > 0
      ? `Load more (${Math.min(ITEMS_PER_PAGE, remainingCount)} more)`
      : "Load more";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-300">Recent Presentations</p>
        <span className="text-xs text-text-400">
          {displayedPresentations.length} / {presentations.length} items
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedPresentations.map((presentation) => (
          <div
            key={presentation.id}
            onClick={() => onNavigate(presentation.id)}
            className="p-3 rounded-2xl border border-bg-200 bg-bg-100/80 hover:border-bg-300 hover:shadow-sm cursor-pointer transition-all duration-200"
          >
            {/* Slide preview */}
            <div className="relative overflow-hidden aspect-video rounded-lg border border-bg-200 bg-white mb-3 [&_*]:!max-w-none [&_*]:!max-h-none">
              <div className="absolute bg-transparent z-40 top-0 left-0 w-full h-full" />
              <div className="flex justify-center items-center origin-top-left w-[500%] h-[500%] transform-[scale(0.2)]">
                {renderSlideContent(presentation.slides?.[0] ?? null, false)}
              </div>
            </div>
            <p className="text-sm text-text-200 line-clamp-1 font-medium mb-1">
              {presentation.title}
            </p>
            <span className="text-xs text-text-400">
              {new Date(presentation.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="text-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-sm text-text-300 hover:text-text-200 bg-bg-100 hover:bg-bg-200 border border-bg-200 px-4 py-2 rounded-full transition-colors inline-flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {loadingMore ? "Loading..." : loadMoreLabel}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Props for the DraftSection component.
 *
 * @property drafts - Array of draft presentations to display.
 * @property loading - Whether drafts are currently being loaded.
 * @property onResume - Callback when a draft is clicked to resume editing.
 * @property hasMoreFromServer - Whether more drafts are available from the server.
 * @property onLoadMoreFromServer - Callback to load more drafts.
 * @property loadingMore - Whether more drafts are currently being loaded.
 */
interface DraftSectionProps {
  drafts: DraftPresentationResponse[];
  loading: boolean;
  onResume: (draft: DraftPresentationResponse) => void;
  hasMoreFromServer?: boolean;
  onLoadMoreFromServer?: () => void;
  loadingMore?: boolean;
}

/**
 * Draft section component for displaying in-progress outlines.
 *
 * Displays a grid of draft presentations (saved outlines) that can be resumed.
 * Shows outline preview text and creation dates. Supports pagination with
 * "Load more" functionality. Shows loading skeletons while fetching and an
 * empty state when no drafts exist.
 *
 * @param drafts - Draft presentations to display.
 * @param loading - Loading state.
 * @param onResume - Resume callback.
 * @param hasMoreFromServer - Whether more items are available.
 * @param onLoadMoreFromServer - Load more callback.
 * @param loadingMore - Loading more state.
 * @returns A grid of draft previews with pagination controls.
 */
const DraftSection: React.FC<DraftSectionProps> = ({
  drafts,
  loading,
  onResume,
  hasMoreFromServer = false,
  onLoadMoreFromServer,
  loadingMore = false,
}) => {
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  const handleLoadMore = () => {
    const nextCount = displayCount + ITEMS_PER_PAGE;
    setDisplayCount(nextCount);
    if (
      onLoadMoreFromServer &&
      hasMoreFromServer &&
      nextCount > drafts.length &&
      !loadingMore
    ) {
      onLoadMoreFromServer();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-bg-200 rounded animate-pulse"></div>
          <div className="h-3 w-12 bg-bg-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-3 rounded-2xl border border-bg-200 bg-bg-100/80 animate-pulse"
            >
              <div className="aspect-video bg-bg-200 rounded-lg mb-3"></div>
              <div className="h-4 w-3/4 bg-bg-200 rounded mb-2"></div>
              <div className="h-3 w-16 bg-bg-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-300">Drafts</p>
          <span className="text-xs text-text-400">0 items</span>
        </div>
        <div className="text-center py-12 rounded-2xl border border-bg-200 bg-bg-100/70 shadow-sm">
          <svg
            className="w-10 h-10 mx-auto text-text-400 mb-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p className="text-text-200 text-sm font-medium">No drafts yet</p>
          <p className="text-text-300 text-xs mt-1">
            In-progress outlines will appear here
          </p>
        </div>
      </div>
    );
  }

  const displayedDrafts = drafts.slice(0, displayCount);
  const hasMore = displayCount < drafts.length || hasMoreFromServer;
  const remainingCount = Math.max(0, drafts.length - displayCount);
  const loadMoreLabel =
    remainingCount > 0
      ? `Load more (${Math.min(ITEMS_PER_PAGE, remainingCount)} more)`
      : "Load more";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-300">Drafts</p>
        <span className="text-xs text-text-400">
          {displayedDrafts.length} / {drafts.length} items
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedDrafts.map((draft) => {
          const outlinePreview =
            draft.outlines?.slides?.[0]?.content || "Saved draft outline";
          return (
            <div
              key={draft.id}
              onClick={() => onResume(draft)}
              className="p-3 rounded-2xl border border-bg-200 bg-bg-100/80 hover:border-bg-300 hover:shadow-sm cursor-pointer transition-all duration-200"
            >
              <div className="aspect-video rounded-lg border border-bg-200 bg-bg-0/60 mb-3 p-3 flex items-center">
                <p className="text-sm text-text-300 line-clamp-4">
                  {outlinePreview}
                </p>
              </div>
              <p className="text-sm text-text-200 line-clamp-1 font-medium mb-1">
                {draft.title || "Untitled"}
              </p>
              <span className="text-xs text-text-400">
                {new Date(draft.created_at).toLocaleDateString()}
              </span>
            </div>
          );
        })}
      </div>
      {hasMore && (
        <div className="text-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-sm text-text-300 hover:text-text-200 bg-bg-100 hover:bg-bg-200 border border-bg-200 px-4 py-2 rounded-full transition-colors inline-flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {loadingMore ? "Loading..." : loadMoreLabel}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Home page component.
 *
 * Main landing page providing:
 * - Chat input for starting new presentations with prompts and file uploads
 * - Template selection tab for choosing presentation templates
 * - Discover tab for browsing recent presentations
 * - Drafts tab for resuming in-progress outlines
 *
 * Handles presentation generation flow by extracting text from uploaded files,
 * setting up configuration, and navigating to the outline page. Manages state
 * for templates, presentations, and drafts with pagination support.
 *
 * @returns The complete home page with tabs and content sections.
 */
export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Zustand stores
  const selectedTemplateId = usePresentationDataStore((state) => state.selectedTemplateId);
  const setSelectedTemplateId = usePresentationDataStore((state) => state.setSelectedTemplateId);
  const setPresentationId = usePresentationDataStore((state) => state.setPresentationId);
  const setOutlines = usePresentationDataStore((state) => state.setOutlines);
  const clearOutlines = usePresentationDataStore((state) => state.clearOutlines);
  const setPendingUpload = useUploadStore((state) => state.setPendingUpload);
  const clearPendingUpload = useUploadStore((state) => state.clearPendingUpload);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("templates");
  const [presentations, setPresentations] = useState<PresentationResponse[]>([]);
  const [presentationsLoading, setPresentationsLoading] = useState(false);
  const [presentationsCursor, setPresentationsCursor] = useState<string | null>(
    null,
  );
  const [presentationsLoadingMore, setPresentationsLoadingMore] =
    useState(false);
  const [drafts, setDrafts] = useState<DraftPresentationResponse[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [draftsCursor, setDraftsCursor] = useState<string | null>(null);
  const [draftsLoadingMore, setDraftsLoadingMore] = useState(false);
  
  const { getAllTemplateIDs, getTemplateSetting, getLayoutsByTemplateID } =
    useLayout();
  const { renderSlideContent } = useTemplateLayouts();

  // Fetch presentations when discover tab is active
  useEffect(() => {
    if (activeTab === "discover" && presentations.length === 0) {
      setPresentationsLoading(true);
      DashboardApi.getPresentations({ limit: PAGE_FETCH_LIMIT })
        .then((data) => {
          setPresentations(data.items);
          setPresentationsCursor(data.next_cursor);
        })
        .catch(() => {
          setPresentations([]);
          setPresentationsCursor(null);
        })
        .finally(() => setPresentationsLoading(false));
    }
  }, [activeTab, presentations.length]);

  useEffect(() => {
    if (activeTab === "drafts" && drafts.length === 0) {
      setDraftsLoading(true);
      DashboardApi.getDraftPresentations({ limit: PAGE_FETCH_LIMIT })
        .then((data) => {
          setDrafts(data.items);
          setDraftsCursor(data.next_cursor);
        })
        .catch(() => {
          setDrafts([]);
          setDraftsCursor(null);
        })
        .finally(() => setDraftsLoading(false));
    }
  }, [activeTab, drafts.length]);

  const loadMorePresentations = async () => {
    if (!presentationsCursor || presentationsLoadingMore) return;
    setPresentationsLoadingMore(true);
    try {
      const data = await DashboardApi.getPresentations({
        limit: PAGE_FETCH_LIMIT,
        cursor: presentationsCursor,
      });
      setPresentations((prev) => [...prev, ...data.items]);
      setPresentationsCursor(data.next_cursor);
    } catch {
      setPresentationsCursor(null);
    } finally {
      setPresentationsLoadingMore(false);
    }
  };

  const loadMoreDrafts = async () => {
    if (!draftsCursor || draftsLoadingMore) return;
    setDraftsLoadingMore(true);
    try {
      const data = await DashboardApi.getDraftPresentations({
        limit: PAGE_FETCH_LIMIT,
        cursor: draftsCursor,
      });
      setDrafts((prev) => [...prev, ...data.items]);
      setDraftsCursor(data.next_cursor);
    } catch {
      setDraftsCursor(null);
    } finally {
      setDraftsLoadingMore(false);
    }
  };

  const handleResumeDraft = (draft: DraftPresentationResponse) => {
    clearPendingUpload();
    clearOutlines();
    setPresentationId(draft.id);

    const outlineSlides = draft.outlines?.slides;
    if (Array.isArray(outlineSlides) && outlineSlides.length > 0) {
      const mapped: OutlineSlide[] = outlineSlides.map((slide) => ({
        id: createOutlineId(),
        content: typeof slide.content === "string" ? slide.content : "",
      }));
      setOutlines(mapped);
    }

    trackEvent(MixpanelEvent.Navigation, {
      from: pathname,
      to: "/outline",
    });
    router.push(`/outline?id=${draft.id}`);
  };

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

  const selectedTemplate = useMemo(() => {
    if (!templates.length) return null;
    if (!selectedTemplateId) return null;
    return (
      templates.find((template) => template.id === selectedTemplateId) || null
    );
  }, [templates, selectedTemplateId]);

  useEffect(() => {
    if (templates.length === 0) return;
    // Skip if already has a valid selection
    if (selectedTemplateId && templates.some((t) => t.id === selectedTemplateId)) {
      return;
    }
    const defaultTemplate =
      templates.find((template) => template.default) || templates[0];
    if (defaultTemplate) {
      setSelectedTemplateId(defaultTemplate.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, setSelectedTemplateId]);

  const handleSendMessage: ComponentProps<
    typeof ClaudeChatInput
  >["onSendMessage"] = async ({
    message,
    files,
    pastedContent,
    isThinkingEnabled,
  }) => {
    const trimmedMessage = message.trim();
    const pastedTexts = pastedContent
      .map((item) => item.content.trim())
      .filter((content) => content.length > 0);
    const promptParts: string[] = [];
    if (trimmedMessage) {
      promptParts.push(trimmedMessage);
    }
    if (pastedTexts.length > 0) {
      promptParts.push(pastedTexts.join("\n\n"));
    }
    const prompt = promptParts.join("\n\n");
    const attachedFiles = files.map((file) => file.file);

    if (!prompt && attachedFiles.length === 0) {
      toast.error("Please add a prompt or attach files");
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const verbosity = isThinkingEnabled
      ? VerbosityType.Text_Heavy
      : VerbosityType.Standard;

    try {
      // Extract text from files in browser (dynamic import to avoid SSR issues with pdfjs)
      let documentContent: string | undefined;
      let fileMetadata:
        | Array<{ name: string; size: number; type: string }>
        | undefined;

      if (attachedFiles.length > 0) {
        const {
          extractTextFromFiles,
          combineExtractedContent,
          getFileMetadata,
        } =
          await import("@/app/(presentation-generator)/utils/document-extractor");
        const extractedDocs = await extractTextFromFiles(attachedFiles);
        documentContent = combineExtractedContent(extractedDocs);
        fileMetadata = getFileMetadata(extractedDocs);
      }
      const trimmedPrompt = prompt.trim();
      const trimmedDocumentContent = documentContent?.trim() || "";
      if (!trimmedPrompt && !trimmedDocumentContent) {
        toast.error("No content extracted", {
          description: "Please add a prompt or upload a readable file.",
        });
        return;
      }
      if (!trimmedDocumentContent) {
        documentContent = undefined;
        fileMetadata = undefined;
      }

      setPendingUpload({
        config: {
          slides: "10",
          language: LanguageType.English,
          prompt,
          tone: ToneType.Default,
          verbosity,
          instructions: "",
          includeTableOfContents: false,
          includeTitleSlide: false,
          webSearch: false,
        },
        documentContent,
        fileMetadata,
      });
      clearOutlines();
      trackEvent(MixpanelEvent.Navigation, {
        from: pathname,
        to: "/outline",
      });
      router.push("/outline");
      return { navigating: true } satisfies SendMessageResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Presentation generation failed";
      toast.error("Error", { description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="claude-theme min-h-screen w-full bg-bg-0 dark:bg-bg-0 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-10 sm:pt-28 sm:pb-12 md:pt-36 md:pb-14 lg:pt-48 lg:pb-16 font-sans text-text-100 transition-colors duration-200">
      {/* Greeting Section */}
      <div className="w-full max-w-2xl md:max-w-3xl mb-6 sm:mb-8 md:mb-10 text-center animate-stagger-1">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-normal text-text-200 tracking-tight leading-[1.25]">
          <span className="inline-flex items-center justify-center gap-2 sm:gap-3">
            <Icons.Logo className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            Let's brew your pitch deck.
          </span>
        </h1>
      </div>

      <div className="animate-stagger-2 w-full max-w-2xl md:max-w-3xl">
        <ClaudeChatInput onSendMessage={handleSendMessage} />
      </div>

      {/* Tab Badges */}
      <div className="flex justify-center gap-2 sm:gap-3 mt-5 sm:mt-6 animate-stagger-3">
        <button
          onClick={() => setActiveTab("templates")}
          aria-pressed={activeTab === "templates"}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-sm rounded-full border transition-all duration-200 shadow-sm backdrop-blur ${
            activeTab === "templates"
              ? "bg-accent/15 text-accent border-accent/40 shadow-accent/20 ring-1 ring-accent/20"
              : "text-text-300 bg-bg-100/80 border-bg-200 hover:bg-bg-200/80 hover:text-text-200 hover:border-bg-300"
          }`}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Templates
        </button>
        <button
          onClick={() => setActiveTab("discover")}
          aria-pressed={activeTab === "discover"}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-sm rounded-full border transition-all duration-200 shadow-sm backdrop-blur ${
            activeTab === "discover"
              ? "bg-accent/15 text-accent border-accent/40 shadow-accent/20 ring-1 ring-accent/20"
              : "text-text-300 bg-bg-100/80 border-bg-200 hover:bg-bg-200/80 hover:text-text-200 hover:border-bg-300"
          }`}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
          Discover
        </button>
        <button
          onClick={() => setActiveTab("drafts")}
          aria-pressed={activeTab === "drafts"}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-sm rounded-full border transition-all duration-200 shadow-sm backdrop-blur ${
            activeTab === "drafts"
              ? "bg-accent/15 text-accent border-accent/40 shadow-accent/20 ring-1 ring-accent/20"
              : "text-text-300 bg-bg-100/80 border-bg-200 hover:bg-bg-200/80 hover:text-text-200 hover:border-bg-300"
          }`}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          Drafts
        </button>
      </div>

      {/* Tab Content */}
      <div className="w-full max-w-2xl md:max-w-3xl mt-5 sm:mt-6 animate-stagger-4">
        {activeTab === "templates" ? (
          <TemplateSelection
            selectedTemplate={selectedTemplate}
            onSelectTemplate={(template) => {
              setSelectedTemplateId(template.id);
            }}
          />
        ) : activeTab === "discover" ? (
          <DiscoverSection
            presentations={presentations}
            loading={presentationsLoading}
            renderSlideContent={renderSlideContent}
            onNavigate={(id) => router.push(`/presentation?id=${id}`)}
            hasMoreFromServer={Boolean(presentationsCursor)}
            onLoadMoreFromServer={loadMorePresentations}
            loadingMore={presentationsLoadingMore}
          />
        ) : (
          <DraftSection
            drafts={drafts}
            loading={draftsLoading}
            onResume={handleResumeDraft}
            hasMoreFromServer={Boolean(draftsCursor)}
            onLoadMoreFromServer={loadMoreDrafts}
            loadingMore={draftsLoadingMore}
          />
        )}
      </div>
    </div>
  );
}
