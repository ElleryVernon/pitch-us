/**
 * Outline content component for displaying and managing presentation outlines.
 *
 * This component provides the main interface for viewing and editing presentation
 * outlines. It supports drag-and-drop reordering, real-time streaming updates,
 * and skeleton loading states during outline generation.
 *
 * Key features:
 * - Drag-and-drop reordering of outline slides using @dnd-kit
 * - Real-time streaming display during outline generation
 * - Skeleton placeholders to prevent layout shift
 * - Inline editing of outline content
 * - Add/delete slide functionality
 * - Status indicators for loading and streaming states
 *
 * The component manages local state for drag operations and syncs with parent
 * state when drag operations complete. During streaming, it shows skeleton
 * cards for expected slides and highlights the actively streaming slide.
 */

"use client";
import React, { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragCancelEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { OutlineItem } from "./outline-item";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";
import { OutlineSlide as OutlineItemType } from "../types/index";

/**
 * Default number of slides to expect during initial outline generation.
 *
 * Used to render skeleton placeholders before actual outlines are received.
 * Prevents layout shift by reserving space for expected slides.
 */
const EXPECTED_SLIDE_COUNT = 10;

/**
 * Props for the OutlineContent component.
 *
 * @property outlines - Array of outline slides to display, or null if not loaded.
 * @property isLoading - Whether outlines are currently being loaded from the server.
 * @property isStreaming - Whether outlines are being streamed in real-time from LLM.
 * @property activeSlideIndex - Index of the slide currently being streamed, or null
 *   if not streaming. Used to highlight the active slide during generation.
 * @property highestActiveIndex - Highest index that has been streamed so far.
 *   Used to determine which slides are stable vs still being generated.
 * @property expectedSlideCount - Expected number of slides during generation.
 *   Used to render skeleton placeholders. Defaults to EXPECTED_SLIDE_COUNT.
 * @property onReorder - Callback invoked when slides are reordered via drag-and-drop.
 *   Receives the new ordered array of outlines.
 * @property onUpdateSlide - Callback invoked when slide content is edited.
 *   Receives slide ID and new content string.
 * @property onDeleteSlide - Callback invoked when a slide is deleted.
 *   Receives the ID of the slide to delete.
 * @property onAddSlide - Callback invoked when user clicks "Add Slide" button.
 * @property statusMessage - Optional status message to display during loading/streaming.
 *   Falls back to default messages if not provided.
 */
interface OutlineContentProps {
  outlines: OutlineItemType[] | null;
  isLoading: boolean;
  isStreaming: boolean;
  activeSlideIndex: number | null;
  highestActiveIndex: number;
  expectedSlideCount?: number;
  onReorder: (items: OutlineItemType[]) => void;
  onUpdateSlide: (id: string, content: string) => void;
  onDeleteSlide: (id: string) => void;
  onAddSlide: () => void;
  statusMessage?: string;
}

/**
 * Skeleton card component for placeholder slides during loading/streaming.
 *
 * Renders a placeholder card that maintains layout space for upcoming slides.
 * Prevents layout shift when new slides are added during streaming. Shows
 * different styling for the "next" slide (first skeleton) vs remaining slides.
 *
 * @property index - Slide number to display in the badge (1-based).
 * @property isNext - Whether this is the next slide to be generated.
 *   The first skeleton card uses different styling to indicate it's coming next.
 */
const SkeletonCard: React.FC<{ index: number; isNext?: boolean }> = ({
  index,
  isNext = false,
}) => (
  <div
    className={`
    mb-3 rounded-xl border bg-bg-100/50
    transition-all duration-500 ease-out
    ${isNext ? "border-accent/20 opacity-60" : "border-bg-200/40 opacity-30"}
  `}
  >
    <div className="flex items-stretch">
      {/* Left: Number Badge */}
      <div className="flex flex-col items-center justify-center px-3 sm:px-4 py-4 border-r border-bg-200/30">
        <div
          className={`
          w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold
          ${isNext ? "bg-accent/10 text-accent/60" : "bg-bg-200/50 text-text-400/50"}
        `}
        >
          {isNext ? <Sparkles className="w-4 h-4 animate-pulse" /> : index}
        </div>
        <div className="w-4 h-4 mt-2 opacity-20" />
      </div>

      {/* Center: Skeleton Content */}
      <div className="flex-1 min-w-0 px-4 py-4 min-h-[80px]">
        <div className="space-y-2">
          <div
            className={`h-4 rounded ${isNext ? "bg-accent/10 animate-pulse" : "bg-bg-200/40"}`}
            style={{ width: `${60 + Math.random() * 30}%` }}
          />
          <div
            className={`h-3 rounded ${isNext ? "bg-accent/5" : "bg-bg-200/30"}`}
            style={{ width: `${40 + Math.random() * 40}%` }}
          />
        </div>
      </div>

      {/* Right: Placeholder */}
      <div className="px-2 sm:px-3 py-4 opacity-0">
        <div className="w-8 h-8" />
      </div>
    </div>
  </div>
);

/**
 * Main outline content component.
 *
 * Renders the list of outline slides with drag-and-drop reordering, streaming
 * support, and skeleton loading states. Manages local state during drag
 * operations to provide smooth UX without blocking parent updates.
 *
 * @param props - Component props containing outlines, state flags, and callbacks.
 * @returns JSX element containing the outline list with drag-and-drop support.
 */
const OutlineContent: React.FC<OutlineContentProps> = ({
  outlines,
  isLoading,
  isStreaming,
  activeSlideIndex,
  highestActiveIndex,
  expectedSlideCount,
  onReorder,
  onUpdateSlide,
  onDeleteSlide,
  onAddSlide,
  statusMessage,
}) => {
  const pathname = usePathname();
  
  // Local state for drag-and-drop operations
  // Prevents parent updates during drag to avoid conflicts
  const [localOutlines, setLocalOutlines] = useState<OutlineItemType[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Resolve expected slide count, ensuring minimum of 1
  const resolvedExpectedCount = Math.max(
    1,
    expectedSlideCount ?? EXPECTED_SLIDE_COUNT,
  );

  // Sync local outlines with parent outlines, but not during drag operations
  // This allows smooth dragging without parent state updates interfering
  useEffect(() => {
    if (!outlines) {
      setLocalOutlines([]);
      return;
    }
    // Only sync when not dragging to avoid conflicts with drag state
    if (!isDragging) {
      setLocalOutlines(outlines);
    }
  }, [outlines, isDragging]);

  // Configure drag-and-drop sensors
  // PointerSensor: Activates after 8px movement to prevent accidental drags
  // KeyboardSensor: Enables keyboard navigation for accessibility
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /**
   * Handles the start of a drag operation.
   *
   * Prevents dragging during streaming and sets local drag state.
   *
   * @param event - Drag start event from @dnd-kit.
   */
  const handleDragStart = (event: DragStartEvent) => {
    if (isStreaming) return;
    setIsDragging(true);
    setActiveId(event.active.id as string);
  };

  /**
   * Handles drag cancellation (e.g., ESC key or click outside).
   *
   * Resets drag state when drag is cancelled.
   *
   * @param _event - Drag cancel event (unused).
   */
  const handleDragCancel = (_event: DragCancelEvent) => {
    setIsDragging(false);
    setActiveId(null);
  };

  /**
   * Handles the end of a drag operation.
   *
   * Calculates new order and calls onReorder callback. Prevents reordering
   * during streaming and validates that drag target is valid.
   *
   * @param event - Drag end event containing active and over elements.
   */
  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    setActiveId(null);
    if (isStreaming) return;

    const { active, over } = event;
    // Ignore if dropped on same element or no valid target
    if (!over || active.id === over.id) return;

    // Find indices of dragged item and drop target
    const oldIndex = localOutlines.findIndex((item) => item.id === active.id);
    const newIndex = localOutlines.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    // Reorder array and update parent state
    const reordered = arrayMove(localOutlines, oldIndex, newIndex);
    setLocalOutlines(reordered);
    onReorder(reordered);
  };

  /**
   * Calculates how many skeleton placeholders to show during streaming.
   *
   * Shows skeletons for slides that haven't been generated yet to prevent
   * layout shift. Only active during streaming.
   */
  const remainingSkeletonCount = isStreaming
    ? Math.max(0, resolvedExpectedCount - localOutlines.length)
    : 0;

  const showStatus = isLoading || isStreaming;

  return (
    <div className="space-y-2 font-sans text-text-200">
      {/* Status indicator during loading/streaming */}
      <div className="flex items-center justify-center mb-4 h-10">
        <span
          className={`inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-2 text-sm text-accent transition-opacity duration-200 whitespace-nowrap max-w-full truncate ${
            showStatus ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-hidden={!showStatus}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          {statusMessage ||
            (isStreaming ? "Generating outline..." : "Thinking...")}
        </span>
      </div>

      {/* Initial skeleton state (before any content) */}
      {(isLoading || isStreaming) && localOutlines.length === 0 && (
        <div className="space-y-0">
          {[...Array(resolvedExpectedCount)].map((_, index) => (
            <SkeletonCard
              key={`skeleton-${index}`}
              index={index + 1}
              isNext={index === 0}
            />
          ))}
        </div>
      )}

      {/* Main content area */}
      {localOutlines.length > 0 && (
        <div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localOutlines.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div>
                {localOutlines.map((item, index) => (
                  <OutlineItem
                    key={item.id}
                    itemId={item.id}
                    index={index + 1}
                    slideOutline={item}
                    isStreaming={isStreaming}
                    isActiveStreaming={activeSlideIndex === index}
                    isStableStreaming={
                      highestActiveIndex >= 0 && index < highestActiveIndex
                    }
                    disableAutoScroll={isDragging}
                    isDragSource={activeId === item.id}
                    onChange={onUpdateSlide}
                    onDelete={onDeleteSlide}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Remaining skeleton slots during streaming (prevents layout shift) */}
          {isStreaming && remainingSkeletonCount > 0 && (
            <div className="space-y-0">
              {[...Array(remainingSkeletonCount)].map((_, index) => (
                <SkeletonCard
                  key={`remaining-skeleton-${index}`}
                  index={localOutlines.length + index + 1}
                  isNext={index === 0}
                />
              ))}
            </div>
          )}

          {/* Add slide button (kept for layout stability) */}
          <div
            className={`mt-4 transition-opacity duration-200 ${
              isStreaming ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
            aria-hidden={isStreaming}
          >
            <Button
              variant="outline"
              onClick={() => {
                trackEvent(MixpanelEvent.Outline_Add_Slide_Button_Clicked, {
                  pathname,
                });
                onAddSlide();
              }}
              disabled={isLoading || isStreaming}
              className="w-full rounded-xl border-bg-200 bg-bg-100 text-text-300 hover:border-bg-300 hover:bg-bg-200/60 hover:text-text-200 transition-colors"
            >
              + Add Slide
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isStreaming && !isLoading && localOutlines.length === 0 && (
        <div className="text-center py-12 bg-bg-100/80 rounded-2xl border border-dashed border-bg-200">
          <FileText className="w-12 h-12 text-text-400 mx-auto mb-4" />
          <p className="text-text-200 font-medium mb-2">No outlines yet</p>
          <p className="text-text-300 text-sm mb-6">
            Start by adding your first slide
          </p>
          <Button
            variant="outline"
            onClick={() => {
              trackEvent(MixpanelEvent.Outline_Add_Slide_Button_Clicked, {
                pathname,
              });
              onAddSlide();
            }}
            className="rounded-xl border-bg-200 bg-bg-100 text-text-300 hover:border-bg-300 hover:bg-bg-200/60 hover:text-text-200 transition-colors"
          >
            + Add First Slide
          </Button>
        </div>
      )}
    </div>
  );
};

export default OutlineContent;
