/**
 * Tabs component system for organizing content into panels.
 *
 * A tabbed interface component system built on Radix UI's Tabs primitive,
 * providing accessible tab navigation with keyboard support and ARIA attributes.
 * Allows users to switch between different content panels.
 */

"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

/**
 * Root tabs component.
 *
 * Controls the tabs state and behavior. Use this to wrap TabsList, TabsTrigger,
 * and TabsContent components. Manages which tab is currently active.
 */
const Tabs = TabsPrimitive.Root;

/**
 * Tabs list container component.
 *
 * Container for tab triggers. Displays all available tabs in a horizontal
 * list with rounded background and muted styling.
 *
 * @param className - Additional CSS classes to apply.
 * @param props - All Radix UI TabsList props.
 * @returns A styled container for tab triggers.
 */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

/**
 * Individual tab trigger button.
 *
 * A clickable button that activates a tab panel. Shows active state styling
 * when selected. Includes focus styles for keyboard navigation.
 *
 * @param className - Additional CSS classes to apply.
 * @param props - All Radix UI TabsTrigger props (value, disabled, etc.).
 * @returns A styled tab trigger button.
 */
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

/**
 * Tab panel content component.
 *
 * The content panel that appears when its corresponding tab trigger is active.
 * Only one TabsContent should be visible at a time based on the active tab.
 *
 * @param className - Additional CSS classes to apply.
 * @param props - All Radix UI TabsContent props (value, etc.).
 * @returns A styled content panel for tab content.
 */
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
