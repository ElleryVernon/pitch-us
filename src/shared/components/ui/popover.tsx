/**
 * Popover component system for floating content panels.
 *
 * A popover component system built on Radix UI's Popover primitive, providing
 * accessible floating panels that appear near a trigger element. Used for
 * dropdown menus, tooltips with rich content, or contextual information panels.
 */

"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

/**
 * Root popover component.
 *
 * Controls the popover's open/closed state and behavior. Use this to wrap
 * PopoverTrigger and PopoverContent components.
 */
const Popover = PopoverPrimitive.Root;

/**
 * Popover trigger component.
 *
 * The element that opens the popover when clicked. Typically a button or
 * interactive element.
 */
const PopoverTrigger = PopoverPrimitive.Trigger;

/**
 * Popover anchor component.
 *
 * An optional element that the popover positions itself relative to. If not
 * provided, the popover positions relative to the trigger.
 */
const PopoverAnchor = PopoverPrimitive.Anchor;

/**
 * Popover content component.
 *
 * The floating panel content that appears when the trigger is activated.
 * Positioned automatically relative to the trigger or anchor, with smooth
 * fade and zoom animations. Rendered in a portal to avoid z-index issues.
 *
 * @param align - Alignment relative to trigger ("start", "center", "end").
 *   Defaults to "center".
 * @param sideOffset - Distance in pixels between popover and trigger.
 *   Defaults to 4.
 * @param className - Additional CSS classes to apply.
 * @param props - All Radix UI PopoverContent props (side, etc.).
 * @returns A portal-rendered popover content element.
 */
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
