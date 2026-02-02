/**
 * Card component and sub-components for content containers.
 *
 * Provides a card component system with header, title, description, content,
 * and footer sub-components. Cards are used throughout the application to
 * group related content with consistent styling, borders, and shadows.
 */

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Main Card container component.
 *
 * Creates a card container with rounded corners, border, background, and
 * shadow. Serves as the base component for card-based layouts. All card
 * sub-components should be children of this component.
 *
 * @param className - Optional additional CSS classes. Merged with default
 *   card classes.
 * @param props - All standard div HTML attributes.
 * @param ref - Forwarded ref to the underlying div element.
 * @returns A div element styled as a card container.
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Title</CardTitle>
 *     <CardDescription>Description</CardDescription>
 *   </CardHeader>
 *   <CardContent>Content goes here</CardContent>
 * </Card>
 * ```
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

/**
 * Card header section component.
 *
 * Container for card title and description. Provides consistent padding and
 * vertical spacing between header elements.
 *
 * @param className - Optional additional CSS classes.
 * @param props - Standard div HTML attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns A div element styled as a card header with flex column layout.
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/**
 * Card title component.
 *
 * Heading element for card titles. Uses semantic h3 element with bold,
 * tight leading, and appropriate font weight for prominence.
 *
 * @param className - Optional additional CSS classes.
 * @param props - Standard heading HTML attributes.
 * @param ref - Forwarded ref to the h3 element.
 * @returns An h3 element styled as a card title.
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/**
 * Card description component.
 *
 * Subtitle or description text for cards. Uses smaller font size and muted
 * color to provide secondary information below the title.
 *
 * @param className - Optional additional CSS classes.
 * @param props - Standard paragraph HTML attributes.
 * @param ref - Forwarded ref to the p element.
 * @returns A p element styled as a card description with muted text color.
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/**
 * Card content section component.
 *
 * Main content area of the card. Provides consistent padding with no top
 * padding (pt-0) to connect seamlessly with the header above.
 *
 * @param className - Optional additional CSS classes.
 * @param props - Standard div HTML attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns A div element styled as card content with appropriate padding.
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

/**
 * Card footer section component.
 *
 * Footer area for card actions or additional information. Provides consistent
 * padding and horizontal flex layout for action buttons or footer content.
 *
 * @param className - Optional additional CSS classes.
 * @param props - Standard div HTML attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns A div element styled as a card footer with flex layout and padding.
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
