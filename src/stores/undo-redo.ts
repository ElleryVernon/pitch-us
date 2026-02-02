/**
 * Undo/redo functionality for presentation editing.
 *
 * This module provides a Zustand store for managing undo/redo history of slide
 * changes. It maintains a history stack of slide states, allowing users to
 * undo and redo changes made during presentation editing. The history is
 * limited in size to prevent excessive memory usage.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Slide } from "@/types/slide";

/**
 * History state entry representing a snapshot of slides at a point in time.
 *
 * Stores a complete copy of all slides along with metadata about when and
 * why this state was saved. Used to reconstruct previous states during
 * undo/redo operations.
 *
 * @property slides - Complete array of Slide objects representing the state
 *   at this point in history. Deep copied to avoid reference issues.
 * @property timestamp - Unix timestamp (milliseconds) when this state was saved.
 *   Used for debugging and potential time-based features.
 * @property actionType - String describing what action created this state
 *   (e.g., "edit_slide", "add_slide", "delete_slide"). Used for debugging
 *   and potential action-specific undo behavior.
 */
interface HistoryState {
  slides: Slide[];
  timestamp: number;
  actionType: string;
}

/**
 * State interface for undo/redo store.
 *
 * Manages a history stack with past states, present state, and future states
 * (for redo). Uses a three-stack approach: past (undoable states), present
 * (current state), and future (redoable states).
 *
 * @property past - Array of previous slide states that can be undone to.
 *   States are ordered chronologically (oldest first).
 * @property present - Current slide state snapshot, or null if no state
 *   has been saved yet.
 * @property future - Array of future slide states that can be redone to.
 *   States are ordered chronologically (most recent undo first).
 * @property maxHistorySize - Maximum number of history entries to keep.
 *   Older entries are discarded when the limit is exceeded. Defaults to 30.
 * @property isUndoRedoInProgress - Flag indicating an undo/redo operation
 *   is currently in progress. Prevents new history entries during undo/redo
 *   to avoid corrupting the history stack.
 * @property canUndo - Computed flag indicating whether undo is possible
 *   (past array has entries).
 * @property canRedo - Computed flag indicating whether redo is possible
 *   (future array has entries).
 * @property addToHistory - Adds a new slide state to history. Skips if
 *   undo/redo is in progress or if slides haven't changed.
 * @property undo - Moves back one step in history. Returns the previous
 *   state or null if undo is not possible.
 * @property redo - Moves forward one step in history. Returns the next
 *   state or null if redo is not possible.
 * @property finishUndoRedo - Marks the current undo/redo operation as
 *   complete, allowing new history entries.
 * @property clearHistory - Clears all history (past, present, future).
 */
interface UndoRedoState {
  past: HistoryState[];
  present: HistoryState | null;
  future: HistoryState[];
  maxHistorySize: number;
  isUndoRedoInProgress: boolean;

  // Computed
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  addToHistory: (slides: Slide[], actionType: string) => void;
  undo: () => HistoryState | null;
  redo: () => HistoryState | null;
  finishUndoRedo: () => void;
  clearHistory: () => void;
}

/**
 * Creates a deep copy of an object using JSON serialization.
 *
 * Performs a deep clone by serializing to JSON and parsing back. This ensures
 * all nested objects and arrays are copied, not just referenced. Used to
 * prevent reference issues when storing slide states in history.
 *
 * @param obj - Object to deep copy. Must be JSON-serializable.
 * @returns Deep copy of the input object with no shared references.
 *
 * @remarks
 * This method has limitations: it doesn't preserve functions, undefined values,
 * or special objects like Date (converts to strings). For slide data structures,
 * this is acceptable as they contain only serializable data.
 */
const deepCopy = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const useUndoRedoStore = create<UndoRedoState>()(
  devtools(
    (set, get) => ({
      past: [],
      present: null,
      future: [],
      maxHistorySize: 30,
      isUndoRedoInProgress: false,
      canUndo: false,
      canRedo: false,

      addToHistory: (slides, actionType) => {
        const state = get();

        // Skip if undo/redo is in progress
        if (state.isUndoRedoInProgress) {
          return;
        }

        // Deep copy the slides to avoid reference issues
        const newSlides = deepCopy(slides);

        // Only add to history if the slides have actually changed
        if (!state.present) {
          set({
            present: {
              slides: newSlides,
              timestamp: Date.now(),
              actionType,
            },
            canUndo: false,
            canRedo: false,
          });
          return;
        }

        // Skip if slides are identical
        if (JSON.stringify(state.present.slides) === JSON.stringify(newSlides)) {
          return;
        }

        // Add current state to past
        let newPast = [...state.past, state.present];

        // Limit history size
        if (newPast.length > state.maxHistorySize) {
          newPast = newPast.slice(1);
        }

        set({
          past: newPast,
          present: {
            slides: newSlides,
            timestamp: Date.now(),
            actionType,
          },
          future: [], // Clear future on new change
          canUndo: true,
          canRedo: false,
        });
      },

      undo: () => {
        const state = get();

        if (state.past.length === 0) {
          return null;
        }

        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, -1);

        // Move present to future
        const newFuture = state.present
          ? [deepCopy(state.present), ...state.future]
          : state.future;

        set({
          isUndoRedoInProgress: true,
          past: newPast,
          present: deepCopy(previous),
          future: newFuture,
          canUndo: newPast.length > 0,
          canRedo: true,
        });

        return previous;
      },

      redo: () => {
        const state = get();

        if (state.future.length === 0) {
          return null;
        }

        const next = state.future[0];
        const newFuture = state.future.slice(1);

        // Move present to past
        const newPast = state.present
          ? [...state.past, deepCopy(state.present)]
          : state.past;

        set({
          isUndoRedoInProgress: true,
          past: newPast,
          present: deepCopy(next),
          future: newFuture,
          canUndo: true,
          canRedo: newFuture.length > 0,
        });

        return next;
      },

      finishUndoRedo: () => {
        set({ isUndoRedoInProgress: false });
      },

      clearHistory: () => {
        set({
          past: [],
          future: [],
          present: null,
          canUndo: false,
          canRedo: false,
        });
      },
    }),
    { name: "undo-redo" }
  )
);
