/**
 * Core utility functions for the application.
 *
 * This module provides fundamental utility functions used throughout the
 * application. These are foundational utilities that other modules depend on.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges and resolves CSS class names with Tailwind CSS conflict resolution.
 *
 * This utility function combines the functionality of `clsx` (for conditional
 * class name joining) and `tailwind-merge` (for resolving Tailwind CSS class
 * conflicts). It's the standard way to handle className props in React components
 * throughout this application.
 *
 * How it works:
 * 1. `clsx` processes the input arguments and combines them into a single
 *    class string, handling conditional classes, arrays, and objects.
 * 2. `twMerge` then processes the result to resolve conflicts between Tailwind
 *    utility classes (e.g., if both "p-4" and "p-6" are present, only "p-6"
 *    is kept since it comes later).
 *
 * This ensures that:
 * - Conditional classes work seamlessly (undefined/null are ignored)
 * - Tailwind class conflicts are automatically resolved (last one wins)
 * - Arrays and objects of classes are properly flattened
 * - The final className string is clean and optimized
 *
 * @param inputs - Variable number of class name arguments. Can be strings,
 *   arrays of strings, objects with boolean values, or any combination.
 *   Undefined and null values are ignored. Objects are treated as conditional
 *   classes where keys are class names and values determine if the class is
 *   included (truthy = included, falsy = excluded).
 * @returns A single string containing all resolved class names, with Tailwind
 *   conflicts resolved. Returns an empty string if no valid classes are provided.
 *
 * @example
 * ```typescript
 * // Basic usage
 * cn("text-lg", "font-bold")
 * // Returns: "text-lg font-bold"
 *
 * // Conditional classes
 * cn("base-class", isActive && "active-class", isDisabled && "disabled-class")
 * // Returns: "base-class active-class" (if isActive is true, isDisabled is false)
 *
 * // Resolving Tailwind conflicts
 * cn("p-4", "p-6")
 * // Returns: "p-6" (p-4 is removed, p-6 wins)
 *
 * // With objects
 * cn({
 *   "text-red-500": hasError,
 *   "text-green-500": !hasError
 * })
 * // Returns: "text-red-500" or "text-green-500" depending on hasError
 *
 * // Complex example
 * cn("base-class", condition && "conditional-class", ["array", "of", "classes"], {
 *   "object-class": true,
 *   "excluded-class": false
 * })
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
