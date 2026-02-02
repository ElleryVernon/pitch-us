/**
 * Label component for form inputs.
 *
 * A styled label component built on Radix UI's Label primitive, providing
 * accessible labeling for form inputs. Automatically handles disabled state
 * styling when associated with disabled inputs.
 */

"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Variant styles for the Label component.
 *
 * Defines base styles for labels including font size, weight, line height,
 * and disabled state handling. Labels automatically adjust opacity and cursor
 * when associated with disabled inputs.
 */
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

/**
 * Label component for form inputs.
 *
 * Provides accessible labeling for form controls. Automatically styles based
 * on the associated input's disabled state. Can be used with any form input
 * component by associating via htmlFor/id or wrapping the input.
 *
 * @param className - Additional CSS classes to apply.
 * @param props - All standard HTML label attributes and Radix UI Label props.
 * @returns A styled label element.
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
