/**
 * Default schema definitions for presentation template assets.
 *
 * Defines reusable schema types for images and icons used across presentation
 * templates. These schemas are used with ArkType for runtime validation and
 * type inference when generating slide content from LLM responses.
 */

import { type as t } from "arktype";

/**
 * Schema for image assets in presentation slides.
 *
 * Defines the structure for image data, including the image URL and the prompt
 * used to generate it. Used by LLM generation to ensure consistent image data
 * structure across all slide templates.
 *
 * @property __image_url__ - Valid URL string pointing to the image resource.
 *   Can be a local path, CDN URL, or external image URL.
 * @property __image_prompt__ - Text prompt (10-50 characters) that was used
 *   to generate or describe the image. Used for alt text and accessibility.
 */
export const ImageSchema = t({
  __image_url__: t("string.url").describe("URL to image"),
  __image_prompt__: t("10<=string<=50").describe(
    "Prompt used to generate the image",
  ),
});

/**
 * Schema for icon assets in presentation slides.
 *
 * Defines the structure for icon data, including the icon URL and the search
 * query used to find it. Used by LLM generation to ensure consistent icon data
 * structure across all slide templates.
 *
 * @property __icon_url__ - String URL pointing to the icon resource. Can be
 *   a local path or external URL.
 * @property __icon_query__ - Search query (5-20 characters) that was used to
 *   find or identify the icon. Used for reference and debugging.
 */
export const IconSchema = t({
  __icon_url__: t("string").describe("URL to icon"),
  __icon_query__: t("5<=string<=20").describe("Query used to search the icon"),
});
