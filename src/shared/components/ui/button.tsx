/**
 * Button component with multiple variants and sizes.
 *
 * A flexible button component built on Radix UI's Slot primitive, supporting
 * multiple visual variants (default, destructive, outline, secondary, ghost, link)
 * and sizes (default, sm, lg, icon). Uses class-variance-authority for variant
 * management and supports composition via the asChild prop.
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Button variant definitions using class-variance-authority.
 *
 * Defines all available button styles and sizes with their corresponding
 * Tailwind CSS classes. Variants control the visual appearance (colors,
 * borders, shadows), while sizes control dimensions and padding.
 *
 * Variants:
 * - default: Primary button with solid background and shadow
 * - destructive: Red/danger button for destructive actions
 * - outline: Button with border and transparent background
 * - secondary: Secondary button with muted colors
 * - ghost: Transparent button with hover background
 * - link: Text button styled as a link
 *
 * Sizes:
 * - default: Standard height (h-9) with medium padding
 * - sm: Small height (h-8) with reduced padding
 * - lg: Large height (h-10) with increased padding
 * - icon: Square button (h-9 w-9) for icon-only buttons
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/**
 * Props interface for the Button component.
 *
 * Extends standard button HTML attributes and adds variant/size props from
 * class-variance-authority. Supports composition via the asChild prop.
 *
 * @property variant - Visual style variant (default, destructive, outline, etc.).
 * @property size - Size variant (default, sm, lg, icon).
 * @property asChild - If true, renders as a Slot instead of a button element.
 *   Allows the button styles to be applied to a child element (e.g., a Link).
 */
export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * Button component with variant and size support.
 *
 * A flexible, accessible button component that supports multiple visual styles
 * and sizes. Uses forwardRef for proper ref forwarding and supports composition
 * via the asChild prop for use with Next.js Link or other components.
 *
 * The component applies appropriate classes based on variant and size props,
 * handles focus states, disabled states, and includes proper accessibility
 * attributes. SVG icons within buttons are automatically sized and styled.
 *
 * @param className - Optional additional CSS classes. Merged with variant classes.
 * @param variant - Visual style variant. Defaults to "default".
 * @param size - Size variant. Defaults to "default".
 * @param asChild - If true, renders as Slot to compose with child components.
 * @param props - All other standard button HTML attributes (onClick, disabled, etc.).
 * @param ref - Forwarded ref to the underlying button element.
 * @returns A button element (or Slot if asChild is true) with appropriate
 *   styling and behavior.
 *
 * @example
 * ```tsx
 * <Button variant="default" size="lg">Click Me</Button>
 * <Button variant="destructive" onClick={handleDelete}>Delete</Button>
 * <Button asChild>
 *   <Link href="/page">Navigate</Link>
 * </Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
