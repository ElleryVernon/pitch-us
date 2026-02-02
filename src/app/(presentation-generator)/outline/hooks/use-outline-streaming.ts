/**
 * React hook for handling Server-Sent Events (SSE) streaming of outline data.
 *
 * Manages real-time streaming of presentation outline generation via EventSource.
 * Handles incremental outline slide updates, delta patches, and status messages.
 * Processes JSON chunks, repairs malformed JSON, and updates outline state
 * in real-time with optimized rendering using requestAnimationFrame.
 */

import { useEffect, useRef, useState, startTransition } from "react";
import { toast } from "sonner";
import { usePresentationDataStore } from "@/stores";
import { OutlineSlide } from "../types/index";
import { createOutlineId } from "../utils/outline-ids";
import { jsonrepair } from "jsonrepair";

/**
 * Hook for managing outline streaming from Server-Sent Events.
 *
 * Connects to an SSE endpoint and processes streaming outline data,
 * including outline slides, deltas, and status updates. Handles JSON repair
 * for malformed chunks, manages outline state updates, and tracks streaming
 * progress.
 *
 * @param presentationId - Unique identifier of the presentation, or null if
 *   not yet created. Streaming only occurs if presentationId is provided and
 *   no outlines exist yet.
 * @returns Object containing streaming state (isStreaming, isLoading,
 *   activeSlideIndex, statusMessage).
 */
export const useOutlineStreaming = (presentationId: string | null) => {
  const outlines = usePresentationDataStore((state) => state.outlines);
  const setOutlines = usePresentationDataStore((state) => state.setOutlines);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number | null>(null);
  const [highestActiveIndex, setHighestActiveIndex] = useState<number>(-1);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const prevSlidesRef = useRef<OutlineSlide[]>([]);
  const activeIndexRef = useRef<number>(-1);
  const highestIndexRef = useRef<number>(-1);
  const hasSlideEventsRef = useRef(false);
  const lastChunkParseRef = useRef(0);
  const hasDeltaEventsRef = useRef(false);
  const pendingSlidesRef = useRef<OutlineSlide[] | null>(null);
  const rafRef = useRef<number | null>(null);
  const outlinesLengthRef = useRef(outlines.length);

  outlinesLengthRef.current = outlines.length;

  useEffect(() => {
    // Skip if no presentation ID or already have outlines
    if (!presentationId || outlinesLengthRef.current > 0) {
      setIsLoading(false);
      setIsStreaming(false);
      return;
    }

    let eventSource: EventSource | null = null;
    let accumulatedChunks = "";
    let isMounted = true;

    const scheduleOutlinesUpdate = (nextSlides: OutlineSlide[]) => {
      pendingSlidesRef.current = nextSlides;
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (!isMounted) return;
        const pending = pendingSlidesRef.current;
        pendingSlidesRef.current = null;
        if (!pending) return;
        startTransition(() => {
          setOutlines(pending);
        });
      });
    };

    const initializeStream = async () => {
      if (!isMounted) return;
      setIsStreaming(true);
      setIsLoading(true);
      try {
        eventSource = new EventSource(
          `/api/v1/outlines/stream/${presentationId}`,
        );

        eventSource.addEventListener("response", (event) => {
          if (!isMounted) return;
          const data = JSON.parse(event.data);
          switch (data.type) {
            case "slide":
              // Progressive slide event: immediately update with the new slide
              if (isMounted && data.slide && typeof data.index === "number") {
                hasSlideEventsRef.current = true;
                const slideIndex = data.index;
                const incomingContent =
                  typeof data.slide.content === "string"
                    ? data.slide.content
                    : "";
                const newSlide: OutlineSlide = {
                  id:
                    prevSlidesRef.current[slideIndex]?.id ?? createOutlineId(),
                  content: incomingContent,
                };

                // Update active index even if content is empty
                activeIndexRef.current = slideIndex;
                setActiveSlideIndex(slideIndex);

                if (slideIndex > highestIndexRef.current) {
                  highestIndexRef.current = slideIndex;
                  setHighestActiveIndex(slideIndex);
                }

                if (!incomingContent.trim()) {
                  break;
                }

                // Build updated slides array
                const updatedSlides = [...prevSlidesRef.current];
                while (updatedSlides.length <= slideIndex) {
                  updatedSlides.push({
                    id: createOutlineId(),
                    content: "",
                  });
                }
                const prevContent =
                  prevSlidesRef.current[slideIndex]?.content || "";
                const mergedContent =
                  incomingContent.length >= prevContent.length
                    ? incomingContent
                    : prevContent;
                updatedSlides[slideIndex] = {
                  ...newSlide,
                  content: mergedContent,
                };

                prevSlidesRef.current = updatedSlides;
                scheduleOutlinesUpdate(updatedSlides);
                setIsLoading(false);
              }
              break;

            case "delta":
              if (
                isMounted &&
                typeof data.index === "number" &&
                typeof data.content === "string"
              ) {
                hasDeltaEventsRef.current = true;
                const slideIndex = data.index;
                const updatedSlides = [...prevSlidesRef.current];
                while (updatedSlides.length <= slideIndex) {
                  updatedSlides.push({
                    id: createOutlineId(),
                    content: "",
                  });
                }
                updatedSlides[slideIndex] = {
                  id: updatedSlides[slideIndex]?.id ?? createOutlineId(),
                  content: data.content,
                };

                prevSlidesRef.current = updatedSlides;
                scheduleOutlinesUpdate(updatedSlides);
                activeIndexRef.current = slideIndex;
                setActiveSlideIndex(slideIndex);
                if (slideIndex > highestIndexRef.current) {
                  highestIndexRef.current = slideIndex;
                  setHighestActiveIndex(slideIndex);
                }
                setIsLoading(false);
              }
              break;

            case "chunk":
              if (hasDeltaEventsRef.current) {
                break;
              }
              if (
                hasSlideEventsRef.current &&
                !data.chunk.includes('"content"')
              ) {
                break;
              }
              accumulatedChunks += data.chunk;
              if (
                !data.chunk.includes("}") &&
                !data.chunk.includes("]") &&
                !data.chunk.includes("},")
              ) {
                break;
              }
              const now = Date.now();
              if (now - lastChunkParseRef.current < 120) {
                break;
              }
              lastChunkParseRef.current = now;
              try {
                const repairedJson = jsonrepair(accumulatedChunks);
                const partialData = JSON.parse(repairedJson);

                if (partialData.slides && isMounted) {
                  const incomingSlides: { content: string }[] =
                    partialData.slides || [];
                  const nextSlides: OutlineSlide[] = incomingSlides.map(
                    (slide, index) => {
                      const prevContent =
                        prevSlidesRef.current[index]?.content || "";
                      const nextContent =
                        typeof slide.content === "string" ? slide.content : "";
                      const content =
                        nextContent.trim().length > 0
                          ? nextContent
                          : prevContent;
                      return {
                        id:
                          prevSlidesRef.current[index]?.id ?? createOutlineId(),
                        content,
                      };
                    },
                  );
                  const hasAnyContent = nextSlides.some(
                    (slide) => slide.content.trim().length > 0,
                  );
                  if (!hasAnyContent && prevSlidesRef.current.length === 0) {
                    break;
                  }
                  // Determine which slide index changed to minimize live parsing
                  try {
                    const prev = prevSlidesRef.current || [];
                    let changedIndex: number | null = null;
                    const maxLen = Math.max(prev.length, nextSlides.length);
                    for (let i = 0; i < maxLen; i++) {
                      const prevContent = prev[i]?.content;
                      const nextContent = nextSlides[i]?.content;
                      if (nextContent !== prevContent) {
                        changedIndex = i;
                      }
                    }
                    // Keep active index stable if no change detected; and ensure non-decreasing
                    const prevActive = activeIndexRef.current;
                    let nextActive = changedIndex ?? prevActive;
                    if (nextActive < prevActive) {
                      nextActive = prevActive;
                    }
                    activeIndexRef.current = nextActive;
                    setActiveSlideIndex(nextActive);

                    if (nextActive > highestIndexRef.current) {
                      highestIndexRef.current = nextActive;
                      setHighestActiveIndex(nextActive);
                    }
                  } catch {}

                  prevSlidesRef.current = nextSlides;
                  startTransition(() => {
                    setOutlines(nextSlides);
                  });
                  setIsLoading(false);
                }
              } catch {
                // JSON isn't complete yet, continue accumulating
              }
              break;

            case "complete":
              try {
                const incomingSlides: { content: string }[] =
                  data.presentation.outlines.slides;
                const outlinesData: OutlineSlide[] = incomingSlides.map(
                  (slide, index) => ({
                    id: prevSlidesRef.current[index]?.id ?? createOutlineId(),
                    content: slide.content,
                  }),
                );
                if (isMounted) {
                  scheduleOutlinesUpdate(outlinesData);
                  setIsStreaming(false);
                  setIsLoading(false);
                  setActiveSlideIndex(null);
                  setHighestActiveIndex(-1);
                  setStatusMessage("");
                }
                prevSlidesRef.current = outlinesData;
                activeIndexRef.current = -1;
                highestIndexRef.current = -1;
                hasDeltaEventsRef.current = false;
                eventSource?.close();
              } catch (error) {
                console.error("Error parsing accumulated chunks:", error);
                if (isMounted) {
                  toast.error("Failed to parse presentation data");
                }
                eventSource?.close();
              }
              accumulatedChunks = "";
              break;

            case "closing":
              if (isMounted) {
                setIsStreaming(false);
                setIsLoading(false);
                setActiveSlideIndex(null);
                setHighestActiveIndex(-1);
                setStatusMessage("");
              }
              activeIndexRef.current = -1;
              highestIndexRef.current = -1;
              hasSlideEventsRef.current = false;
              hasDeltaEventsRef.current = false;
              eventSource?.close();
              break;
            case "error":
              if (isMounted) {
                setIsStreaming(false);
                setIsLoading(false);
                setActiveSlideIndex(null);
                setHighestActiveIndex(-1);
                setStatusMessage("");
                toast.error("Error in outline streaming", {
                  description:
                    data.detail ||
                    "Failed to connect to the server. Please try again.",
                });
              }
              activeIndexRef.current = -1;
              highestIndexRef.current = -1;
              hasSlideEventsRef.current = false;
              hasDeltaEventsRef.current = false;
              eventSource?.close();
              break;
            case "status":
              if (typeof data.message === "string" && isMounted) {
                setStatusMessage(data.message);
              }
              break;
          }
        });

        eventSource.onerror = () => {
          if (isMounted) {
            setIsStreaming(false);
            setIsLoading(false);
            setActiveSlideIndex(null);
            setHighestActiveIndex(-1);
            setStatusMessage("");
            toast.error("Failed to connect to the server. Please try again.");
          }
          activeIndexRef.current = -1;
          highestIndexRef.current = -1;
          hasSlideEventsRef.current = false;
          hasDeltaEventsRef.current = false;
          eventSource?.close();
        };
      } catch (error) {
        if (isMounted) {
          setIsStreaming(false);
          setIsLoading(false);
          setActiveSlideIndex(null);
          setHighestActiveIndex(-1);
          setStatusMessage("");
          toast.error("Failed to initialize connection");
        }
        activeIndexRef.current = -1;
        highestIndexRef.current = -1;
        hasSlideEventsRef.current = false;
      }
    };
    initializeStream();
    return () => {
      isMounted = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pendingSlidesRef.current = null;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }, [presentationId, setOutlines]);

  return {
    isStreaming,
    isLoading,
    activeSlideIndex,
    highestActiveIndex,
    statusMessage,
  };
};
