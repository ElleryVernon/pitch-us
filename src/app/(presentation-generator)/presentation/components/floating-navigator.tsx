"use client";

import React, { useState } from "react";
import { ChevronUp, ChevronDown, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";
import ToolTip from "@/components/tool-tip";

interface FloatingNavigatorProps {
  currentSlide: number;
  totalSlides: number;
  onNavigate: (index: number) => void;
  className?: string;
}

/**
 * Floating slide navigator component
 * Shows current slide position and provides quick navigation controls
 * Positioned at bottom-right of the viewport
 */
const FloatingNavigator: React.FC<FloatingNavigatorProps> = ({
  currentSlide,
  totalSlides,
  onNavigate,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const canGoPrevious = currentSlide > 0;
  const canGoNext = currentSlide < totalSlides - 1;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onNavigate(currentSlide - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onNavigate(currentSlide + 1);
    }
  };

  const handleJumpToSlide = (index: number) => {
    onNavigate(index);
    setIsExpanded(false);
  };

  return (
    <div
      className={cn(
        "fixed right-6 bottom-6 z-40 flex flex-col items-end gap-2",
        className,
      )}
    >
      {/* Expanded slide selector */}
      {isExpanded && (
        <div className="bg-bg-100 rounded-xl border border-bg-200 shadow-sm p-2 mb-1 max-h-[280px] overflow-y-auto custom_scrollbar">
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => handleJumpToSlide(index)}
                className={cn(
                  "w-8 h-8 rounded-md text-xs font-medium tabular-nums transition-all duration-150",
                  index === currentSlide
                    ? "bg-accent text-white"
                    : "bg-bg-200/50 text-text-400 hover:bg-bg-200 hover:text-text-300",
                )}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main navigator - minimal pill design */}
      <div className="flex items-center bg-bg-100 rounded-lg border border-bg-200 shadow-sm overflow-hidden">
        {/* Previous button */}
        <ToolTip content="Previous (↑)">
          <button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className={cn(
              "p-2 transition-colors",
              canGoPrevious
                ? "text-text-400 hover:text-text-200 hover:bg-bg-200/50"
                : "text-text-500/50 cursor-not-allowed",
            )}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </ToolTip>

        {/* Slide counter */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-2.5 py-1.5 hover:bg-bg-200/50 transition-colors border-x border-bg-200"
        >
          <span className="text-sm font-medium text-text-200 tabular-nums">
            {currentSlide + 1}
          </span>
          <span className="text-text-400 mx-0.5">/</span>
          <span className="text-sm text-text-400 tabular-nums">
            {totalSlides}
          </span>
        </button>

        {/* Next button */}
        <ToolTip content="Next (↓)">
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={cn(
              "p-2 transition-colors",
              canGoNext
                ? "text-text-400 hover:text-text-200 hover:bg-bg-200/50"
                : "text-text-500/50 cursor-not-allowed",
            )}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </ToolTip>
      </div>
    </div>
  );
};

export default FloatingNavigator;
