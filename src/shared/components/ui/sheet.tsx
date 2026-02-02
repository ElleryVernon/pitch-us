/**
 * Sheet (side panel) component system.
 *
 * A slide-out panel component system built on Radix UI's Dialog primitive,
 * providing accessible side panels that slide in from any edge of the screen.
 * Commonly used for navigation menus, settings panels, or supplementary content.
 */

"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Root sheet component.
 *
 * Controls the sheet's open/closed state and behavior. Use this to wrap
 * SheetTrigger and SheetContent components.
 */
const Sheet = SheetPrimitive.Root;

/**
 * Sheet trigger component.
 *
 * The element that opens the sheet when clicked. Typically a button or
 * interactive element.
 */
const SheetTrigger = SheetPrimitive.Trigger;

/**
 * Sheet close component.
 *
 * A button or element that closes the sheet when activated. Can be placed
 * anywhere within the sheet content.
 */
const SheetClose = SheetPrimitive.Close;

/**
 * Sheet portal component.
 *
 * Renders the sheet content in a portal, ensuring it appears above other
 * content and avoids z-index issues.
 */
const SheetPortal = SheetPrimitive.Portal;

/**
 * Sheet overlay component.
 *
 * The semi-transparent backdrop that appears behind the sheet when open.
 * Clicking the overlay closes the sheet. Includes fade animations.
 *
 * @param className - Additional CSS classes to apply.
 * @param props - All Radix UI DialogOverlay props.
 * @returns A styled overlay element.
 */
const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

/**
 * Variant styles for sheet positioning.
 *
 * Defines styles for different sheet positions (top, bottom, left, right)
 * with appropriate slide animations and border placement.
 */
const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

/**
 * Props for SheetContent component.
 *
 * Extends Radix UI DialogContent props with sheet variant props for positioning.
 */
interface SheetContentProps
  extends
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

/**
 * Sheet content panel component.
 *
 * The main content area of the sheet that slides in from the specified side.
 * Includes a close button in the top-right corner and supports custom content.
 * Automatically includes overlay and portal rendering.
 *
 * @param side - Which side of the screen the sheet slides in from.
 *   Options: "top", "bottom", "left", "right". Defaults to "right".
 * @param className - Additional CSS classes to apply.
 * @param children - Content to display inside the sheet.
 * @param props - All Radix UI DialogContent props.
 * @returns A styled sheet panel with overlay and close button.
 */
const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <Cross2Icon className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

/**
 * Sheet header component.
 *
 * Container for sheet title and description. Provides consistent spacing
 * and layout for header content. Centers content on mobile, left-aligns on desktop.
 *
 * @param className - Additional CSS classes to apply.
 * @param props - All standard HTML div attributes.
 * @returns A styled header container.
 */
const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

/**
 * Sheet footer component.
 *
 * Container for sheet action buttons. Provides consistent spacing and layout
 * for footer content. Stacks buttons vertically on mobile, horizontally on desktop.
 *
 * @param className - Additional CSS classes to apply.
 * @param props - All standard HTML div attributes.
 * @returns A styled footer container.
 */
const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

/**
 * Sheet title component.
 *
 * The main heading for the sheet. Provides accessible labeling and consistent
 * typography. Required for accessibility.
 *
 * @param className - Additional CSS classes to apply.
 * @param props - All Radix UI DialogTitle props.
 * @returns A styled title element.
 */
const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

/**
 * Sheet description component.
 *
 * Optional descriptive text for the sheet. Provides additional context
 * about the sheet's purpose or content. Uses muted text color.
 *
 * @param className - Additional CSS classes to apply.
 * @param props - All Radix UI DialogDescription props.
 * @returns A styled description element.
 */
const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
