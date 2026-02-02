/**
 * React hook for synchronizing scroll position with visible slide index.
 *
 * Uses Intersection Observer API to detect which slide is currently most
 * visible in the viewport and updates the selected slide index accordingly.
 * Provides smooth scrolling to specific slides and tracks scrolling state.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Options for configuring scroll synchronization.
 *
 * @property slideSelector - CSS selector for slide elements. Defaults to
 *   "[id^='slide-']".
 * @property containerSelector - CSS selector for the scroll container.
 *   Defaults to "#presentation-slides-wrapper".
 * @property threshold - Minimum intersection ratio for a slide to be
 *   considered visible. Defaults to 0.5.
 * @property rootMargin - Margin around the root for intersection calculation.
 *   Defaults to "-20% 0px -20% 0px".
 */
interface UseScrollSyncOptions {
  slideSelector?: string;
  containerSelector?: string;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Return value from useScrollSync hook.
 *
 * @property visibleSlideIndex - Index of the slide currently most visible
 *   in the viewport (0-based).
 * @property scrollToSlide - Function to scroll to a specific slide by index.
 * @property isScrolling - Whether a scroll animation is currently in progress.
 */
interface UseScrollSyncReturn {
  visibleSlideIndex: number;
  scrollToSlide: (index: number) => void;
  isScrolling: boolean;
}

/**
 * Hook for synchronizing scroll position with visible slide index.
 *
 * Sets up an Intersection Observer to track which slides are visible in
 * the viewport and determines the most visible slide. Provides a function
 * to programmatically scroll to specific slides with smooth animation.
 * Updates the visible slide index in real-time as the user scrolls.
 *
 * @param slideCount - Total number of slides in the presentation.
 * @param options - Configuration options for scroll synchronization.
 * @returns Object with visibleSlideIndex, scrollToSlide function, and
 *   isScrolling flag.
 */
export const useScrollSync = (
  slideCount: number,
  options: UseScrollSyncOptions = {},
): UseScrollSyncReturn => {
  const {
    slideSelector = "[id^='slide-']",
    containerSelector = "#presentation-slides-wrapper",
    threshold = 0.5,
    rootMargin = "-20% 0px -20% 0px",
  } = options;

  const [visibleSlideIndex, setVisibleSlideIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityMap = useRef<Map<number, number>>(new Map());

  // Calculate which slide is most visible based on intersection ratios
  const updateVisibleSlide = useCallback(() => {
    if (visibilityMap.current.size === 0) return;

    let maxRatio = 0;
    let mostVisibleIndex = 0;

    visibilityMap.current.forEach((ratio, index) => {
      if (ratio > maxRatio) {
        maxRatio = ratio;
        mostVisibleIndex = index;
      }
    });

    if (maxRatio > 0) {
      setVisibleSlideIndex(mostVisibleIndex);
    }
  }, []);

  // Set up Intersection Observer
  useEffect(() => {
    if (slideCount === 0) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const container = document.querySelector(containerSelector)?.parentElement;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const slideId = entry.target.id;
          const slideIndex = parseInt(slideId.replace("slide-", ""), 10);

          if (!isNaN(slideIndex)) {
            if (entry.isIntersecting) {
              visibilityMap.current.set(slideIndex, entry.intersectionRatio);
            } else {
              visibilityMap.current.delete(slideIndex);
            }
          }
        });

        updateVisibleSlide();
      },
      {
        root: container || null,
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin,
      },
    );

    // Observe all slide elements
    const slideElements = document.querySelectorAll(slideSelector);
    slideElements.forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      visibilityMap.current.clear();
    };
  }, [
    slideCount,
    slideSelector,
    containerSelector,
    rootMargin,
    updateVisibleSlide,
  ]);

  // Scroll to a specific slide
  const scrollToSlide = useCallback(
    (index: number) => {
      if (index < 0 || index >= slideCount) return;

      const slideElement = document.getElementById(`slide-${index}`);
      if (!slideElement) return;

      setIsScrolling(true);
      // Immediately update visibleSlideIndex for instant UI feedback
      setVisibleSlideIndex(index);

      slideElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Reset scrolling state after animation completes
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 500);
    },
    [slideCount],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    visibleSlideIndex,
    scrollToSlide,
    isScrolling,
  };
};

export default useScrollSync;
