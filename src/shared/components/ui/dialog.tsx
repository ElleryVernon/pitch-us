/**
 * Dialog/Modal component system built on Radix UI.
 *
 * Provides accessible dialog components for modals, popovers, and overlays.
 * Built on Radix UI's Dialog primitive with custom styling and animations.
 * Supports keyboard navigation, focus management, and screen reader accessibility.
 */

"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Cross2Icon } from "@radix-ui/react-icons";

/**
 * Dialog root component.
 *
 * Controls the open/closed state of the dialog. Use with DialogTrigger and
 * DialogContent to create a complete dialog.
 */
const Dialog = DialogPrimitive.Root;

/**
 * Dialog trigger component.
 *
 * Element that opens the dialog when clicked or activated. Can be any element
 * (button, link, etc.) wrapped with this component.
 */
const DialogTrigger = DialogPrimitive.Trigger;

/**
 * Dialog portal component.
 *
 * Renders dialog content in a portal (outside the normal DOM hierarchy) to
 * avoid z-index and overflow issues. Automatically used by DialogContent.
 */
const DialogPortal = DialogPrimitive.Portal;

/**
 * Dialog close component.
 *
 * Element that closes the dialog when clicked. Typically used as a close button.
 * Automatically included in DialogContent.
 */
const DialogClose = DialogPrimitive.Close;

/**
 * Dialog overlay component.
 *
 * Semi-transparent backdrop that appears behind the dialog content. Provides
 * visual separation and can be clicked to close the dialog. Includes fade
 * animations for smooth appearance/disappearance.
 *
 * @param className - Optional additional CSS classes.
 * @param props - Standard overlay props from Radix UI.
 * @param ref - Forwarded ref to the overlay element.
 * @returns An overlay div with dark semi-transparent background and animations.
 */
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * Dialog content container component.
 *
 * The main dialog content area that appears centered on screen. Includes the
 * overlay, close button, and content. Provides smooth animations (fade, zoom,
 * slide) when opening and closing. Content is rendered in a portal to avoid
 * z-index issues.
 *
 * @param className - Optional additional CSS classes.
 * @param children - Content to display inside the dialog.
 * @param props - Standard dialog content props from Radix UI.
 * @param ref - Forwarded ref to the content element.
 * @returns A portal containing the overlay and dialog content with animations.
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <Cross2Icon className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

/**
 * Dialog header section component.
 *
 * Container for dialog title and description. Provides consistent spacing
 * and layout. Text is centered on mobile and left-aligned on larger screens.
 *
 * @param className - Optional additional CSS classes.
 * @param props - Standard div HTML attributes.
 * @returns A div element styled as a dialog header with flex column layout.
 */
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

/**
 * Dialog footer section component.
 *
 * Container for dialog action buttons. Provides consistent spacing and
 * responsive layout (column on mobile, row on desktop with right alignment).
 *
 * @param className - Optional additional CSS classes.
 * @param props - Standard div HTML attributes.
 * @returns A div element styled as a dialog footer with responsive flex layout.
 */
const DialogFooter = ({
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
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
