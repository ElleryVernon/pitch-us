/**
 * React hook for presentation undo/redo functionality.
 *
 * Provides undo and redo operations for presentation slides using a Zustand
 * store for history management. Registers keyboard shortcuts (Ctrl+Z for undo,
 * Ctrl+Shift+Z for redo) and handles state restoration.
 */

import { useCallback } from "react";
import { useKeyboardShortcut } from "../../hooks/use-keyboard-shortcut";
import { useUndoRedoStore, usePresentationDataStore } from "@/stores";

/**
 * Hook for managing presentation undo/redo operations.
 *
 * Integrates with the undo/redo store to provide undo and redo functionality
 * for presentation slides. Registers keyboard shortcuts and provides callbacks
 * for undo/redo actions. Uses deep cloning to prevent reference issues.
 *
 * @returns Object containing:
 *   - onUndo: Function to undo the last change.
 *   - onRedo: Function to redo the last undone change.
 *   - canUndo: Whether undo is available.
 *   - canRedo: Whether redo is available.
 */
export const usePresentationUndoRedo = () => {
    const presentationData = usePresentationDataStore((state) => state.presentationData);
    const setPresentationData = usePresentationDataStore((state) => state.setPresentationData);
    
    // Use Zustand store for undo/redo state
    const {
      past,
      future,
      canUndo,
      canRedo,
      undo,
      redo,
      finishUndoRedo,
    } = useUndoRedoStore();

    const onUndo = useCallback(() => {
      if (!canUndo) return;

      const previousState = past[past.length - 1];
      undo();

      if (previousState && presentationData) {
        const newSlides = JSON.parse(JSON.stringify(previousState.slides));
        setPresentationData({
          ...presentationData,
          slides: newSlides,
        });
      }

      setTimeout(() => {
        finishUndoRedo();
      }, 100);
    }, [canUndo, presentationData, past, undo, finishUndoRedo, setPresentationData]);

    const onRedo = useCallback(() => {
      if (!canRedo) return;

      const nextState = future[0];
      redo();

      if (nextState && presentationData) {
        const newSlides = JSON.parse(JSON.stringify(nextState.slides));
        setPresentationData({
          ...presentationData,
          slides: newSlides,
        });
      }

      setTimeout(() => {
        finishUndoRedo();
      }, 100);
    }, [canRedo, presentationData, future, redo, finishUndoRedo, setPresentationData]);

    // Handle undo keyboard shortcut
    useKeyboardShortcut(
      ["z"],
      (e) => {
        if (e.ctrlKey && !e.shiftKey && canUndo) {
          e.preventDefault();

          const previousState = past[past.length - 1];
          undo();

          if (previousState && presentationData) {
            const newSlides = JSON.parse(JSON.stringify(previousState.slides));
            setPresentationData({
              ...presentationData,
              slides: newSlides,
            });
          }

          setTimeout(() => {
            finishUndoRedo();
          }, 100);
        }
      },
      [past, presentationData, canUndo, undo, finishUndoRedo, setPresentationData]
    );

    // Handle redo keyboard shortcut
    useKeyboardShortcut(
      ["z"],
      (e) => {
        if (e.ctrlKey && e.shiftKey && canRedo) {
          e.preventDefault();

          const nextState = future[0];
          redo();

          if (nextState && presentationData) {
            const newSlides = JSON.parse(JSON.stringify(nextState.slides));
            setPresentationData({
              ...presentationData,
              slides: newSlides,
            });
          }

          setTimeout(() => {
            finishUndoRedo();
          }, 100);
        }
      },
      [future, presentationData, canRedo, redo, finishUndoRedo, setPresentationData]
    );

    return { onUndo, onRedo, canUndo, canRedo };
}
