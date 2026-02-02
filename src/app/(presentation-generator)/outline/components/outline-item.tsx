/**
 * Individual outline item component for a single slide outline.
 *
 * This component represents one slide in the outline list. It supports:
 * - Drag-and-drop reordering via @dnd-kit
 * - Inline markdown editing when not streaming
 * - Real-time streaming text animation during outline generation
 * - Auto-scroll to active slide during streaming
 * - Delete functionality
 *
 * The component switches between three rendering modes:
 * 1. Streaming mode: Shows animated text streaming in character-by-character
 * 2. Stable streaming mode: Shows completed markdown for previously streamed slides
 * 3. Edit mode: Shows markdown editor for manual editing
 *
 * During streaming, the active slide is highlighted and auto-scrolled into view.
 * Drag-and-drop is disabled during streaming to prevent conflicts.
 */

import { Trash2, GripVertical, Loader2 } from "lucide-react";
import ToolTip from "@/components/tool-tip";
import dynamic from "next/dynamic";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from "react";
import { OutlineSlide as OutlineItemType } from "../types/index";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Dynamically import markdown editor to avoid SSR issues
// The editor uses browser-only APIs and should not be server-rendered
const MarkdownEditor = dynamic(
  () => import("../../components/markdown-editor"),
  { ssr: false },
);

/**
 * Props for the OutlineItem component.
 *
 * @property slideOutline - The outline slide data containing id and content.
 * @property index - 1-based index of this slide (for display numbering).
 * @property itemId - Unique identifier for this item (used for drag-and-drop).
 * @property isStreaming - Whether outlines are currently being streamed.
 *   Disables editing and drag during streaming.
 * @property isActiveStreaming - Whether this specific slide is currently
 *   being streamed. Triggers streaming animation and auto-scroll.
 * @property isStableStreaming - Whether this slide has completed streaming
 *   but streaming is still active for other slides. Shows stable markdown.
 * @property disableAutoScroll - Whether to disable auto-scroll to this item.
 *   Used during drag operations to prevent scroll conflicts.
 * @property isDragSource - Whether this item is currently being dragged.
 *   Used to apply drag styling.
 * @property onChange - Callback invoked when slide content is edited.
 *   Receives item ID and new content string.
 * @property onDelete - Callback invoked when slide is deleted.
 *   Receives the item ID to delete.
 */
interface OutlineItemProps {
  slideOutline: OutlineItemType;
  index: number;
  itemId: string;
  isStreaming: boolean;
  isActiveStreaming?: boolean;
  isStableStreaming?: boolean;
  disableAutoScroll?: boolean;
  /** True when this item is the source of an active drag (managed by parent) */
  isDragSource?: boolean;
  onChange: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Streaming text component for character-by-character text animation.
 *
 * This component animates text appearing character-by-character to simulate
 * real-time streaming from an LLM. It uses requestAnimationFrame for smooth
 * 60fps animation and handles both extending content (new characters added)
 * and completely new content (reset and animate from start).
 *
 * Features:
 * - Character-by-character reveal animation
 * - Maintains layout by rendering invisible remaining text
 * - Shows typing cursor indicator during animation
 * - Handles content extension vs replacement
 *
 * The animation is optimized to show 1 character per frame for natural
 * streaming feel, similar to Gemini/Cursor AI interfaces.
 *
 * @property content - The full text content to display (may be partial during streaming).
 * @property isActive - Whether this is actively streaming. When false, shows
 *   full content immediately without animation.
 */
const StreamingText: React.FC<{ content: string; isActive: boolean }> = ({
  content,
  isActive,
}) => {
  const [displayedLength, setDisplayedLength] = useState(0);
  const prevContentRef = useRef<string>("");
  const animationRef = useRef<number | null>(null);

  /**
   * Effect hook that manages the streaming animation.
   *
   * When actively streaming, animates text character-by-character. Detects
   * whether content is extending (new characters added) or completely replaced
   * (reset animation). Uses requestAnimationFrame for smooth 60fps animation.
   *
   * When not actively streaming, immediately shows full content without animation.
   */
  useEffect(() => {
    if (!isActive) {
      // Not actively streaming - show full content immediately
      setDisplayedLength(content.length);
      prevContentRef.current = content;
      return;
    }

    const prevContent = prevContentRef.current;
    const prevLen = prevContent.length;

    // Check if content is extending (streaming) vs completely new
    // Extending: new content starts with previous content (typical streaming)
    // New: content is completely different (reset required)
    const isExtending = content.startsWith(prevContent);

    if (isExtending) {
      // Content is being extended - animate only the new characters
      // Start from where we left off to avoid re-animating existing text
      const startFrom = prevLen;
      let currentLen = startFrom;

      const animate = () => {
        if (currentLen < content.length) {
          // Animate 1 character per frame for true streaming feel
          // This creates smooth character-by-character reveal
          currentLen = Math.min(currentLen + 1, content.length);
          setDisplayedLength(currentLen);
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Completely new content - reset and animate from start
      // This handles cases where content is replaced entirely
      setDisplayedLength(0);
      let currentLen = 0;

      const animate = () => {
        if (currentLen < content.length) {
          currentLen = Math.min(currentLen + 1, content.length);
          setDisplayedLength(currentLen);
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    // Update previous content reference for next comparison
    prevContentRef.current = content;

    // Cleanup: cancel animation frame on unmount or content change
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [content, isActive]);

  const displayedContent = content.slice(0, displayedLength);
  const remainingContent = content.slice(displayedLength);

  return (
    <div className="relative">
      <div className="text-sm font-normal prose prose-sm max-w-none text-text-200 leading-relaxed prose-p:my-0 prose-ul:my-0 prose-ol:my-0 transition-opacity duration-150">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {displayedContent}
        </ReactMarkdown>
      </div>
      {/* Invisible remaining text to maintain layout */}
      {remainingContent && (
        <span className="invisible" aria-hidden="true">
          {remainingContent}
        </span>
      )}
      {/* Typing cursor indicator */}
      {isActive && displayedLength < content.length && (
        <span className="inline-block w-0.5 h-4 bg-accent/60 animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
};

/**
 * Main outline item component.
 *
 * Renders a single outline slide with drag-and-drop, editing, and streaming
 * support. Handles three rendering modes based on streaming state and manages
 * auto-scroll to active slides during generation.
 *
 * @param props - Component props containing slide data, state flags, and callbacks.
 * @returns JSX element containing the outline item with appropriate rendering mode.
 */
const OutlineItemComponent = ({
  index,
  itemId,
  slideOutline,
  isStreaming,
  isActiveStreaming = false,
  isStableStreaming = false,
  disableAutoScroll = false,
  isDragSource = false,
  onChange,
  onDelete,
}: OutlineItemProps) => {
  // Configure drag-and-drop using @dnd-kit sortable hook
  // Disabled during streaming to prevent conflicts
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: itemId,
    disabled: isStreaming,
  });
  
  // Apply transform and transition styles for drag animation
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  /**
   * Auto-scroll effect for active streaming slide.
   *
   * When a slide is actively being streamed, automatically scrolls it into
   * view (centered) so users can see the content being generated. Disabled
   * during drag operations to prevent scroll conflicts.
   */
  useEffect(() => {
    if (isStreaming && isActiveStreaming && !disableAutoScroll) {
      const outlineItem = document.getElementById(`outline-item-${itemId}`);
      if (outlineItem) {
        outlineItem.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    }
  }, [
    isStreaming,
    isActiveStreaming,
    disableAutoScroll,
    itemId,
    slideOutline.content,
  ]);

  /**
   * Handles slide content changes from markdown editor.
   *
   * Prevents editing during streaming and calls onChange callback.
   *
   * @param newOutline - New content string from editor.
   */
  const handleSlideChange = (newOutline: string) => {
    if (isStreaming) return;
    onChange(itemId, newOutline);
  };

  /**
   * Handles slide deletion.
   *
   * Prevents deletion during streaming and calls onDelete callback.
   */
  const handleSlideDelete = () => {
    if (isStreaming) return;
    onDelete(itemId);
  };

  // Determine if this item is currently being dragged
  // True if either this component's drag state or parent's drag source flag
  const isDragActive = isDragSource || isDragging;

  /**
   * Memoized stable markdown content for completed slides during streaming.
   *
   * When streaming is active but this slide has completed, we show stable
   * markdown instead of re-animating. This improves performance and prevents
   * flicker for slides that are already complete.
   *
   * Returns null if:
   * - Not streaming
   * - This is the active streaming slide (should use StreamingText)
   * - This slide hasn't stabilized yet
   */
  const stableMarkdown = useMemo(() => {
    if (!isStreaming || isActiveStreaming) return null;
    if (!isStableStreaming) return null;
    return slideOutline.content || "";
  }, [isStreaming, isActiveStreaming, isStableStreaming, slideOutline.content]);

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, touchAction: "auto" }}
      className={`
        group relative mb-3 rounded-xl border bg-bg-100 
        transition-all duration-200 ease-out
        ${
          isDragActive
            ? "border-bg-300 bg-bg-50 shadow-lg scale-[1.02] z-50"
            : isActiveStreaming
              ? "border-accent/40 shadow-md shadow-accent/5 ring-1 ring-accent/10"
              : "border-bg-200/80 hover:border-bg-300 hover:shadow-sm"
        }
      `}
    >
      <div className="flex items-stretch">
        {/* Left: Number Badge + Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className={`
            flex flex-col items-center justify-center px-3 sm:px-4 py-4
            border-r border-bg-200/60 cursor-grab active:cursor-grabbing
            transition-colors duration-200 select-none
            ${isActiveStreaming ? "bg-accent/5" : "bg-bg-100/50 hover:bg-bg-200/30"}
          `}
          style={{ touchAction: "none" }}
        >
          <div
            className={`
            w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold
            transition-all duration-300
            ${
              isActiveStreaming
                ? "bg-accent text-white shadow-sm"
                : "bg-bg-200/80 text-text-300"
            }
          `}
          >
            {isActiveStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              index
            )}
          </div>
          <GripVertical
            className={`w-4 h-4 mt-2 transition-opacity duration-200 ${
              isStreaming ? "opacity-20" : "opacity-40 group-hover:opacity-70"
            }`}
          />
        </div>

        {/* Center: Content Area */}
        <div
          id={`outline-item-${itemId}`}
          className="flex-1 min-w-0 px-4 py-4 min-h-[80px]"
        >
          {isStreaming ? (
            isActiveStreaming ? (
              // Active streaming - use smooth streaming text
              <StreamingText
                content={slideOutline.content || ""}
                isActive={true}
              />
            ) : stableMarkdown ? (
              // Completed streaming item
              <div className="text-sm font-normal prose prose-sm max-w-none text-text-200 leading-relaxed prose-p:my-0 prose-ul:my-0 prose-ol:my-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {stableMarkdown}
                </ReactMarkdown>
              </div>
            ) : (
              // Fallback plain text
              <p className="text-sm font-normal text-text-200 leading-relaxed">
                {slideOutline.content || ""}
              </p>
            )
          ) : (
            // Editable mode
            <MarkdownEditor
              key={itemId}
              content={slideOutline.content || ""}
              onChange={(content) => handleSlideChange(content)}
            />
          )}
        </div>

        {/* Right: Actions */}
        <div
          className={`
          flex items-start px-2 sm:px-3 py-4 
          transition-opacity duration-200
          ${isStreaming ? "opacity-30 pointer-events-none" : "opacity-0 group-hover:opacity-100"}
        `}
        >
          <ToolTip content="Delete Slide">
            <button
              onClick={handleSlideDelete}
              disabled={isStreaming}
              className="p-2 rounded-lg text-text-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </ToolTip>
        </div>
      </div>

      {/* Active streaming indicator bar */}
      {isActiveStreaming && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent/20 overflow-hidden rounded-b-xl">
          <div className="h-full bg-accent/60 animate-pulse w-full" />
        </div>
      )}
    </div>
  );
};

export const OutlineItem = memo(OutlineItemComponent);
