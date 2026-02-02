/**
 * Textarea component for multi-line text input.
 *
 * A styled textarea component that provides consistent styling and behavior
 * across the application. Supports all standard HTML textarea attributes and
 * includes proper focus states, disabled states, and placeholder styling.
 */

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Props interface for the Textarea component.
 *
 * Extends all standard HTML textarea element attributes, allowing full control
 * over textarea behavior (placeholder, value, onChange, rows, cols, etc.).
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Textarea component with consistent styling.
 *
 * A styled multi-line text input component that provides a consistent look
 * and feel across the application. Includes proper border styling, focus states,
 * disabled states, and minimum height for usability.
 *
 * The component uses forwardRef for proper ref forwarding, allowing parent
 * components to access the underlying textarea element for focus management
 * or form integration.
 *
 * @param className - Optional additional CSS classes. Merged with default
 *   textarea classes using the cn utility.
 * @param props - All other standard textarea HTML attributes (placeholder,
 *   value, onChange, rows, disabled, etc.).
 * @param ref - Forwarded ref to the underlying textarea element.
 * @returns A textarea element with consistent styling and all provided props applied.
 *
 * @example
 * ```tsx
 * <Textarea placeholder="Enter your message" rows={5} />
 * <Textarea value={message} onChange={handleChange} />
 * ```
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
