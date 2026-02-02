/**
 * Animated progress bar component with gradient effect.
 *
 * A progress bar component that automatically animates from 0% to 95% over
 * a specified duration, with a smooth gradient animation effect. Used to
 * show loading progress with visual feedback. The progress slows down near
 * completion and caps at 95% until explicitly completed.
 */

"use client";
import React, { useEffect, useState, useRef } from "react";

/**
 * Props for the ProgressBar component.
 *
 * @property duration - Duration in seconds for the progress bar to reach
 *   95%. The bar will animate smoothly over this time period.
 * @property onComplete - Optional callback function called when the progress
 *   reaches 95%. Can be used to trigger completion actions or update state.
 */
interface ProgressBarProps {
  duration: number;
  onComplete?: () => void;
}

/**
 * Animated progress bar with gradient effect.
 *
 * Displays a progress bar that automatically fills from 0% to 95% over the
 * specified duration. Features a gradient animation effect and percentage
 * display. Progress slows down after 90% and stops at 95% until completion.
 * Uses requestAnimationFrame-like timing for smooth updates.
 *
 * @param duration - Duration in seconds for the animation.
 * @param onComplete - Callback called when progress reaches 95%.
 * @returns A progress bar element with gradient animation and percentage display.
 */
export const ProgressBar = ({ duration, onComplete }: ProgressBarProps) => {
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    const updateProgress = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime.current;
      const calculatedProgress = (elapsedTime / (duration * 1000)) * 100;

      if (calculatedProgress >= 95) {
        setProgress(95);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
        onComplete?.();
        return;
      }

      // Slow down progress after 90%
      if (calculatedProgress > 90) {
        const remainingProgress = Math.min(99 - progress, 0.1);
        setProgress((prev) => prev + remainingProgress);
      } else {
        setProgress(Math.min(calculatedProgress, 90));
      }
    };

    progressInterval.current = setInterval(updateProgress, 50);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [duration, onComplete]);

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-end items-center text-white/80 text-sm">
        {/* <span>Processing...</span> */}
        <span className="font-inter  text-end font-medium text-xs">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full bg-white rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-[#0A2A21] via-[#071A14] to-[#0A2A21] rounded-full animate-gradient transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            backgroundSize: "200% 100%",
          }}
        />
      </div>
      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          animation: gradient 2s linear infinite;
        }
      `}</style>
    </div>
  );
};
