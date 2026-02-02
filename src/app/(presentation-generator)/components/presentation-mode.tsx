/**
 * Full-screen presentation mode component for slide viewing.
 *
 * This component provides a presentation-style viewing experience similar to
 * PowerPoint or Google Slides presentation mode. It displays slides in full-screen
 * with navigation controls and keyboard shortcuts.
 *
 * Features:
 * - Full-screen black background for focus
 * - Keyboard navigation (arrow keys, space, escape)
 * - Click navigation (left/right thirds of screen)
 * - Fullscreen toggle (F key or button)
 * - Slide counter display
 * - Smooth transitions between slides
 * - Controls hidden in fullscreen mode
 *
 * Keyboard shortcuts:
 * - Arrow Right/Down/Space: Next slide
 * - Arrow Left/Up: Previous slide
 * - Escape: Exit presentation (or toggle fullscreen if already fullscreen)
 * - F: Toggle fullscreen
 *
 * Click navigation:
 * - Left third of screen: Previous slide
 * - Right third of screen: Next slide
 * - Center third: No action (prevents accidental navigation)
 */

"use client";
import React, { useCallback, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slide } from "@/types/slide";
import { useTemplateLayouts } from "../hooks/use-template-layouts";
import ScaledSlidePreview from "./scaled-slide-preview";

/**
 * Props for the PresentationMode component.
 *
 * @property slides - Array of slide objects to display.
 * @property currentSlide - Zero-based index of the currently displayed slide.
 * @property isFullscreen - Whether the presentation is in fullscreen mode.
 *   Controls visibility of navigation controls.
 * @property onFullscreenToggle - Callback invoked when fullscreen toggle is triggered.
 * @property onExit - Callback invoked when user exits presentation mode.
 * @property onSlideChange - Callback invoked when slide navigation occurs.
 *   Receives the new slide index (zero-based).
 */
interface PresentationModeProps {
  slides: Slide[];
  currentSlide: number;

  isFullscreen: boolean;
  onFullscreenToggle: () => void;
  onExit: () => void;
  onSlideChange: (slideNumber: number) => void;
}

/**
 * Presentation mode component.
 *
 * Renders a full-screen presentation view with keyboard and click navigation.
 * Displays the current slide centered on screen with navigation controls.
 *
 * @param props - Component props containing slides, current index, and callbacks.
 * @returns JSX element containing the full-screen presentation view.
 */
const PresentationMode: React.FC<PresentationModeProps> = ({
  slides,
  currentSlide,

  isFullscreen,
  onFullscreenToggle,
  onExit,
  onSlideChange,
}) => {
  const { renderSlideContent } = useTemplateLayouts();
  
  /**
   * Handles keyboard input for slide navigation.
   *
   * Processes keyboard events for presentation navigation:
   * - Arrow Right/Down/Space: Navigate to next slide
   * - Arrow Left/Up: Navigate to previous slide
   * - Escape: Exit presentation mode
   * - F: Toggle fullscreen mode
   *
   * Prevents default browser behavior for navigation keys to avoid scrolling.
   *
   * @param event - Keyboard event from keydown listener.
   */
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      event.preventDefault(); // Prevent default scroll behavior

      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
        case " ": // Space key
          if (currentSlide < slides.length - 1) {
            onSlideChange(currentSlide + 1);
          }
          break;
        case "ArrowLeft":
        case "ArrowUp":
          if (currentSlide > 0) {
            onSlideChange(currentSlide - 1);
          }
          break;
        case "Escape":
          onExit();
          break;
        case "f":
        case "F":
          onFullscreenToggle();
          break;
      }
    },
    [currentSlide, slides.length, onSlideChange, onExit, onFullscreenToggle],
  );

  /**
   * Effect: Set up keyboard event listeners.
   *
   * Adds keydown listener for slide navigation. Prevents default behavior
   * for arrow keys and space to avoid browser scrolling. Cleans up listener
   * on unmount.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for arrow keys and space
      if (
        ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", " "].includes(e.key)
      ) {
        e.preventDefault();
      }
      handleKeyPress(e);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyPress]);

  /**
   * Handles click events on slide area for navigation.
   *
   * Divides screen into thirds:
   * - Left third: Navigate to previous slide
   * - Right third: Navigate to next slide
   * - Center third: No action
   *
   * Ignores clicks on control buttons to prevent accidental navigation.
   *
   * @param e - Mouse click event.
   */
  const handleSlideClick = (e: React.MouseEvent) => {
    // Don't trigger navigation if clicking on controls
    if ((e.target as HTMLElement).closest(".presentation-controls")) {
      return;
    }

    const clickX = e.clientX;
    const windowWidth = window.innerWidth;

    if (clickX < windowWidth / 3) {
      if (currentSlide > 0) {
        onSlideChange(currentSlide - 1);
      }
    } else if (clickX > (windowWidth * 2) / 3) {
      if (currentSlide < slides.length - 1) {
        onSlideChange(currentSlide + 1);
      }
    }
  };

  /**
   * Effect: Handle Escape key in fullscreen mode.
   *
   * When in fullscreen mode, Escape key toggles fullscreen instead of
   * exiting presentation. This provides better UX for fullscreen viewing.
   */
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        onFullscreenToggle(); // Just toggle fullscreen, don't exit presentation
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [isFullscreen, onFullscreenToggle]);

  return (
    <div
      className="fixed inset-0 bg-black flex flex-col"
      tabIndex={0}
      onClick={handleSlideClick}
    >
      {/* Controls - Only show when not in fullscreen */}
      {!isFullscreen && (
        <>
          <div className="presentation-controls absolute top-4 right-4 flex items-center gap-2 z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onFullscreenToggle();
              }}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onExit();
              }}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="presentation-controls absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onSlideChange(currentSlide - 1);
              }}
              disabled={currentSlide === 0}
              className="text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-white">
              {currentSlide + 1} / {slides.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onSlideChange(currentSlide + 1);
              }}
              disabled={currentSlide === slides.length - 1}
              className="text-white hover:bg-white/20"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </>
      )}

      {/* Current Slide */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        <ScaledSlidePreview
          mode="contain"
          className="rounded-sm shadow-lg bg-white"
        >
          {slides[currentSlide] &&
            renderSlideContent(slides[currentSlide], false)}
        </ScaledSlidePreview>
      </div>
    </div>
  );
};

export default PresentationMode;
