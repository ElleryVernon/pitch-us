"use client";
import React, { useEffect, useState, useCallback } from "react";
import { usePresentationUIStore, usePresentationDataStore } from "@/stores";
import PresentationMode from "../../components/presentation-mode";
import SidePanel from "./side-panel";
import SlideContent from "./slide-content";
import PresentationActions from "./presentation-actions";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";
import { AlertCircle } from "lucide-react";
import PptFlowLayout from "../../components/ppt-flow-layout";
import {
  usePresentationStreaming,
  usePresentationData,
  usePresentationNavigation,
  useAutoSave,
  useScrollSync,
  useKeyboardShortcuts,
} from "../hooks";
import { PresentationPageProps } from "../types";
import { useLayout } from "../../context/layout-context";
import { useFontLoader } from "../../hooks/use-font-loader";
import { usePresentationUndoRedo } from "../hooks/presentation-undo-redo";
import FloatingNavigator from "./floating-navigator";
import KeyboardShortcutsModal from "./keyboard-shortcuts-modal";
import OnboardingHints from "./onboarding-hints";

const PresentationPage: React.FC<PresentationPageProps> = ({
  presentation_id,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { getCustomTemplateFonts } = useLayout();

  // Zustand stores
  const presentationData = usePresentationDataStore((state) => state.presentationData);
  const isStreaming = usePresentationUIStore((state) => state.isStreaming);

  // Check if we already have data for this presentation
  const hasExistingData =
    presentationData?.id === presentation_id &&
    presentationData?.slides &&
    presentationData.slides.length > 0;

  // State management - skip loading if we already have the data
  const [loading, setLoading] = useState(!hasExistingData);
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  // Scroll sync - tracks which slide is currently visible in viewport
  const slideCount = presentationData?.slides?.length || 0;
  const { visibleSlideIndex, scrollToSlide, isScrolling } =
    useScrollSync(slideCount);

  // Auto-save functionality
  const { isSaving, lastSavedAt } = useAutoSave({
    debounceMs: 2000,
    enabled: !!presentationData && !isStreaming,
  });

  // Undo/Redo functionality
  const { onUndo, onRedo } = usePresentationUndoRedo();

  // Custom hooks
  const { fetchUserSlides } = usePresentationData(
    presentation_id,
    setLoading,
    setError,
  );

  const {
    isPresentMode,
    stream,
    handleSlideClick: originalHandleSlideClick,
    toggleFullscreen,
    handlePresentExit,
    handleSlideChange,
  } = usePresentationNavigation(
    presentation_id,
    selectedSlide,
    setSelectedSlide,
    setIsFullscreen,
  );

  // Enhanced slide click handler that also scrolls to the slide
  const handleSlideClick = useCallback(
    (index: number) => {
      originalHandleSlideClick(index);
      scrollToSlide(index);
    },
    [originalHandleSlideClick, scrollToSlide],
  );

  // Keyboard navigation helpers
  const goToPrevSlide = useCallback(() => {
    if (visibleSlideIndex > 0) {
      handleSlideClick(visibleSlideIndex - 1);
    }
  }, [visibleSlideIndex, handleSlideClick]);

  const goToNextSlide = useCallback(() => {
    if (
      presentationData?.slides &&
      visibleSlideIndex < presentationData.slides.length - 1
    ) {
      handleSlideClick(visibleSlideIndex + 1);
    }
  }, [visibleSlideIndex, presentationData?.slides, handleSlideClick]);

  const enterPresentMode = useCallback(() => {
    const to = `?id=${presentation_id}&mode=present&slide=${visibleSlideIndex}`;
    trackEvent(MixpanelEvent.Navigation, { from: pathname, to });
    router.push(to);
  }, [presentation_id, visibleSlideIndex, pathname, router]);

  // Keyboard shortcuts
  const { isShortcutsModalOpen, setIsShortcutsModalOpen, shortcuts } =
    useKeyboardShortcuts({
      onUndo,
      onRedo,
      onPrevSlide: goToPrevSlide,
      onNextSlide: goToNextSlide,
      onPresentMode: enterPresentMode,
      enabled: !isPresentMode && !loading,
    });

  // Sync selectedSlide with visibleSlideIndex when scrolling (not user-initiated click)
  useEffect(() => {
    if (!isScrolling && visibleSlideIndex !== selectedSlide) {
      setSelectedSlide(visibleSlideIndex);
    }
  }, [visibleSlideIndex, isScrolling, selectedSlide]);

  // Initialize streaming
  usePresentationStreaming(
    presentation_id,
    stream,
    setLoading,
    setError,
    fetchUserSlides,
    hasExistingData,
  );

  const onSlideChange = (newSlide: number) => {
    handleSlideChange(newSlide, presentationData);
  };

  useEffect(() => {
    if (
      !loading &&
      !isStreaming &&
      presentationData?.slides &&
      presentationData?.slides.length > 0
    ) {
      const layout = presentationData?.slides[0]?.layout;
      if (layout && layout.includes("custom-")) {
        const pid = layout.split(":")[0].split("custom-")[1];
        if (pid) {
          const fonts = getCustomTemplateFonts(pid);
          useFontLoader(fonts || []);
        }
      }
    }
  }, [presentationData, loading, isStreaming, getCustomTemplateFonts]);

  // Presentation Mode View
  if (isPresentMode) {
    return (
      <PresentationMode
        slides={presentationData?.slides!}
        currentSlide={selectedSlide}
        isFullscreen={isFullscreen}
        onFullscreenToggle={toggleFullscreen}
        onExit={handlePresentExit}
        onSlideChange={onSlideChange}
      />
    );
  }

  if (error) {
    return (
      <PptFlowLayout
        topSlot={
          <div className="space-y-2 animate-stagger-1">
            <p className="text-[11px] uppercase tracking-[0.35em] text-text-400">
              Presentation
            </p>
            <h1 className="text-2xl sm:text-3xl font-serif font-normal text-text-200">
              Unable to load
            </h1>
            <p className="text-sm text-text-300">
              We couldn&apos;t load your presentation. Please try again.
            </p>
          </div>
        }
        contentClassName="gap-6"
      >
        <div
          className="rounded-2xl border border-bg-200 bg-bg-100/80 p-6 shadow-sm flex flex-col items-center text-center gap-4 animate-stagger-2"
          role="alert"
        >
          <AlertCircle className="w-12 h-12 text-red-400" />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-text-200">
              Something went wrong
            </h2>
            <p className="text-sm text-text-300">
              Check your connection and refresh the page.
            </p>
          </div>
          <Button
            onClick={() => {
              trackEvent(
                MixpanelEvent.PresentationPage_Refresh_Page_Button_Clicked,
                { pathname },
              );
              window.location.reload();
            }}
            variant="outline"
            className="rounded-full"
          >
            Refresh Page
          </Button>
        </div>
      </PptFlowLayout>
    );
  }

  return (
    <PptFlowLayout
      topSlot={
        <PresentationActions
          presentation_id={presentation_id}
          currentSlide={visibleSlideIndex}
          isSaving={isSaving}
          lastSavedAt={lastSavedAt}
        />
      }
      contentClassName="gap-4"
      narrow={false}
      wrapperClassName="lg:px-page-x"
    >
      <div className="flex flex-1 relative gap-4">
        <SidePanel
          selectedSlide={selectedSlide}
          visibleSlideIndex={visibleSlideIndex}
          onSlideClick={handleSlideClick}
          loading={loading}
          isMobilePanelOpen={isMobilePanelOpen}
          setIsMobilePanelOpen={setIsMobilePanelOpen}
        />

        <div className="flex-1 h-[calc(100vh-200px)] overflow-y-auto custom_scrollbar rounded-xl border border-bg-200 bg-bg-100">
          <div
            id="presentation-slides-wrapper"
            className="mx-auto flex flex-col items-center overflow-hidden justify-center p-4 sm:p-8"
          >
            {presentationData &&
              presentationData.slides &&
              presentationData.slides.length > 0 &&
              presentationData.slides.map((slide, index) => (
                <SlideContent
                  key={`${slide.type}-${index}-${slide.index}`}
                  slide={slide}
                  index={index}
                  presentationId={presentation_id}
                />
              ))}
          </div>
        </div>

        {/* Floating Navigator for quick slide navigation */}
        {!loading &&
          presentationData?.slides &&
          presentationData.slides.length > 1 && (
            <FloatingNavigator
              currentSlide={visibleSlideIndex}
              totalSlides={presentationData.slides.length}
              onNavigate={handleSlideClick}
            />
          )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        shortcuts={shortcuts}
      />

      {/* Onboarding hints for new users */}
      <OnboardingHints
        enabled={!loading && !isStreaming && !!presentationData?.slides?.length}
      />
    </PptFlowLayout>
  );
};

export default PresentationPage;
