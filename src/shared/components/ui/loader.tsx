/**
 * Loading spinner component with optional text.
 *
 * Displays a spinning circular loader with optional text below. Used to
 * indicate that content is being loaded or an operation is in progress.
 * Features a green/emerald color scheme with smooth animation.
 */

import { cn } from "@/lib/utils";

/**
 * Props for the Loader component.
 *
 * @property text - Optional text to display below the spinner. Typically
 *   describes what is being loaded (e.g., "Loading slides...").
 * @property className - Additional CSS classes to apply to the container.
 */
interface LoaderProps {
  text?: string;
  className?: string;
}

/**
 * Loading spinner component.
 *
 * Renders a circular spinning loader with optional descriptive text. The
 * spinner uses a green/emerald color scheme and smooth rotation animation.
 * Text is displayed below the spinner if provided.
 *
 * @param text - Optional text to display below the spinner.
 * @param className - Additional CSS classes for the container.
 * @returns A div containing the spinner and optional text.
 */
export const Loader = ({ text, className }: LoaderProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="w-8 h-8 border-4 border-emerald-200 border-t-[#071A14] rounded-full animate-spin"></div>
      {text && (
        <p className="mt-4 text-white text-base font-inter font-semibold">
          {text}
        </p>
      )}
    </div>
  );
};
