/**
 * React hook for rendering template layouts with editing capabilities.
 *
 * Provides utilities for rendering presentation slides using template layouts,
 * with support for editable text (via Tiptap), editable images/icons, and
 * error boundaries. Handles layout loading, content updates, and slide
 * property management.
 */

"use client";
import React, { useMemo } from "react";
import { useLayout } from "../context/layout-context";
import EditableLayoutWrapper from "../components/editable-layout-wrapper";
import SlideErrorBoundary from "../components/slide-error-boundary";
import TiptapTextReplacer from "../components/tiptap-text-replacer";
import { usePresentationDataStore } from "@/stores";
import { Loader2 } from "lucide-react";
import type { SlideProperties } from "@/types/slide";

/**
 * Hook for template layout rendering and editing.
 *
 * Provides functions for:
 * - Getting template layout components by ID
 * - Rendering slide content with editing capabilities
 * - Handling loading states and errors
 *
 * @returns Object with `getTemplateLayout` and `renderSlideContent` functions.
 */
export const useTemplateLayouts = () => {
  const updateSlideContent = usePresentationDataStore((state) => state.updateSlideContent);
  const { getLayoutById, getLayout, loading } = useLayout();

  const getTemplateLayout = useMemo(() => {
    return (layoutId: string, groupName: string) => {
      const layout = getLayoutById(layoutId);
      if (layout) {
        return getLayout(layoutId);
      }
      return null;
    };
  }, [getLayoutById, getLayout]);

  // Render slide content with group validation, automatic Tiptap text editing, and editable images/icons
  const renderSlideContent = useMemo(() => {
    return (
      slide:
        | {
            layout?: string;
            layout_group?: string;
            index?: number;
            id?: string | null;
            content?: unknown;
            properties?: unknown;
          }
        | null
        | undefined,
      isEditMode: boolean,
    ) => {
      // Guard against undefined/null slide
      if (!slide) {
        return (
          <div className="flex flex-col items-center justify-center aspect-video h-full bg-gray-100 rounded-lg">
            <p className="text-gray-600 text-center text-base">
              Slide data not available
            </p>
          </div>
        );
      }

      const Layout = getTemplateLayout(
        slide.layout ?? "",
        slide.layout_group ?? "",
      );
      if (loading) {
        return (
          <div className="flex flex-col items-center justify-center aspect-video h-full bg-gray-100 rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
          </div>
        );
      }
      if (!Layout) {
        return (
          <div className="flex flex-col items-center justify-center aspect-video h-full bg-gray-100 rounded-lg">
            <p className="text-gray-600 text-center text-base">
              Layout &quot;{slide.layout || "unknown"}&quot; not found in &quot;
              {slide.layout_group || "unknown"}&quot; group
            </p>
          </div>
        );
      }

      const slideIndex = slide.index ?? 0;
      const slideData =
        slide.content && typeof slide.content === "object"
          ? (slide.content as Record<string, unknown>)
          : {};

      if (isEditMode) {
        return (
          <EditableLayoutWrapper
            slideIndex={slideIndex}
            slideData={slide.content}
            properties={slide.properties as SlideProperties | null | undefined}
          >
            <TiptapTextReplacer
              key={slide.id}
              slideData={slide.content}
              slideIndex={slideIndex}
              onContentChange={(
                content: string,
                dataPath: string,
                idx?: number,
              ) => {
                if (dataPath && idx !== undefined) {
                  updateSlideContent(idx, dataPath, content);
                }
              }}
            >
              <SlideErrorBoundary label={`Slide ${slideIndex + 1}`}>
                <Layout data={slideData} />
              </SlideErrorBoundary>
            </TiptapTextReplacer>
          </EditableLayoutWrapper>
        );
      }
      return (
        <SlideErrorBoundary label={`Slide ${slideIndex + 1}`}>
          <Layout data={slideData} />
        </SlideErrorBoundary>
      );
    };
  }, [getTemplateLayout, updateSlideContent, loading]);

  return {
    getTemplateLayout,
    renderSlideContent,
    loading,
  };
};
