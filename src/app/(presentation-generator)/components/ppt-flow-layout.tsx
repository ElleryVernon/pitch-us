/**
 * Presentation flow layout component for consistent page structure.
 *
 * This component provides a standardized layout wrapper for presentation-related
 * pages (outline, presentation editing, PDF maker, etc.). It includes:
 * - Fixed back button in top-left corner
 * - Optional floating action buttons in top-right
 * - Optional top slot for page-specific header content
 * - Responsive wrapper with configurable width constraints
 * - Claude theme styling for consistent visual design
 *
 * The component uses Next.js router for default back navigation but allows
 * custom back handlers. It supports both wrapped (with max-width constraints)
 * and full-width layouts based on the `useWrapper` prop.
 */

"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Wrapper from "@/components/wrapper";
import { cn } from "@/lib/utils";

/**
 * Props for the PptFlowLayout component.
 *
 * @property children - Main content to render inside the layout.
 * @property topSlot - Optional React node rendered above the main content.
 *   Typically used for page headers, titles, or action buttons.
 * @property floatingActions - Optional React node rendered as fixed floating
 *   element in top-right corner. Used for quick actions or status indicators.
 * @property onBack - Optional custom back button handler. If not provided,
 *   defaults to router.push("/") to navigate to home page.
 * @property showBackButton - Whether to display the back button. Defaults to true.
 * @property narrow - Whether to use narrow width constraints in the wrapper.
 *   Only applies when useWrapper is true. Defaults to true.
 * @property useWrapper - Whether to wrap content in the Wrapper component with
 *   max-width constraints. If false, content spans full width. Defaults to true.
 * @property wrapperClassName - Additional CSS classes for the wrapper container.
 * @property contentClassName - Additional CSS classes for the content container.
 */
type PptFlowLayoutProps = {
  children: React.ReactNode;
  topSlot?: React.ReactNode;
  floatingActions?: React.ReactNode;
  onBack?: () => void;
  showBackButton?: boolean;
  narrow?: boolean;
  useWrapper?: boolean;
  wrapperClassName?: string;
  contentClassName?: string;
};

/**
 * Presentation flow layout component.
 *
 * Renders a full-screen layout with back button, optional floating actions,
 * and configurable content wrapper. Used across presentation-related pages
 * for consistent structure and navigation.
 *
 * @param props - Component props containing children, slots, and configuration.
 * @returns JSX element containing the layout structure with navigation controls.
 */
const PptFlowLayout = ({
  children,
  topSlot,
  floatingActions,
  onBack,
  showBackButton = true,
  narrow = true,
  useWrapper = true,
  wrapperClassName,
  contentClassName,
}: PptFlowLayoutProps) => {
  const router = useRouter();
  
  /**
   * Handles back button click.
   *
   * Uses custom onBack handler if provided, otherwise navigates to home page
   * using Next.js router.
   */
  const handleBack = onBack ?? (() => router.push("/"));

  /**
   * Main content structure combining topSlot and children.
   *
   * TopSlot is rendered above children with margin-bottom for spacing.
   * Children are wrapped in a flex container that fills available space.
   */
  const content = (
    <>
      {topSlot && <div className="mb-6">{topSlot}</div>}
      <div className={cn("flex-1 min-h-0 flex flex-col", contentClassName)}>
        {children}
      </div>
    </>
  );

  return (
    <div className="claude-theme min-h-screen bg-bg-0 text-text-100 relative">
      {showBackButton && (
        <button
          onClick={handleBack}
          className="fixed top-5 left-5 z-50 p-2 rounded-lg bg-bg-100 border border-bg-200 text-text-400 hover:text-text-200 hover:bg-bg-200/50 hover:border-bg-300 transition-all duration-200"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      {floatingActions && (
        <div className="fixed top-5 right-5 z-50">{floatingActions}</div>
      )}

      {useWrapper ? (
        <Wrapper
          className={cn(
            "min-h-screen py-14 sm:py-16 flex flex-col w-full",
            wrapperClassName,
          )}
          narrow={narrow}
        >
          {content}
        </Wrapper>
      ) : (
        <div
          className={cn("min-h-screen flex flex-col w-full", wrapperClassName)}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default PptFlowLayout;
