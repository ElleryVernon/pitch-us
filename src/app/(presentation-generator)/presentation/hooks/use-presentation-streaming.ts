/**
 * React hook for handling Server-Sent Events (SSE) streaming of presentation data.
 *
 * Manages real-time streaming of presentation generation updates via EventSource.
 * Handles incremental slide updates, delta patches, and presentation metadata.
 * Processes JSON chunks, repairs malformed JSON, and updates presentation state
 * in real-time with optimized rendering using requestAnimationFrame.
 */

import { useEffect, useRef, startTransition } from "react";
import { jsonrepair } from "jsonrepair";
import { toast } from "sonner";
import { MixpanelEvent, trackEvent } from "@/utils/mixpanel";
import { usePresentationUIStore, usePresentationDataStore, type PresentationData } from "@/stores";
import type { Slide } from "@/types/slide";

/**
 * Hook for managing presentation streaming from Server-Sent Events.
 *
 * Connects to an SSE endpoint and processes streaming presentation data,
 * including slides, deltas, and metadata. Handles JSON repair for malformed
 * chunks, manages slide state updates, and provides loading/error callbacks.
 *
 * @param presentationId - Unique identifier of the presentation being streamed.
 * @param stream - Stream parameter from URL (e.g., "true" to enable streaming).
 * @param setLoading - Callback to set loading state.
 * @param setError - Callback to set error state.
 * @param fetchUserSlides - Callback to fetch slides after streaming completes.
 * @param hasExistingData - Whether presentation already has existing data.
 * @returns void (side effects only).
 */
export const usePresentationStreaming = (
  presentationId: string,
  stream: string | null,
  setLoading: (loading: boolean) => void,
  setError: (error: boolean) => void,
  fetchUserSlides: () => void,
  hasExistingData: boolean = false,
) => {
  const setStreaming = usePresentationUIStore((state) => state.setStreaming);
  const setPresentationData = usePresentationDataStore((state) => state.setPresentationData);
  const clearPresentationData = usePresentationDataStore((state) => state.clearPresentationData);
  
  const previousSlidesLength = useRef(0);
  const slidesRef = useRef<Slide[]>([]);
  const hasSlideEventsRef = useRef(false);
  const hasSlideDeltaRef = useRef(false);
  const presentationMetaRef = useRef<PresentationData | null>(null);
  const lastChunkParseRef = useRef(0);
  const isStreamingActiveRef = useRef(false);
  const hasExistingDataRef = useRef(hasExistingData);
  const pendingSlidesRef = useRef<Slide[] | null>(null);
  const rafRef = useRef<number | null>(null);
  const finalizedSlidesRef = useRef<Set<number>>(new Set());
  const placeholderSlidesRef = useRef<Slide[] | null>(null);
  const expectedSlidesRef = useRef<number | null>(null);
  const streamCompletedRef = useRef(false);
  const slidesCompleteNotifiedRef = useRef(false);

  // Update ref when hasExistingData changes (for use inside effect)
  useEffect(() => {
    hasExistingDataRef.current = hasExistingData;
  }, [hasExistingData]);

  useEffect(() => {
    let eventSource: EventSource;
    let accumulatedChunks = "";

    const clearStreamParam = () => {
      const newUrl = new URL(window.location.href);
      if (newUrl.searchParams.has("stream")) {
        newUrl.searchParams.delete("stream");
        window.history.replaceState({}, "", newUrl.toString());
      }
    };

    const deepClone = <T>(value: T): T => {
      if (typeof structuredClone === "function") {
        return structuredClone(value);
      }
      return JSON.parse(JSON.stringify(value)) as T;
    };

    const getPlaceholderSlides = () => {
      if (
        !placeholderSlidesRef.current ||
        !placeholderSlidesRef.current.length
      ) {
        return null;
      }
      return deepClone(placeholderSlidesRef.current);
    };

    const scheduleSlidesUpdate = (nextSlides: Slide[]) => {
      pendingSlidesRef.current = nextSlides;
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const pending = pendingSlidesRef.current;
        pendingSlidesRef.current = null;
        if (!pending) return;
        const basePresentation =
          presentationMetaRef.current ||
          ({
            id: presentationId,
            language: "",
            layout: { name: "", ordered: false, slides: [] },
            n_slides: pending.length,
            title: "",
            slides: [],
          } satisfies PresentationData);
        startTransition(() => {
          setPresentationData({
            ...basePresentation,
            slides: deepClone(pending),
          });
        });
      });
    };

    const parsePath = (
      path: string,
    ): Array<{ type: "key"; key: string } | { type: "index"; index: number }> =>
      path
        .split(/[.\[\]]+/)
        .filter(Boolean)
        .map((part) =>
          Number.isFinite(Number(part))
            ? { type: "index", index: Number(part) }
            : { type: "key", key: part },
        );

    const setNestedValue = (
      root: Record<string, unknown>,
      path: string,
      value: unknown,
    ) => {
      const segments = parsePath(path);
      if (segments.length === 0) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current: any = root;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parent: any = null;
      let parentSeg:
        | { type: "key"; key: string }
        | { type: "index"; index: number }
        | null = null;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const isLast = i === segments.length - 1;
        if (isLast) {
          if (segment.type === "key") {
            current[segment.key] = value;
          } else {
            if (!Array.isArray(current)) {
              const replacement: unknown[] = [];
              if (parent && parentSeg) {
                if (parentSeg.type === "key") {
                  parent[parentSeg.key] = replacement;
                } else {
                  parent[parentSeg.index] = replacement;
                }
              }
              current = replacement;
            }
            current[segment.index] = value;
          }
          return;
        }

        const next = segments[i + 1];
        if (segment.type === "key") {
          if (
            current[segment.key] == null ||
            typeof current[segment.key] !== "object"
          ) {
            current[segment.key] = next.type === "index" ? [] : {};
          } else if (
            next.type === "index" &&
            !Array.isArray(current[segment.key])
          ) {
            current[segment.key] = [];
          } else if (
            next.type === "key" &&
            Array.isArray(current[segment.key])
          ) {
            current[segment.key] = {};
          }
          parent = current;
          parentSeg = segment;
          current = current[segment.key];
        } else {
          if (!Array.isArray(current)) {
            const replacement: unknown[] = [];
            if (parent && parentSeg) {
              if (parentSeg.type === "key") {
                parent[parentSeg.key] = replacement;
              } else {
                parent[parentSeg.index] = replacement;
              }
            }
            current = replacement;
          }
          if (
            current[segment.index] == null ||
            typeof current[segment.index] !== "object"
          ) {
            current[segment.index] = next.type === "index" ? [] : {};
          } else if (
            next.type === "index" &&
            !Array.isArray(current[segment.index])
          ) {
            current[segment.index] = [];
          } else if (
            next.type === "key" &&
            Array.isArray(current[segment.index])
          ) {
            current[segment.index] = {};
          }
          parent = current;
          parentSeg = segment;
          current = current[segment.index];
        }
      }
    };

    const initializeStream = async () => {
      // Prevent duplicate stream initialization
      if (isStreamingActiveRef.current) {
        console.log(
          "[usePresentationStreaming] Stream already active, skipping",
        );
        return;
      }
      isStreamingActiveRef.current = true;

      setStreaming(true);
      clearPresentationData();
      slidesRef.current = [];
      hasSlideEventsRef.current = false;
      hasSlideDeltaRef.current = false;
      finalizedSlidesRef.current = new Set();
      placeholderSlidesRef.current = null;
      presentationMetaRef.current = null;
      lastChunkParseRef.current = 0;
      pendingSlidesRef.current = null;
      expectedSlidesRef.current = null;
      streamCompletedRef.current = false;
      slidesCompleteNotifiedRef.current = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      trackEvent(MixpanelEvent.Presentation_Stream_API_Call);

      eventSource = new EventSource(
        `/api/v1/presentations/stream/${presentationId}`,
      );

      eventSource.addEventListener("response", (event) => {
        const data = JSON.parse(event.data);
        const isStreamComplete = () => {
          const expected =
            expectedSlidesRef.current ??
            presentationMetaRef.current?.n_slides ??
            slidesRef.current.length;
          return expected > 0 && finalizedSlidesRef.current.size >= expected;
        };

        switch (data.type) {
          case "meta":
            presentationMetaRef.current = data.presentation;
            if (
              typeof data.presentation?.n_slides === "number" &&
              data.presentation.n_slides > 0
            ) {
              expectedSlidesRef.current = data.presentation.n_slides;
            }
            startTransition(() => {
              setPresentationData({
                ...data.presentation,
                slides:
                  slidesRef.current.length > 0
                    ? [...slidesRef.current]
                    : data.presentation.slides,
              });
            });
            break;
          case "slides_init": {
            hasSlideEventsRef.current = true;
            if (Array.isArray(data.slides) && data.slides.length > 0) {
              const cloned = deepClone(data.slides);
              slidesRef.current = cloned;
              placeholderSlidesRef.current = deepClone(cloned);
              previousSlidesLength.current = data.slides.length;
              expectedSlidesRef.current = data.slides.length;
              scheduleSlidesUpdate(slidesRef.current);
              setLoading(false);
            }
            break;
          }
          case "slide_delta": {
            if (
              typeof data.index === "number" &&
              typeof data.path === "string" &&
              typeof data.value === "string"
            ) {
              if (finalizedSlidesRef.current.has(data.index)) {
                break;
              }
              hasSlideDeltaRef.current = true;
              hasSlideEventsRef.current = true;
              let slide = slidesRef.current[data.index];
              if (!slide) {
                const fallbackSlides = getPlaceholderSlides();
                if (fallbackSlides && fallbackSlides[data.index]) {
                  slidesRef.current[data.index] = fallbackSlides[data.index];
                  slide = slidesRef.current[data.index];
                }
              }
              if (slide) {
                const content =
                  slide.content && typeof slide.content === "object"
                    ? slide.content
                    : { title: "", body: "" };
                try {
                  setNestedValue(content as Record<string, unknown>, data.path, data.value);
                  slide.content = content;
                } catch (error) {
                  try {
                    const retryContent = deepClone(content);
                    setNestedValue(retryContent as Record<string, unknown>, data.path, data.value);
                    slide.content = retryContent;
                  } catch (retryError) {
                    console.error(
                      "[slide_delta] Failed to apply delta",
                      retryError,
                    );
                  }
                }
                scheduleSlidesUpdate(slidesRef.current);
                setLoading(false);
              }
            }
            break;
          }
          case "slide": {
            hasSlideEventsRef.current = true;
            if (typeof data.index === "number" && data.slide) {
              finalizedSlidesRef.current.add(data.index);
              slidesRef.current[data.index] = data.slide;
              const nextSlides = [...slidesRef.current];
              scheduleSlidesUpdate(nextSlides);
              previousSlidesLength.current = nextSlides.length;
              setLoading(false);
              if (isStreamComplete()) {
                streamCompletedRef.current = true;
                if (!slidesCompleteNotifiedRef.current) {
                  const total =
                    expectedSlidesRef.current ??
                    presentationMetaRef.current?.n_slides ??
                    slidesRef.current.length;
                  if (total > 0) {
                    slidesCompleteNotifiedRef.current = true;
                    toast.success("Slides generated successfully", {
                      description: `${total} slides generated, finalizing...`,
                    });
                  }
                }
              }
            }
            break;
          }
          case "progress": {
            if (typeof data.total === "number" && data.total > 0) {
              expectedSlidesRef.current = data.total;
            }
            if (
              typeof data.completed === "number" &&
              typeof data.total === "number" &&
              data.completed >= data.total
            ) {
              streamCompletedRef.current = true;
              if (!slidesCompleteNotifiedRef.current && data.total > 0) {
                slidesCompleteNotifiedRef.current = true;
                toast.success("Slides generated successfully", {
                  description: `${data.total} slides generated, finalizing...`,
                });
              }
            }
            break;
          }
          case "slides_complete":
            streamCompletedRef.current = true;
            setLoading(false);
            setStreaming(false);
            clearStreamParam();
            if (!slidesCompleteNotifiedRef.current) {
              const total =
                typeof data.total === "number"
                  ? data.total
                  : expectedSlidesRef.current ??
                    presentationMetaRef.current?.n_slides ??
                    slidesRef.current.length;
              if (total > 0) {
                slidesCompleteNotifiedRef.current = true;
                toast.success("Slides generated successfully", {
                  description: `${total} slides generated, finalizing...`,
                });
              }
            }
            break;
          case "chunk":
            if (hasSlideEventsRef.current || hasSlideDeltaRef.current) {
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

              if (partialData.slides) {
                if (
                  partialData.slides.length !== previousSlidesLength.current &&
                  partialData.slides.length > 0
                ) {
                  const basePresentation =
                    presentationMetaRef.current ||
                    ({
                      id: presentationId,
                      language: "",
                      layout: { name: "", ordered: false, slides: [] },
                      n_slides: partialData.slides.length,
                      title: "",
                      slides: [],
                    } satisfies PresentationData);
                  startTransition(() => {
                    setPresentationData({
                      ...basePresentation,
                      ...partialData,
                      slides: partialData.slides,
                    });
                  });
                  previousSlidesLength.current = partialData.slides.length;
                  setLoading(false);
                }
              }
            } catch (error) {
              // JSON isn't complete yet, continue accumulating
            }
            break;

          case "complete":
            try {
              startTransition(() => {
                setPresentationData(data.presentation);
              });
              setStreaming(false);
              setLoading(false);
              isStreamingActiveRef.current = false;
              finalizedSlidesRef.current = new Set();
              placeholderSlidesRef.current = null;
              expectedSlidesRef.current = null;
              streamCompletedRef.current = false;
              slidesCompleteNotifiedRef.current = false;
              clearStreamParam();
              eventSource.close();
              // Show success toast
              const slideCount = data.presentation?.slides?.length || 0;
              toast.success("Presentation generated", {
                description: `${slideCount} slides created successfully`,
              });
            } catch (error) {
              eventSource.close();
              isStreamingActiveRef.current = false;
              console.error("Error parsing accumulated chunks:", error);
            }
            accumulatedChunks = "";
            break;

          case "closing":
            startTransition(() => {
              setPresentationData(data.presentation);
            });
            setLoading(false);
            setStreaming(false);
            isStreamingActiveRef.current = false;
            finalizedSlidesRef.current = new Set();
            placeholderSlidesRef.current = null;
            expectedSlidesRef.current = null;
            streamCompletedRef.current = false;
            slidesCompleteNotifiedRef.current = false;
            clearStreamParam();
            eventSource.close();
            // Show success toast
            const closingSlideCount = data.presentation?.slides?.length || 0;
            toast.success("Presentation generated", {
              description: `${closingSlideCount} slides created successfully`,
            });
            break;
          case "error":
            eventSource.close();
            isStreamingActiveRef.current = false;
            finalizedSlidesRef.current = new Set();
            placeholderSlidesRef.current = null;
            clearStreamParam();
            toast.error("Error in outline streaming", {
              description:
                data.detail ||
                "Failed to connect to the server. Please try again.",
            });
            setLoading(false);
            setStreaming(false);
            setError(true);
            break;
        }
      });

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        const expected =
          expectedSlidesRef.current ??
          presentationMetaRef.current?.n_slides ??
          slidesRef.current.length;
        const isComplete =
          streamCompletedRef.current ||
          (expected > 0 && finalizedSlidesRef.current.size >= expected);
        if (isComplete) {
          console.log("Stream ended after all slides completed");
          setLoading(false);
          setStreaming(false);
          clearStreamParam();
        } else {
          // No slides loaded - this is a real error
          setLoading(false);
          setStreaming(false);
          setError(true);
        }
        isStreamingActiveRef.current = false;
        finalizedSlidesRef.current = new Set();
        placeholderSlidesRef.current = null;
        expectedSlidesRef.current = null;
        streamCompletedRef.current = false;
        slidesCompleteNotifiedRef.current = false;
        eventSource.close();
      };

      // Also handle when EventSource connection closes naturally
      eventSource.addEventListener("close", () => {
        console.log("EventSource closed");
        const expected =
          expectedSlidesRef.current ??
          presentationMetaRef.current?.n_slides ??
          slidesRef.current.length;
        const isComplete =
          streamCompletedRef.current ||
          (expected > 0 && finalizedSlidesRef.current.size >= expected);
        setLoading(false);
        setStreaming(false);
        isStreamingActiveRef.current = false;
        if (isComplete) {
          clearStreamParam();
        }
      });
    };

    if (stream) {
      initializeStream();
    } else if (!hasExistingDataRef.current) {
      // Only fetch if we don't already have the data
      fetchUserSlides();
    }

    return () => {
      if (eventSource) {
        eventSource.close();
        // Ensure streaming is marked as complete on cleanup
        setStreaming(false);
        isStreamingActiveRef.current = false;
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pendingSlidesRef.current = null;
      finalizedSlidesRef.current = new Set();
      placeholderSlidesRef.current = null;
      slidesCompleteNotifiedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentationId, stream, setLoading, setError, fetchUserSlides, setPresentationData, clearPresentationData, setStreaming]);
};
