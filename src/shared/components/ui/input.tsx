/**
 * Input component for text input fields.
 *
 * A styled input component that provides consistent styling and behavior
 * across the application. Supports all standard HTML input types and includes
 * proper focus states, disabled states, and file input styling.
 */

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Props interface for the Input component.
 *
 * Extends all standard HTML input element attributes, allowing full control
 * over input behavior (type, placeholder, value, onChange, etc.).
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Input component with consistent styling.
 *
 * A styled text input component that provides a consistent look and feel
 * across the application. Includes proper border styling, focus states,
 * disabled states, and special handling for file inputs.
 *
 * The component uses forwardRef for proper ref forwarding, allowing parent
 * components to access the underlying input element for focus management or
 * form integration.
 *
 * @param className - Optional additional CSS classes. Merged with default
 *   input classes using the cn utility.
 * @param type - HTML input type (text, email, password, file, etc.).
 *   Defaults to "text" if not specified.
 * @param props - All other standard input HTML attributes (placeholder,
 *   value, onChange, disabled, etc.).
 * @param ref - Forwarded ref to the underlying input element.
 * @returns An input element with consistent styling and all provided props applied.
 *
 * @example
 * ```tsx
 * <Input type="text" placeholder="Enter your name" />
 * <Input type="email" value={email} onChange={handleChange} />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
