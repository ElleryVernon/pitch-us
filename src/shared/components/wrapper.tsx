/**
 * Layout wrapper component for consistent page width and padding.
 *
 * Provides a standardized container for page content with consistent margins,
 * padding, and maximum width constraints. Supports two width modes: standard
 * container width (1440px) and narrow content width (1280px).
 */

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

/**
 * Props for the Wrapper component.
 *
 * @property children - React nodes to render inside the wrapper.
 * @property className - Optional additional CSS classes to apply to the wrapper.
 *   Merged with default wrapper classes using the cn utility.
 * @property narrow - Whether to use narrow content width (1280px) instead of
 *   standard container width (1440px). Useful for content that benefits from
 *   a more focused reading width.
 */
interface WrapperProps {
  children: ReactNode;
  className?: string;
  /** Use content width (1280px) instead of container width (1440px) */
  narrow?: boolean;
}

/**
 * Wrapper component for consistent page layout.
 *
 * Creates a centered container with horizontal padding and a maximum width.
 * The container is centered using margin auto and includes responsive padding
 * (px-page-x). Width can be set to either container width (1440px) or content
 * width (1280px) based on the narrow prop.
 *
 * @param children - Content to render inside the wrapper.
 * @param className - Optional additional CSS classes.
 * @param narrow - Whether to use narrow width mode. Defaults to false.
 * @returns A div element with appropriate styling and width constraints.
 *
 * @example
 * ```tsx
 * <Wrapper>
 *   <h1>Page Content</h1>
 * </Wrapper>
 *
 * <Wrapper narrow>
 *   <article>Narrow content for better readability</article>
 * </Wrapper>
 * ```
 */
export default function Wrapper({
  children,
  className,
  narrow = false,
}: WrapperProps) {
  return (
    <div
      className={cn(
        "w-full mx-auto px-page-x",
        narrow ? "max-w-content" : "max-w-container",
        className,
      )}
    >
      {children}
    </div>
  );
}
