/**
 * Full-screen overlay loader component with optional progress bar.
 *
 * A modal-style loading overlay that covers the entire screen with a semi-transparent
 * backdrop. Displays a CSS-based loading animation and optional progress bar. Used for
 * blocking operations like file uploads, document processing, or presentation generation.
 *
 * The loader uses pure CSS animations instead of GIF images for better performance
 * and smaller bundle size.
 */

import { cn } from "@/lib/utils";
import { ProgressBar } from "./progress-bar";
import { useEffect, useState } from "react";

/**
 * Props for the OverlayLoader component.
 *
 * @property text - Main text to display below the loading animation.
 *   Describes what operation is in progress.
 * @property className - Additional CSS classes to apply to the modal container.
 * @property show - Whether the loader should be visible. When false, component
 *   returns null (unmounted).
 * @property showProgress - Whether to display a progress bar below the loading
 *   animation. Defaults to false.
 * @property duration - Duration in seconds for the progress bar animation.
 *   Only used if showProgress is true. Defaults to 10 seconds.
 * @property extra_info - Optional additional information text displayed below
 *   the main text. Used for secondary details or status updates.
 * @property onProgressComplete - Optional callback called when the progress bar
 *   reaches completion. Only used if showProgress is true.
 */
interface OverlayLoaderProps {
  text?: string;
  className?: string;
  show: boolean;
  showProgress?: boolean;
  duration?: number;
  extra_info?: string;
  onProgressComplete?: () => void;
}

/**
 * Full-screen overlay loader with optional progress bar.
 *
 * Displays a modal overlay with a CSS-based spinning animation and optional
 * progress bar. The overlay covers the entire screen with a semi-transparent
 * backdrop, blocking user interaction until the operation completes. Uses pure
 * CSS animations for better performance and smaller bundle size. Includes smooth
 * fade and scale animations when showing/hiding.
 *
 * @param text - Main loading message text.
 * @param className - Additional CSS classes for the modal.
 * @param show - Controls visibility of the loader.
 * @param showProgress - Whether to show progress bar.
 * @param duration - Progress bar duration in seconds.
 * @param extra_info - Additional information text.
 * @param onProgressComplete - Callback when progress completes.
 * @returns A full-screen overlay with loading animation and optional progress.
 */
export const OverlayLoader = ({
  text,
  className,
  show,
  showProgress = false,
  duration = 10,
  onProgressComplete,
  extra_info,
}: OverlayLoaderProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div
      style={{
        zIndex: 1000,
      }}
      className={cn(
        "fixed inset-0 bg-black/70 z-50 flex items-center justify-center transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center px-6  pt-0 pb-8 rounded-xl bg-[#030303] shadow-2xl",
          "min-w-[280px] sm:min-w-[330px] border border-white/10 transition-all duration-400 ease-out",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90",
          className,
        )}
      >
        {/* CSS-based animated loader */}
        <div className="w-[200px] h-[200px] flex items-center justify-center">
          <div className="relative w-24 h-24">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 rounded-full border-4 border-white/10" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 animate-spin" />
            {/* Middle pulsing ring */}
            <div className="absolute inset-3 rounded-full border-2 border-transparent border-t-emerald-300/60 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
            {/* Inner dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        </div>
        {showProgress ? (
          <div className="w-full space-y-6 pt-4">
            <ProgressBar duration={duration} onComplete={onProgressComplete} />
            {text && (
              <div className="space-y-1">
                <p className="text-white text-base text-center font-semibold font-inter">
                  {text}
                </p>
                {extra_info && (
                  <p className="text-white/80 text-xs text-center font-semibold font-inter">
                    {extra_info}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="text-white text-base text-center font-semibold font-inter">
              {text}
            </p>
            {extra_info && (
              <p className="text-white/80 text-xs text-center font-semibold font-inter">
                {extra_info}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
