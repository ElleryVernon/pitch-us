"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, GripVertical, Layers } from "lucide-react";
import ToolTip from "@/components/tool-tip";
import { usePresentationUIStore, usePresentationDataStore } from "@/stores";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTemplateLayouts } from "../../hooks/use-template-layouts";
import { cn } from "@/lib/utils";
import ScaledSlidePreview from "../../components/scaled-slide-preview";
import { Slide } from "@/types/slide";

interface SidePanelProps {
  selectedSlide: number;
  visibleSlideIndex?: number;
  onSlideClick: (index: number) => void;
  isMobilePanelOpen: boolean;
  setIsMobilePanelOpen: (value: boolean) => void;
  loading: boolean;
}

// Sortable slide thumbnail component
const SortableSlideItem = ({
  slide,
  index,
  isActive,
  onSlideClick,
  renderSlideContent,
  isStreaming,
}: {
  slide: Slide;
  index: number;
  isActive: boolean;
  onSlideClick: (index: number) => void;
  renderSlideContent: (slide: Slide, isEditMode: boolean) => React.ReactElement;
  isStreaming: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: slide.id || `slide-${index}`,
    disabled: isStreaming,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-xl transition-all duration-200",
        isDragging && "opacity-50 scale-95",
      )}
    >
      {/* Slide container */}
      <div
        onClick={() => !isDragging && onSlideClick(index)}
        className={cn(
          "relative cursor-pointer rounded-xl overflow-hidden transition-all duration-200",
          "border-2",
          isActive ? "border-accent" : "border-transparent hover:border-bg-300",
        )}
      >
        {/* Slide number badge */}
        <div
          className={cn(
            "absolute top-2 left-2 z-20 min-w-[24px] h-6 px-1.5 rounded-md flex items-center justify-center",
            "text-xs font-semibold tabular-nums transition-all duration-200",
            isActive
              ? "bg-accent text-white shadow-sm"
              : "bg-black/60 text-white/90 backdrop-blur-sm",
          )}
        >
          {index + 1}
        </div>

        {/* Drag handle - only show when not streaming */}
        {!isStreaming && (
          <div
            {...attributes}
            {...listeners}
            className={cn(
              "absolute top-2 right-2 z-20 p-1 rounded-md cursor-grab active:cursor-grabbing",
              "bg-black/60 text-white/70 backdrop-blur-sm",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              "hover:bg-black/80 hover:text-white",
            )}
          >
            <GripVertical className="w-3 h-3" />
          </div>
        )}

        {/* Slide preview */}
        <div className="relative aspect-video bg-bg-200 overflow-hidden">
          <ScaledSlidePreview className="w-full h-full">
            {renderSlideContent(slide, false)}
          </ScaledSlidePreview>
        </div>
      </div>

      {/* Slide title - truncated */}
      <p
        className={cn(
          "mt-1.5 px-1 text-xs truncate transition-colors duration-200",
          isActive ? "text-text-200 font-medium" : "text-text-400",
        )}
      >
        {slide.content?.title || `Slide ${index + 1}`}
      </p>
    </div>
  );
};

const SidePanel = ({
  selectedSlide,
  visibleSlideIndex,
  onSlideClick,
  isMobilePanelOpen,
  setIsMobilePanelOpen,
  loading,
}: SidePanelProps) => {
  const activeSlide = visibleSlideIndex ?? selectedSlide;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrolledToRef = useRef<number>(-1);

  const presentationData = usePresentationDataStore((state) => state.presentationData);
  const setPresentationData = usePresentationDataStore((state) => state.setPresentationData);
  const isStreaming = usePresentationUIStore((state) => state.isStreaming);
  const { renderSlideContent } = useTemplateLayouts();

  // Handle mobile panel sync
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setIsCollapsed(!isMobilePanelOpen);
    }
  }, [isMobilePanelOpen]);

  // Auto-scroll to active slide
  useEffect(() => {
    if (activeSlide === lastScrolledToRef.current || !containerRef.current)
      return;

    const slideElement = containerRef.current.querySelector(
      `[data-slide-index="${activeSlide}"]`,
    );
    if (slideElement) {
      slideElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      lastScrolledToRef.current = activeSlide;
    }
  }, [activeSlide]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!active || !over || !presentationData?.slides) return;

    if (active.id !== over.id) {
      const oldIndex = presentationData.slides.findIndex(
        (item: any) => (item.id || `slide-${item.index}`) === active.id,
      );
      const newIndex = presentationData.slides.findIndex(
        (item: any) => (item.id || `slide-${item.index}`) === over.id,
      );

      const reorderedArray = arrayMove(
        presentationData.slides,
        oldIndex,
        newIndex,
      );

      const updatedArray = reorderedArray.map((slide: any, index: number) => ({
        ...slide,
        index,
      }));

      setPresentationData({ ...presentationData, slides: updatedArray });
    }
  };

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setIsMobilePanelOpen(isCollapsed);
    }
  };

  // Don't render if no data
  if (
    !presentationData ||
    loading ||
    !presentationData?.slides ||
    presentationData.slides.length === 0
  ) {
    return null;
  }

  const slides = presentationData.slides;
  const activeSlideData = activeId
    ? slides.find((s: any) => (s.id || `slide-${s.index}`) === activeId)
    : null;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobilePanelOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 xl:hidden backdrop-blur-sm"
          onClick={() => setIsMobilePanelOpen(false)}
        />
      )}

      {/* Toggle button - fixed position when collapsed */}
      <div
        className={cn(
          "fixed z-50 transition-all duration-300",
          isCollapsed
            ? "left-4 top-1/2 -translate-y-1/2"
            : "xl:hidden left-4 bottom-6",
          !isCollapsed && "xl:opacity-0 xl:pointer-events-none",
        )}
      >
        <ToolTip content={isCollapsed ? "Show slides" : "Hide slides"}>
          <button
            onClick={handleToggle}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200",
              "bg-bg-100 border border-bg-200 shadow-lg",
              "text-text-300 hover:text-text-100 hover:bg-bg-200/80",
            )}
          >
            <Layers className="w-4 h-4" />
            {isCollapsed && (
              <span className="text-sm font-medium">{slides.length}</span>
            )}
          </button>
        </ToolTip>
      </div>

      {/* Side panel */}
      <aside
        className={cn(
          "fixed xl:relative h-full z-50 xl:z-auto",
          "transition-all duration-300 ease-out",
          // Desktop behavior
          "xl:translate-x-0",
          isCollapsed ? "xl:w-0 xl:opacity-0" : "xl:w-[240px] xl:opacity-100",
          // Mobile behavior
          isMobilePanelOpen
            ? "translate-x-0 left-0"
            : "-translate-x-full left-0",
        )}
      >
        <div
          className={cn(
            "w-[260px] xl:w-[240px] h-[calc(100vh-200px)] flex flex-col",
            "bg-bg-100/95 xl:bg-bg-100 backdrop-blur-xl xl:backdrop-blur-none",
            "border-r xl:border border-bg-200 xl:rounded-xl",
            "shadow-2xl xl:shadow-none",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-bg-200/60">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-text-400" />
              <span className="text-sm font-medium text-text-200">Slides</span>
              <span className="text-xs text-text-500 bg-bg-200/60 px-1.5 py-0.5 rounded-md tabular-nums">
                {slides.length}
              </span>
            </div>

            <button
              onClick={handleToggle}
              className="p-1.5 rounded-lg text-text-400 hover:text-text-200 hover:bg-bg-200/60 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Slides list */}
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 custom_scrollbar"
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={slides.map(
                  (slide: any) => slide.id || `slide-${slide.index}`,
                )}
                strategy={verticalListSortingStrategy}
              >
                {slides.map((slide: any, index: number) => (
                  <div
                    key={slide.id || `slide-${index}`}
                    data-slide-index={index}
                  >
                    <SortableSlideItem
                      slide={slide}
                      index={index}
                      isActive={activeSlide === index}
                      onSlideClick={onSlideClick}
                      renderSlideContent={renderSlideContent}
                      isStreaming={!!isStreaming}
                    />
                  </div>
                ))}
              </SortableContext>

              {/* Drag overlay for better visual feedback */}
              <DragOverlay adjustScale={false}>
                {activeSlideData ? (
                  <div className="opacity-90 rounded-xl overflow-hidden shadow-2xl border-2 border-accent">
                    <div className="aspect-video bg-bg-200">
                      <ScaledSlidePreview className="w-full h-full">
                        {renderSlideContent(activeSlideData, false)}
                      </ScaledSlidePreview>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>

          {/* Footer with keyboard hint */}
          <div className="px-4 py-2 border-t border-bg-200/60">
            <p className="text-[10px] text-text-500 text-center">
              Drag to reorder • Click to navigate
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SidePanel;
