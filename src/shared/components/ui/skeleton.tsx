/**
 * Skeleton loading placeholder component.
 *
 * A simple component that displays a pulsing placeholder to indicate content
 * is loading. Uses a pulse animation and semi-transparent background to create
 * a "skeleton" effect that mimics the shape of content that will appear.
 */

import { cn } from "@/lib/utils";

/**
 * Skeleton loading placeholder.
 *
 * Renders a div with a pulsing animation and semi-transparent background.
 * Used as a placeholder while content is loading to improve perceived
 * performance. Can be styled with className to match the dimensions and
 * shape of the content it represents.
 *
 * @param className - Additional CSS classes to apply. Use this to set
 *   width, height, and shape to match the loading content.
 * @param props - All standard HTML div attributes.
 * @returns A div element with pulse animation.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  );
}

export { Skeleton };
