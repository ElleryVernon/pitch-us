/**
 * Progress bar component for displaying completion status.
 *
 * A progress indicator component built on Radix UI's Progress primitive,
 * displaying a visual representation of completion percentage. Used to
 * show loading progress, upload status, or any other percentage-based metric.
 */

"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

/**
 * Progress bar component.
 *
 * Displays a horizontal progress bar that fills from left to right based
 * on the provided value. The bar shows a visual indicator of completion
 * percentage with smooth transitions when the value changes.
 *
 * @param value - Progress value between 0 and 100. Determines how much
 *   of the bar is filled. If undefined, defaults to 0.
 * @param className - Additional CSS classes to apply.
 * @param props - All Radix UI ProgressRoot props (max, etc.).
 * @returns A styled progress bar element.
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
      className,
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
