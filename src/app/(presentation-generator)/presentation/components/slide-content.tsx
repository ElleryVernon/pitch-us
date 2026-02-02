import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Loader2,
  PlusIcon,
  Trash2,
  WandSparkles,
  StickyNote,
  SendHorizontal,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PresentationGenerationApi } from "../../services/api/presentation-generation";
import ToolTip from "@/components/tool-tip";
import { useTemplateLayouts } from "../../hooks/use-template-layouts";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";
const NewSlide = dynamic(() => import("../../components/new-slide"), {
  ssr: false,
});
import { useUndoRedoStore, usePresentationUIStore, usePresentationDataStore } from "@/stores";
import { cn } from "@/lib/utils";
import ScaledSlidePreview from "../../components/scaled-slide-preview";

import { Slide } from "@/types/slide";

interface SlideContentProps {
  slide: Slide;
  index: number;
  presentationId: string;
}

const SlideContent = ({ slide, index, presentationId }: SlideContentProps) => {
  const addToHistory = useUndoRedoStore((state) => state.addToHistory);
  const presentationData = usePresentationDataStore((state) => state.presentationData);
  const updateSlide = usePresentationDataStore((state) => state.updateSlide);
  const deletePresentationSlide = usePresentationDataStore((state) => state.deletePresentationSlide);
  const isStreaming = usePresentationUIStore((state) => state.isStreaming);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNewSlideSelection, setShowNewSlideSelection] = useState(false);
  const prevSlideCountRef = useRef(0);

  // Use the centralized group layouts hook
  const { renderSlideContent, loading } = useTemplateLayouts();
  const pathname = usePathname();

  const handleSubmit = async () => {
    const element = document.getElementById(
      `slide-${slide.index}-prompt`,
    ) as HTMLInputElement;
    const value = element?.value;
    if (!value?.trim()) {
      toast.error("Please enter a prompt before submitting");
      return;
    }
    setIsUpdating(true);

    try {
      trackEvent(MixpanelEvent.Slide_Edit_API_Call);
      if (!slide.id) {
        toast.error("Slide ID is required");
        return;
      }
      const response = await PresentationGenerationApi.editSlide(
        slide.id,
        value,
      );

      if (response) {
        updateSlide(slide.index, response as Slide);
        toast.success("Slide updated successfully");
      }
    } catch (error) {
      console.error("Error in slide editing:", error);
      toast.error("Error in slide editing.", {
        description: error instanceof Error ? error.message : "Error in slide editing.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const onDeleteSlide = async () => {
    try {
      trackEvent(MixpanelEvent.Slide_Delete_API_Call);
      // Add current state to history
      if (presentationData?.slides) {
        addToHistory(presentationData.slides, "DELETE_SLIDE");
      }
      deletePresentationSlide(slide.index);
    } catch (error) {
      console.error("Error deleting slide:", error);
      toast.error("Error deleting slide.", {
        description: error instanceof Error ? error.message : "Error deleting slide.",
      });
    }
  };

  // Optional auto-scroll when new slides are appended (skip initial init)
  useEffect(() => {
    const currentCount = presentationData?.slides?.length ?? 0;
    const prevCount = prevSlideCountRef.current;
    prevSlideCountRef.current = currentCount;
    if (!isStreaming) return;
    if (currentCount <= prevCount) return;
    if (prevCount === 0) return;
    const lastSlideIndex = currentCount - 1;
    const slideElement = document.getElementById(`slide-${lastSlideIndex}`);
    if (slideElement) {
      slideElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [presentationData?.slides?.length, isStreaming]);

  // Memoized slide content rendering to prevent unnecessary re-renders
  const slideContent = useMemo(() => {
    return renderSlideContent(slide, isStreaming ? false : true); // Enable edit mode for main content
  }, [renderSlideContent, slide, isStreaming]);

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      id={`slide-${index}`}
      className="w-full max-w-content main-slide flex flex-col items-center mb-8 justify-center relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slide number badge - minimal, top-left inside the card */}
      <div className="absolute top-4 left-4 z-20">
        <span className="text-xs font-medium text-text-400 tabular-nums">
          {index + 1}
        </span>
      </div>

      {/* Main slide content */}
      <div
        data-layout={slide.layout}
        data-group={slide.layout_group}
        className={cn(
          "w-full rounded-xl border bg-bg-100 overflow-hidden transition-all duration-200 relative",
          isHovered && !isStreaming ? "border-bg-300" : "border-bg-200",
        )}
      >
        {/* render slides - wrapped in ScaledSlidePreview for consistent scaling */}
        {loading ? (
          <div className="flex flex-col bg-bg-100 aspect-video items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-text-400" />
          </div>
        ) : (
          <ScaledSlidePreview interactive={!isStreaming}>
            {slideContent}
          </ScaledSlidePreview>
        )}

        {/* Toss-style generating indicator - bottom right */}
        {isStreaming && (
          <div className="absolute right-4 bottom-4 z-20 pointer-events-none">
            <div
              className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-lg shadow-black/[0.08] border border-black/[0.04] dark:border-white/[0.08]"
              style={{
                animation: "toss-subtle-pulse 2.4s ease-in-out infinite",
              }}
            >
              {/* 3-dot loading animation */}
              <div className="flex items-center gap-1.5">
                <span className="toss-loading-dot w-2 h-2 rounded-full bg-neutral-800 dark:bg-neutral-200" />
                <span className="toss-loading-dot w-2 h-2 rounded-full bg-neutral-800 dark:bg-neutral-200" />
                <span className="toss-loading-dot w-2 h-2 rounded-full bg-neutral-800 dark:bg-neutral-200" />
              </div>
              <span className="text-base font-medium text-neutral-700 dark:text-neutral-200">
                Generating
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating action bar - bottom center, visible on hover */}
      {!isStreaming && !loading && (
        <div
          className={cn(
            "absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 transition-all duration-200 hidden md:flex",
            isHovered
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-1 pointer-events-none",
          )}
        >
          <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-bg-100 border border-bg-200 shadow-sm">
            {/* AI Edit button */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-text-200 hover:bg-bg-200/60 transition-colors">
                  <WandSparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Edit</span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="center"
                sideOffset={8}
                className="w-[320px] sm:w-[380px] z-30 border-bg-200 bg-bg-100 p-4"
              >
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                >
                  <Textarea
                    id={`slide-${slide.index}-prompt`}
                    placeholder="Describe how you want to change this slide..."
                    className="w-full min-h-[80px] max-h-[120px] p-3 text-sm border border-bg-200 rounded-lg focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/50 focus-visible:ring-offset-0 bg-bg-100 text-text-200 resize-none"
                    disabled={isUpdating}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-text-400">Enter to submit</p>
                    <button
                      disabled={isUpdating}
                      type="submit"
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        isUpdating
                          ? "bg-bg-200 text-text-400 cursor-not-allowed"
                          : "bg-accent hover:bg-accent-hover text-white",
                      )}
                      onClick={() => {
                        trackEvent(
                          MixpanelEvent.Slide_Update_From_Prompt_Button_Clicked,
                          { pathname },
                        );
                      }}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Updating
                        </>
                      ) : (
                        <>
                          <SendHorizontal className="w-3.5 h-3.5" />
                          Update
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </PopoverContent>
            </Popover>

            {/* Add slide button */}
            <ToolTip content="Add slide">
              <button
                onClick={() => {
                  trackEvent(MixpanelEvent.Slide_Add_New_Slide_Button_Clicked, {
                    pathname,
                  });
                  setShowNewSlideSelection(true);
                }}
                className="p-1.5 rounded-md text-text-400 hover:text-text-200 hover:bg-bg-200/60 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </ToolTip>

            {/* Speaker notes button - only if notes exist */}
            {slide?.speaker_note && (
              <Popover>
                <PopoverTrigger asChild>
                  <ToolTip content="Speaker notes">
                    <button className="p-1.5 rounded-md text-text-400 hover:text-text-200 hover:bg-bg-200/60 transition-colors">
                      <StickyNote className="w-4 h-4" />
                    </button>
                  </ToolTip>
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  align="center"
                  sideOffset={8}
                  className="w-[300px] z-30 border-bg-200 bg-bg-100 p-4"
                >
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-text-200">
                      Speaker Notes
                    </p>
                    <div className="text-sm text-text-300 whitespace-pre-wrap max-h-48 overflow-auto">
                      {slide.speaker_note}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Delete button */}
            <ToolTip content="Delete">
              <button
                onClick={() => {
                  trackEvent(MixpanelEvent.Slide_Delete_Slide_Button_Clicked, {
                    pathname,
                  });
                  onDeleteSlide();
                }}
                className="p-1.5 rounded-md text-text-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </ToolTip>
          </div>
        </div>
      )}

      {/* New slide selection panel */}
      {showNewSlideSelection && !loading && slide.layout && (
        <div className="w-full mt-4">
          <NewSlide
            index={index}
            templateID={`${slide.layout.split(":")[0]}`}
            setShowNewSlideSelection={setShowNewSlideSelection}
            presentationId={presentationId}
          />
        </div>
      )}

      {/* Mobile action buttons - compact */}
      {!isStreaming && !loading && (
        <div className="md:hidden flex items-center justify-center gap-1.5 mt-3">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-white">
                <WandSparkles className="w-3.5 h-3.5" />
                Edit
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-[90vw] max-w-[340px] p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className="space-y-3"
              >
                <Textarea
                  id={`slide-${slide.index}-prompt-mobile`}
                  placeholder="Describe changes..."
                  className="w-full min-h-[80px] p-3 text-sm border border-bg-200 rounded-lg"
                  disabled={isUpdating}
                />
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full py-2 rounded-lg bg-accent text-white text-sm font-medium"
                >
                  {isUpdating ? "Updating..." : "Update"}
                </button>
              </form>
            </PopoverContent>
          </Popover>
          <button
            onClick={() => setShowNewSlideSelection(true)}
            className="p-2 rounded-lg border border-bg-200 text-text-400 hover:text-text-300"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDeleteSlide}
            className="p-2 rounded-lg border border-bg-200 text-text-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SlideContent;
