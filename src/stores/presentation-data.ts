/**
 * Presentation data state management using Zustand.
 *
 * This module provides a Zustand store for managing presentation data, slides,
 * outlines, and templates. It handles complex nested data updates, slide
 * manipulation, and content editing operations. The store uses deep cloning
 * to ensure immutability and prevent reference issues.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Slide, ImageProperties } from "@/types/slide";

/**
 * Layout slide definition for presentation templates.
 *
 * Represents a slide type within a template layout. Templates define the
 * structure and types of slides that can be used in a presentation.
 *
 * @property type - Numeric identifier for the slide type (e.g., 1 for intro,
 *   2 for problem, etc.). Maps to specific slide templates.
 * @property name - Optional display name for this slide type (e.g., "Intro Slide").
 * @property description - Optional description explaining what this slide type
 *   is used for.
 * @property design_index - Optional index specifying which design variant to
 *   use for this slide type. Allows multiple visual designs for the same type.
 */
export interface LayoutSlide {
  type: number;
  name?: string;
  description?: string;
  design_index?: number;
}

/**
 * Complete presentation data structure.
 *
 * Represents a full presentation with all its metadata, layout configuration,
 * and slide content. This is the primary data structure used throughout the
 * application for presentation editing and management.
 *
 * @property id - Unique identifier for the presentation.
 * @property language - Language code for the presentation content (e.g., "en", "ko").
 * @property layout - Layout configuration object defining the template structure.
 * @property layout.name - Name of the template/layout being used.
 * @property layout.ordered - Whether slides have a fixed order that must be maintained.
 * @property layout.slides - Array of LayoutSlide objects defining the slide
 *   structure for this template.
 * @property n_slides - Number of slides in the presentation.
 * @property title - Presentation title.
 * @property slides - Array of Slide objects containing the actual slide content
 *   and data. Each slide represents one page in the presentation.
 */
export interface PresentationData {
  id: string;
  language: string;
  layout: {
    name: string;
    ordered: boolean;
    slides: LayoutSlide[];
  };
  n_slides: number;
  title: string;
  slides: Slide[];
}

/**
 * Outline slide structure for presentation generation.
 *
 * Represents a slide outline that describes what content should be generated
 * for a slide. Outlines are created before slides and guide the content
 * generation process.
 *
 * @property id - Unique identifier for the outline.
 * @property content - Text description of what the slide should contain.
 *   This is used as a prompt for LLM-based content generation.
 * @property isStreaming - Optional flag indicating whether this outline is
 *   currently being generated via streaming. Used to show loading states
 *   during outline generation.
 */
export interface OutlineSlide {
  id: string;
  content: string;
  isStreaming?: boolean;
}

/**
 * State interface for the presentation data store.
 *
 * Defines all state properties and action methods available in the presentation
 * data store. The store manages presentation metadata, outlines, templates,
 * and slide content with comprehensive update operations.
 *
 * @property presentation_id - Unique identifier of the current presentation.
 *   Null if no presentation is loaded.
 * @property presentationData - Complete presentation data object containing
 *   all slides and metadata. Null if no presentation is loaded.
 * @property outlines - Array of outline slides used for presentation generation.
 *   Outlines describe what content each slide should have.
 * @property selectedTemplateId - ID of the currently selected template/layout.
 *   Null if no template is selected.
 * @property setPresentationId - Sets the current presentation ID.
 * @property setPresentationData - Sets the complete presentation data object.
 * @property clearPresentationData - Clears the presentation data (sets to null).
 * @property setOutlines - Replaces all outlines with a new array.
 * @property clearOutlines - Removes all outlines.
 * @property deleteSlideOutline - Removes a specific outline by ID.
 * @property setSelectedTemplateId - Sets the selected template ID.
 * @property clearSelectedTemplateId - Clears the selected template (sets to null).
 * @property addSlide - Inserts an existing slide at a specific index.
 * @property addNewSlide - Creates and inserts a new slide at a specific index.
 * @property updateSlide - Replaces a slide at a specific index with new data.
 * @property deletePresentationSlide - Removes a slide at a specific index.
 * @property updateSlideContent - Updates a nested content field within a slide
 *   using a dot-notation path (e.g., "content.title", "content.body[0].heading").
 * @property updateSlideImage - Updates an image URL and prompt within slide content.
 * @property updateSlideIcon - Updates an icon URL and query within slide content.
 * @property updateImageProperties - Updates image positioning and styling properties
 *   for a specific image within a slide.
 * @property reset - Resets the entire store to its initial state.
 */
interface PresentationDataState {
  // Core data
  presentation_id: string | null;
  presentationData: PresentationData | null;
  outlines: OutlineSlide[];
  selectedTemplateId: string | null;

  // Actions - Presentation
  setPresentationId: (id: string) => void;
  setPresentationData: (data: PresentationData) => void;
  clearPresentationData: () => void;

  // Actions - Outlines
  setOutlines: (outlines: OutlineSlide[]) => void;
  clearOutlines: () => void;
  deleteSlideOutline: (id: string) => void;

  // Actions - Template
  setSelectedTemplateId: (id: string) => void;
  clearSelectedTemplateId: () => void;

  // Actions - Slides
  addSlide: (slide: Slide, index: number) => void;
  addNewSlide: (slideData: Partial<Slide>, index: number) => void;
  updateSlide: (index: number, slide: Slide) => void;
  deletePresentationSlide: (index: number) => void;
  updateSlideContent: (
    slideIndex: number,
    dataPath: string,
    content: string
  ) => void;
  updateSlideImage: (
    slideIndex: number,
    dataPath: string,
    imageUrl: string,
    prompt?: string
  ) => void;
  updateSlideIcon: (
    slideIndex: number,
    dataPath: string,
    iconUrl: string,
    query?: string
  ) => void;
  updateImageProperties: (
    slideIndex: number,
    itemIndex: number,
    properties: ImageProperties
  ) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  presentation_id: null,
  presentationData: null,
  outlines: [],
  selectedTemplateId: null,
};

/**
 * Generic object type for nested property operations.
 *
 * Used for manipulating nested objects where properties can be accessed via
 * dot notation or array indices. Supports paths like "content.title" or
 * "items[0].name".
 */
type NestedObject = Record<string | number, unknown>;

/**
 * Sets a nested property value using dot-notation or bracket notation.
 *
 * Updates a property deep within a nested object structure using a path string.
 * The path can use dot notation (e.g., "content.title") or bracket notation
 * (e.g., "items[0].name") or a combination. Intermediate objects/arrays are
 * created automatically if they don't exist.
 *
 * This function is used to update specific fields within slide content without
 * replacing the entire content object.
 *
 * @param obj - The root object to update. Will be modified in place.
 * @param path - Dot-notation or bracket-notation path to the property
 *   (e.g., "content.title", "items[0].heading", "content.body[1].description").
 * @param value - Value to set at the specified path.
 *
 * @example
 * ```typescript
 * const slide = { content: { title: "Old" } };
 * setNestedValue(slide, "content.title", "New");
 * // slide.content.title is now "New"
 *
 * setNestedValue(slide, "content.items[0].text", "Item 1");
 * // Creates slide.content.items[0].text = "Item 1"
 * ```
 */
const setNestedValue = (obj: NestedObject, path: string, value: unknown): void => {
  const keys = path.split(/[.\[\]]+/).filter(Boolean);
  let current: NestedObject = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (isNaN(Number(key))) {
      if (!current[key]) current[key] = {};
      current = current[key] as NestedObject;
    } else {
      const index = Number(key);
      if (!current[index]) current[index] = {};
      current = current[index] as NestedObject;
    }
  }

  const finalKey = keys[keys.length - 1];
  if (isNaN(Number(finalKey))) {
    current[finalKey] = value;
  } else {
    current[Number(finalKey)] = value;
  }
};

/**
 * Metadata structure for images and icons in slide content.
 *
 * Stores image and icon URLs along with their associated prompts/queries.
 * These metadata fields are embedded within slide content objects to track
 * image sources and generation prompts.
 *
 * @property __image_url__ - URL or path to an image file.
 * @property __image_prompt__ - Text prompt used to generate this image (if AI-generated).
 * @property __icon_url__ - URL or path to an icon file.
 * @property __icon_query__ - Search query used to find this icon.
 */
interface MediaMetadata {
  __image_url__?: string;
  __image_prompt__?: string;
  __icon_url__?: string;
  __icon_query__?: string;
}

/**
 * Sets a nested image or icon value with metadata.
 *
 * Similar to setNestedValue, but specifically for images and icons. Updates
 * both the URL and associated metadata (prompt/query) at the specified path.
 * Preserves existing metadata if present.
 *
 * @param obj - The root object to update. Will be modified in place.
 * @param path - Dot-notation or bracket-notation path to the image/icon property.
 * @param url - Image or icon URL/path to set.
 * @param metaKey - Type of media: "image" or "icon". Determines which metadata
 *   fields are updated.
 * @param metaValue - Optional prompt (for images) or query (for icons) to store
 *   with the URL. If not provided, preserves existing metadata.
 */
const setNestedImageValue = (
  obj: NestedObject,
  path: string,
  url: string,
  metaKey: "image" | "icon",
  metaValue?: string
): void => {
  const keys = path.split(/[.\[\]]+/).filter(Boolean);
  let current: NestedObject = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (isNaN(Number(key))) {
      if (!current[key]) current[key] = {};
      current = current[key] as NestedObject;
    } else {
      const index = Number(key);
      if (!current[index]) current[index] = {};
      current = current[index] as NestedObject;
    }
  }

  const finalKey = keys[keys.length - 1];
  const target = (isNaN(Number(finalKey))
    ? current[finalKey]
    : current[Number(finalKey)]) as MediaMetadata | undefined;

  const updatedValue: MediaMetadata = {
    ...(target && typeof target === "object" ? target : {}),
    [metaKey === "image" ? "__image_url__" : "__icon_url__"]: url,
    [metaKey === "image" ? "__image_prompt__" : "__icon_query__"]:
      metaValue || target?.[metaKey === "image" ? "__image_prompt__" : "__icon_query__"] || "",
  };

  if (isNaN(Number(finalKey))) {
    current[finalKey] = updatedValue;
  } else {
    current[Number(finalKey)] = updatedValue;
  }
};

export const usePresentationDataStore = create<PresentationDataState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Presentation Actions
      setPresentationId: (id) => set({ presentation_id: id }),

      setPresentationData: (data) => set({ presentationData: data }),

      clearPresentationData: () => set({ presentationData: null }),

      // Outline Actions
      setOutlines: (outlines) => set({ outlines }),

      clearOutlines: () => set({ outlines: [] }),

      deleteSlideOutline: (id) =>
        set((state) => ({
          outlines: state.outlines.filter((outline) => outline.id !== id),
        })),

      // Template Actions
      setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),

      clearSelectedTemplateId: () => set({ selectedTemplateId: null }),

      // Slide Actions
      addSlide: (slide, index) =>
        set((state) => {
          if (!state.presentationData?.slides) return state;

          const slides = [...state.presentationData.slides];
          slides.splice(index, 0, slide);

          const updatedSlides = slides.map((s, idx) => ({
            ...s,
            index: idx,
          }));

          return {
            presentationData: {
              ...state.presentationData,
              slides: updatedSlides,
            },
          };
        }),

      addNewSlide: (slideData, index) =>
        set((state) => {
          if (!state.presentationData?.slides) return state;

          const newSlide: Slide = {
            id: slideData.id ?? null,
            index: index + 1,
            type: slideData.type ?? 0,
            design_index: slideData.design_index ?? null,
            images: slideData.images ?? null,
            properties: slideData.properties ?? null,
            icons: slideData.icons ?? null,
            graph_id: slideData.graph_id ?? null,
            content: slideData.content ?? { title: "", body: "" },
            presentation: slideData.presentation,
            speaker_note: slideData.speaker_note,
            layout: slideData.layout,
            layout_group: slideData.layout_group,
          };

          const slides = [...state.presentationData.slides];
          slides.splice(index + 1, 0, newSlide);

          const updatedSlides = slides.map((s, idx) => ({
            ...s,
            index: idx,
          }));

          return {
            presentationData: {
              ...state.presentationData,
              slides: updatedSlides,
            },
          };
        }),

      updateSlide: (index, slide) =>
        set((state) => {
          if (!state.presentationData?.slides?.[index]) return state;

          const slides = [...state.presentationData.slides];
          slides[index] = slide;

          return {
            presentationData: {
              ...state.presentationData,
              slides,
            },
          };
        }),

      deletePresentationSlide: (index) =>
        set((state) => {
          if (!state.presentationData?.slides) return state;

          const slides = [...state.presentationData.slides];
          slides.splice(index, 1);

          const updatedSlides = slides.map((s, idx) => ({
            ...s,
            index: idx,
          }));

          return {
            presentationData: {
              ...state.presentationData,
              slides: updatedSlides,
            },
          };
        }),

      updateSlideContent: (slideIndex, dataPath, content) =>
        set((state) => {
          if (!state.presentationData?.slides?.[slideIndex]) return state;

          const slides = JSON.parse(JSON.stringify(state.presentationData.slides));
          const slide = slides[slideIndex];

          if (dataPath && slide.content) {
            setNestedValue(slide.content, dataPath, content);
          }

          return {
            presentationData: {
              ...state.presentationData,
              slides,
            },
          };
        }),

      updateSlideImage: (slideIndex, dataPath, imageUrl, prompt) =>
        set((state) => {
          if (!state.presentationData?.slides?.[slideIndex]) return state;

          const slides = JSON.parse(JSON.stringify(state.presentationData.slides));
          const slide = slides[slideIndex];

          if (dataPath && slide.content) {
            setNestedImageValue(slide.content, dataPath, imageUrl, "image", prompt);
          }

          // Also update images array if exists
          if (slide.images && Array.isArray(slide.images)) {
            const imageIndex = parseInt(dataPath.split("[")[1]?.split("]")[0]) || 0;
            if (slide.images[imageIndex] !== undefined) {
              slide.images[imageIndex] = imageUrl;
            }
          }

          return {
            presentationData: {
              ...state.presentationData,
              slides,
            },
          };
        }),

      updateSlideIcon: (slideIndex, dataPath, iconUrl, query) =>
        set((state) => {
          if (!state.presentationData?.slides?.[slideIndex]) return state;

          const slides = JSON.parse(JSON.stringify(state.presentationData.slides));
          const slide = slides[slideIndex];

          if (dataPath && slide.content) {
            setNestedImageValue(slide.content, dataPath, iconUrl, "icon", query);
          }

          // Also update icons array if exists
          if (slide.icons && Array.isArray(slide.icons)) {
            const iconIndex = parseInt(dataPath.split("[")[1]?.split("]")[0]) || 0;
            if (slide.icons[iconIndex] !== undefined) {
              slide.icons[iconIndex] = iconUrl;
            }
          }

          return {
            presentationData: {
              ...state.presentationData,
              slides,
            },
          };
        }),

      updateImageProperties: (slideIndex, itemIndex, properties) =>
        set((state) => {
          if (!state.presentationData?.slides?.[slideIndex]) return state;

          const slides = JSON.parse(JSON.stringify(state.presentationData.slides));
          const slide = slides[slideIndex];

          slide.properties = {
            ...slide.properties,
            [itemIndex]: properties,
          };

          return {
            presentationData: {
              ...state.presentationData,
              slides,
            },
          };
        }),

      reset: () => set(initialState),
    }),
    { name: "presentation-data" }
  )
);
