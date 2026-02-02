/**
 * React hook for managing outline slide operations.
 *
 * Provides CRUD operations for outline slides including:
 * - Reordering slides (drag-and-drop)
 * - Adding new slides
 * - Updating slide content
 * - Deleting slides
 *
 * All operations update the Zustand store, which triggers reactive updates
 * throughout the application. The hook uses useCallback to memoize functions
 * and prevent unnecessary re-renders.
 *
 * Operations are safe to call even when outlines is null - they check for
 * null before performing updates.
 */

import { useCallback } from "react";
import { usePresentationDataStore } from "@/stores";
import { OutlineSlide } from "../types/index";
import { createOutlineId } from "../utils/outline-ids";

/**
 * Hook for managing outline slide operations.
 *
 * Provides functions for reordering, adding, updating, and deleting outline
 * slides. All operations update the global presentation data store.
 *
 * @param outlines - Current array of outline slides, or null if not loaded.
 *   Used to check if operations are valid before executing.
 * @returns Object containing:
 *   - commitReorder: Function to save reordered outline array
 *   - handleAddSlide: Function to add a new slide at the end
 *   - handleUpdateSlide: Function to update a slide's content by ID
 *   - handleDeleteSlide: Function to delete a slide by ID
 */
export const useOutlineManagement = (outlines: OutlineSlide[] | null) => {
  // Zustand store actions for updating outline state
  const setOutlines = usePresentationDataStore((state) => state.setOutlines);
  const deleteSlideOutline = usePresentationDataStore((state) => state.deleteSlideOutline);

  /**
   * Commits a reordered outline array to the store.
   *
   * Called after drag-and-drop reordering completes. Updates the entire outline
   * array with the new order. Used by OutlineContent component after drag operations.
   *
   * @param orderedOutlines - The reordered array of outline slides.
   */
  const commitReorder = useCallback(
    (orderedOutlines: OutlineSlide[]) => {
      setOutlines(orderedOutlines);
    },
    [setOutlines],
  );

  /**
   * Adds a new slide to the end of the outline list.
   *
   * Creates a new outline slide with a unique ID and default content "Outline title".
   * The new slide is appended to the existing outlines array. Safe to call even
   * when outlines is null (returns early).
   */
  const handleAddSlide = useCallback(() => {
    if (!outlines) return;
    const updatedOutlines = [
      ...outlines,
      { id: createOutlineId(), content: "Outline title" },
    ];
    setOutlines(updatedOutlines);
  }, [outlines, setOutlines]);

  /**
   * Updates the content of a specific slide by ID.
   *
   * Finds the slide with the matching ID and updates its content field. All
   * other slides remain unchanged. Used when user edits slide content in the
   * markdown editor.
   *
   * @param id - Unique identifier of the slide to update.
   * @param content - New content string for the slide.
   */
  const handleUpdateSlide = useCallback(
    (id: string, content: string) => {
      if (!outlines) return;
      const updatedOutlines = outlines.map((outline) =>
        outline.id === id ? { ...outline, content } : outline,
      );
      setOutlines(updatedOutlines);
    },
    [outlines, setOutlines],
  );

  /**
   * Deletes a slide from the outline list by ID.
   *
   * Removes the slide with the matching ID from the store. Uses the store's
   * deleteSlideOutline action which handles the deletion logic internally.
   *
   * @param id - Unique identifier of the slide to delete.
   */
  const handleDeleteSlide = useCallback(
    (id: string) => {
      deleteSlideOutline(id);
    },
    [deleteSlideOutline],
  );

  return {
    commitReorder,
    handleAddSlide,
    handleUpdateSlide,
    handleDeleteSlide,
  };
};
