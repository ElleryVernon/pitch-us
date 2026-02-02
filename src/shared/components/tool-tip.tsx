/**
 * Tooltip wrapper component for displaying helpful hints.
 *
 * Provides a simple wrapper around Radix UI's Tooltip component for displaying
 * contextual help text when users hover over or focus on elements. The tooltip
 * appears after a short delay (100ms) to avoid accidental triggers.
 */

import { Tooltip } from "@radix-ui/react-tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import React from "react";
import { TooltipContent, TooltipTrigger } from "./ui/tooltip";

/**
 * Tooltip component for displaying contextual information.
 *
 * Wraps a child element with a tooltip that displays additional information
 * when the user hovers or focuses on it. Uses Radix UI's accessible tooltip
 * implementation with proper keyboard and screen reader support.
 *
 * @param children - React node that will trigger the tooltip when hovered
 *   or focused. Typically a button, icon, or other interactive element.
 * @param content - Text content to display in the tooltip. Should be concise
 *   and helpful, explaining what the element does or providing additional context.
 * @returns A TooltipProvider wrapping a Tooltip component. The tooltip appears
 *   after a 100ms delay when the child element is hovered or focused.
 *
 * @example
 * ```tsx
 * <ToolTip content="Click to save your presentation">
 *   <Button>Save</Button>
 * </ToolTip>
 * ```
 */
const ToolTip = ({
  children,
  content,
}: {
  children: React.ReactNode;
  content: string;
}) => {
  return (
    <div>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipContent>
            <p>{content}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ToolTip;
