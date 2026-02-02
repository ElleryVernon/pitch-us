/**
 * Fallback loading component for the outline page.
 *
 * This component is displayed while the outline page is loading (e.g., during
 * Suspense boundary). It provides skeleton placeholders that match the layout
 * structure of the actual outline page to prevent layout shift.
 *
 * The skeleton includes:
 * - Header section with title and description placeholders
 * - Upload section placeholder
 * - Multiple outline item placeholders (5 items)
 * - Generate button placeholder
 *
 * Uses the same PptFlowLayout wrapper as the main page for consistent spacing
 * and structure.
 */

import PptFlowLayout from "../../components/ppt-flow-layout";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Fallback component shown during outline page loading.
 *
 * Renders skeleton placeholders matching the outline page structure. Used
 * by Next.js Suspense boundary to show loading state.
 *
 * @returns JSX element containing skeleton loading placeholders.
 */
export default function OutlineFallback() {
  return (
    <PptFlowLayout
      topSlot={
        <div className="space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
      }
      contentClassName="gap-6"
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Upload section skeleton */}
        <Skeleton className="w-full h-32 rounded-xl" />

        {/* Outline items skeleton */}
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-24 rounded-xl" />
        ))}

        {/* Generate button skeleton */}
        <Skeleton className="w-full h-12 rounded-full" />
      </div>
    </PptFlowLayout>
  );
}
