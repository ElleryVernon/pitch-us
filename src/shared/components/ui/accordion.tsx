/**
 * Accordion component system for collapsible content sections.
 *
 * An accordion component system built on Radix UI's Accordion primitive,
 * providing accessible collapsible sections that can expand and collapse
 * independently or exclusively. Used for FAQs, nested navigation, or
 * organizing content into expandable panels.
 */

"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";

/**
 * Root accordion component.
 *
 * Controls the accordion's behavior and state. Use this to wrap AccordionItem
 * components. Supports single or multiple open items via the `type` prop.
 */
const Accordion = AccordionPrimitive.Root;

/**
 * Individual accordion item component.
 *
 * A container for a single collapsible section. Each item contains a trigger
 * and content panel. Multiple items can be grouped within an Accordion root.
 *
 * @param className - Additional CSS classes to apply.
 * @param props - All Radix UI AccordionItem props (value, disabled, etc.).
 * @returns A styled accordion item container.
 */
const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

/**
 * Accordion trigger button component.
 *
 * The clickable header that expands/collapses the accordion content. Includes
 * a chevron icon that rotates when the item is open. Provides hover and focus
 * styles for accessibility.
 *
 * @param className - Additional CSS classes to apply.
 * @param children - Content to display in the trigger (typically text).
 * @param props - All Radix UI AccordionTrigger props (disabled, etc.).
 * @returns A styled trigger button with chevron icon.
 */
const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

/**
 * Accordion content panel component.
 *
 * The collapsible content panel that appears/disappears when the trigger is
 * clicked. Includes smooth slide animations when expanding or collapsing.
 * Content is hidden when collapsed and visible when expanded.
 *
 * @param className - Additional CSS classes to apply to the inner content div.
 * @param children - Content to display inside the accordion panel.
 * @param props - All Radix UI AccordionContent props.
 * @returns A styled collapsible content panel with animations.
 */
const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
