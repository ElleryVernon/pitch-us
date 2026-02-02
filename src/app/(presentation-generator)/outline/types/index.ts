/**
 * Type definitions for outline and template management.
 *
 * Defines types for template slides, templates, loading states, outline slides,
 * and tab types used in the outline editing interface.
 */

import type { LayoutInfo } from "../../context/layout-context";

/**
 * Template slide structure.
 *
 * Represents a single slide layout within a template, including metadata
 * and schema information.
 *
 * @property type - Optional slide type identifier.
 * @property name - Optional slide name.
 * @property description - Optional slide description.
 * @property design_index - Optional design variant index.
 * @property id - Optional unique slide identifier.
 * @property json_schema - Optional JSON schema for slide data.
 * @property templateID - Optional template identifier this slide belongs to.
 * @property templateName - Optional template name.
 */
export interface TemplateSlide {
  type?: number;
  name?: string;
  description?: string;
  design_index?: number;
  id?: string;
  json_schema?: unknown;
  templateID?: string;
  templateName?: string;
}

/**
 * Template structure.
 *
 * Represents a complete presentation template with its slides and metadata.
 *
 * @property id - Unique template identifier.
 * @property name - Template display name.
 * @property description - Template description.
 * @property ordered - Whether slides should be displayed in a specific order.
 * @property default - Whether this template is the default selection.
 * @property slides - Array of template slides or layout info objects.
 */
export interface Template {
  id: string;
  name: string;
  description: string;
  ordered: boolean;
  default?: boolean;
  slides?: TemplateSlide[] | LayoutInfo[];
}

/**
 * Loading state structure.
 *
 * Represents the current loading state of an async operation, including
 * progress information for UI feedback.
 *
 * @property message - Loading message to display to the user.
 * @property isLoading - Whether an operation is currently in progress.
 * @property showProgress - Whether to display a progress bar.
 * @property duration - Duration in seconds for progress bar animation.
 */
export interface LoadingState {
  message: string;
  isLoading: boolean;
  showProgress: boolean;
  duration: number;
}

/**
 * Outline slide structure.
 *
 * Represents a single slide in the presentation outline, containing the
 * content text that will be used to generate the slide.
 *
 * @property id - Unique identifier for the outline slide.
 * @property content - Text content describing what should be on this slide.
 */
export type OutlineSlide = {
  id: string;
  content: string;
};

export const TABS = {
  OUTLINE: "outline",
  LAYOUTS: "layouts",
} as const;

/**
 * Tab type derived from TABS constant.
 * Represents one of the available tab identifiers.
 */
export type TabType = (typeof TABS)[keyof typeof TABS];
