/**
 * Tooltip component system for displaying helpful hints.
 *
 * A tooltip component system built on Radix UI's Tooltip primitive, providing
 * accessible tooltips that appear on hover or focus. Tooltips are positioned
 * automatically relative to their trigger element and include smooth animations.
 */

"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

/**
 * Tooltip provider component.
 *
 * Must wrap the application or a section where tooltips are used. Manages
 * tooltip state and accessibility features. Should be placed high in the
 * component tree.
 */
const TooltipProvider = TooltipPrimitive.Provider;

/**
 * Root tooltip component.
 *
 * Controls the tooltip's open/closed state and behavior. Use this to wrap
 * TooltipTrigger and TooltipContent components.
 */
const Tooltip = TooltipPrimitive.Root;

/**
 * Tooltip trigger component.
 *
 * The element that triggers the tooltip on hover or focus. Typically wraps
 * a button, icon, or other interactive element.
 */
const TooltipTrigger = TooltipPrimitive.Trigger;

/**
 * Tooltip content component.
 *
 * The actual tooltip content that appears when the trigger is hovered or
 * focused. Positioned automatically relative to the trigger and includes
 * smooth fade and zoom animations. Rendered in a portal to avoid z-index
 * issues.
 *
 * @param sideOffset - Distance in pixels between the tooltip and trigger
 *   element. Defaults to 10.
 * @param className - Additional CSS classes to apply.
 * @param props - All Radix UI TooltipContent props.
 * @returns A portal-rendered tooltip content element.
 */
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 10, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
