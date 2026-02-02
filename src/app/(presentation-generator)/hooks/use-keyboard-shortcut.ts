/**
 * React hook for handling keyboard shortcuts.
 *
 * Provides a hook for registering global keyboard shortcuts with Ctrl/Cmd
 * modifier support. Automatically handles event listener cleanup on unmount.
 */

import { useEffect, useCallback } from 'react';

/**
 * Keyboard event structure for shortcut handling.
 *
 * Simplified keyboard event interface for use in shortcut callbacks.
 *
 * @property key - The key that was pressed (lowercase).
 * @property ctrlKey - Whether Ctrl (or Cmd on Mac) was held.
 * @property shiftKey - Whether Shift was held.
 * @property preventDefault - Function to prevent default browser behavior.
 */
type KeyboardEvent = {
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  preventDefault: () => void;
};

/**
 * Hook for registering keyboard shortcuts.
 *
 * Registers a global keyboard shortcut that triggers when the specified keys
 * are pressed along with Ctrl (or Cmd on Mac). Automatically removes the
 * event listener on unmount or when dependencies change.
 *
 * @param keys - Array of key strings to listen for (e.g., ["s", "k"]).
 *   The callback fires when any of these keys is pressed with Ctrl.
 * @param callback - Function to call when the shortcut is triggered.
 *   Receives the keyboard event as a parameter.
 * @param deps - Dependency array for the callback. The shortcut is
 *   re-registered when dependencies change. Defaults to empty array.
 *
 * @example
 * ```typescript
 * useKeyboardShortcut(["s"], (e) => {
 *   console.log("Save shortcut pressed");
 * });
 * ```
 */
export const useKeyboardShortcut = (
  keys: string[],
  callback: (e: KeyboardEvent) => void,
  deps: any[] = []
) => {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const isCtrlPressed = event.ctrlKey;
      
      if (keys.includes(event.key.toLowerCase()) && isCtrlPressed) {
        event.preventDefault();
        callback(event);
      }
    },
    [callback, ...deps]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress as any);
    return () => {
      document.removeEventListener('keydown', handleKeyPress as any);
    };
  }, [handleKeyPress]);
}; 