/**
 * React hook for presentation navigation and URL synchronization.
 *
 * Manages slide navigation, fullscreen mode, and URL state synchronization
 * for the presentation editor. Handles slide selection, scrolling, and
 * presentation mode transitions.
 */

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Hook for managing presentation navigation and URL state.
 *
 * Provides functions for navigating between slides, toggling fullscreen mode,
 * and synchronizing slide selection with URL parameters. Handles both edit
 * and presentation modes.
 *
 * @param presentationId - Unique identifier of the presentation.
 * @param selectedSlide - Currently selected slide index (0-based).
 * @param setSelectedSlide - Callback to update selected slide index.
 * @param setIsFullscreen - Callback to update fullscreen state.
 * @returns Object containing navigation state and handler functions:
 *   - isPresentMode: Whether presentation is in present mode.
 *   - stream: Stream parameter from URL.
 *   - currentSlide: Current slide index from URL or selected slide.
 *   - handleSlideClick: Function to navigate to a slide by index.
 *   - toggleFullscreen: Function to toggle fullscreen mode.
 *   - handlePresentExit: Function to exit presentation mode.
 *   - handleSlideChange: Function to change slide in presentation mode.
 */
export const usePresentationNavigation = (
  presentationId: string,
  selectedSlide: number,
  setSelectedSlide: (slide: number) => void,
  setIsFullscreen: (fullscreen: boolean) => void
) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isPresentMode = searchParams.get("mode") === "present";
  const stream = searchParams.get("stream");
  const currentSlide = parseInt(
    searchParams.get("slide") || `${selectedSlide}` || "0"
  );

  const handleSlideClick = useCallback((index: number) => {
    const slideElement = document.getElementById(`slide-${index}`);
    if (slideElement) {
      slideElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setSelectedSlide(index);
    }
  }, [setSelectedSlide]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, [setIsFullscreen]);

  const handlePresentExit = useCallback(() => {
    setIsFullscreen(false);
    router.push(`/presentation?id=${presentationId}`);
  }, [router, presentationId, setIsFullscreen]);

  const handleSlideChange = useCallback((newSlide: number, presentationData: any) => {
    if (newSlide >= 0 && newSlide < presentationData?.slides.length!) {
      setSelectedSlide(newSlide);
      router.push(
        `/presentation?id=${presentationId}&mode=present&slide=${newSlide}`,
        { scroll: false }
      );
    }
  }, [router, presentationId, setSelectedSlide]);

  return {
    isPresentMode,
    stream,
    currentSlide,
    handleSlideClick,
    toggleFullscreen,
    handlePresentExit,
    handleSlideChange,
  };
}; 