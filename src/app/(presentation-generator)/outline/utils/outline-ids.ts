/**
 * Utility functions for generating unique outline slide IDs.
 *
 * Provides functions for creating unique identifiers for outline slides,
 * with fallback support for environments without crypto.randomUUID.
 */

/**
 * Creates a unique identifier for an outline slide.
 *
 * Uses crypto.randomUUID() if available (browser/Node.js 19+), otherwise
 * falls back to a timestamp-based ID with random suffix. Ensures IDs are
 * unique and suitable for use as React keys.
 *
 * @returns A unique string identifier for an outline slide.
 *
 * @example
 * ```typescript
 * const id = createOutlineId();
 * // Returns: "550e8400-e29b-41d4-a716-446655440000" (UUID)
 * // or: "outline_1704067200000_a3f5b2c1" (fallback)
 * ```
 */
export const createOutlineId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `outline_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};
