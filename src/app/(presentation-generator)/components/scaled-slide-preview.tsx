"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ScaledSlidePreviewProps {
  children: React.ReactNode;
  slideWidth?: number; // default 1280
  slideHeight?: number; // default 720
  className?: string;
  /** If true, allows pointer events on the content (for edit mode) */
  interactive?: boolean;
  /**
   * Sizing mode:
   * - "width": Container width determines size (aspect ratio via padding-bottom) - default for thumbnails
   * - "contain": Fits within both width and height of container - use for fullscreen/presentation mode
   */
  mode?: "width" | "contain";
}

/**
 * A component that renders slide content at a fixed resolution and scales it to fit any container.
 * Similar to how Canva/Gamma handle slide previews.
 *
 * Key features:
 * - Renders content at fixed dimensions (default 1280x720)
 * - Scales down using CSS transform to fit container
 * - Maintains exact aspect ratio regardless of container size
 * - Uses ResizeObserver for responsive scaling
 */
const ScaledSlidePreview: React.FC<ScaledSlidePreviewProps> = ({
  children,
  slideWidth = 1280,
  slideHeight = 720,
  className,
  interactive = false,
  mode = "width",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isReady, setIsReady] = useState(false);

  const updateScale = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    if (containerWidth <= 0) return;

    if (mode === "width") {
      // Width-based scaling: scale based on container width only
      // Height is determined by aspect ratio (via padding-bottom)
      const newScale = containerWidth / slideWidth;
      setScale(newScale);
    } else {
      // Contain mode: fit within both width and height
      if (containerHeight <= 0) return;
      const scaleX = containerWidth / slideWidth;
      const scaleY = containerHeight / slideHeight;
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);
    }

    setIsReady(true);
  }, [slideWidth, slideHeight, mode]);

  useEffect(() => {
    // Initial calculation after mount
    // Use requestAnimationFrame to ensure DOM has rendered
    const rafId = requestAnimationFrame(() => {
      updateScale();
    });

    // Set up ResizeObserver for dynamic updates
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(updateScale);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [updateScale]);

  // For "width" mode, use padding-bottom for aspect ratio
  // For "contain" mode, use explicit dimensions
  const containerStyle: React.CSSProperties =
    mode === "width"
      ? {
          // Use padding-bottom trick for aspect ratio (more compatible than aspect-ratio)
          paddingBottom: `${(slideHeight / slideWidth) * 100}%`,
        }
      : {
          // For contain mode, the container should have explicit dimensions from parent
        };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        mode === "width" ? "w-full" : "w-full h-full",
        className,
      )}
      style={containerStyle}
    >
      {/* Absolutely positioned wrapper to center the scaled content */}
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden",
          mode === "width" ? "absolute inset-0" : "w-full h-full",
        )}
      >
        {/* The actual slide content at fixed dimensions, scaled down */}
        <div
          className={cn(
            "origin-center flex-shrink-0",
            !interactive && "pointer-events-none",
          )}
          style={{
            width: slideWidth,
            height: slideHeight,
            transform: `scale(${scale})`,
            // Use will-change for better performance during resize
            willChange: isReady ? "auto" : "transform",
            // Prevent content from being visible before scale is calculated
            opacity: isReady ? 1 : 0,
            transition: "opacity 0.15s ease-out",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ScaledSlidePreview;
