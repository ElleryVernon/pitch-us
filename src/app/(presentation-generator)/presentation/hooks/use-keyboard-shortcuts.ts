/**
 * React hook for managing keyboard shortcuts in the presentation editor.
 *
 * Provides a comprehensive keyboard shortcut system for presentation editing,
 * including undo/redo, slide navigation, presentation mode, and help shortcuts.
 * Handles platform differences (Mac vs Windows) and prevents shortcuts when
 * typing in input fields.
 */

"use client";

import { useEffect, useCallback, useState } from "react";

/**
 * Structure for defining a keyboard shortcut.
 *
 * @property key - The key to press (e.g., "z", "ArrowUp").
 * @property ctrlKey - Whether Ctrl (or Cmd on Mac) must be held.
 * @property metaKey - Whether Cmd (Mac) must be held.
 * @property shiftKey - Whether Shift must be held.
 * @property altKey - Whether Alt must be held.
 * @property action - Function to call when shortcut is triggered.
 * @property description - Human-readable description of the shortcut.
 */
interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

/**
 * Options for configuring keyboard shortcuts.
 *
 * @property onUndo - Callback for undo action (Ctrl+Z / Cmd+Z).
 * @property onRedo - Callback for redo action (Ctrl+Shift+Z / Cmd+Shift+Z).
 * @property onPrevSlide - Callback for previous slide (Arrow Up/Left).
 * @property onNextSlide - Callback for next slide (Arrow Down/Right).
 * @property onPresentMode - Callback for entering presentation mode (P).
 * @property onDeleteSlide - Callback for deleting slide (Ctrl+Backspace).
 * @property onShowShortcuts - Callback for showing shortcuts modal (?).
 * @property enabled - Whether shortcuts are enabled. Defaults to true.
 */
interface UseKeyboardShortcutsOptions {
  onUndo?: () => void;
  onRedo?: () => void;
  onPrevSlide?: () => void;
  onNextSlide?: () => void;
  onPresentMode?: () => void;
  onDeleteSlide?: () => void;
  onShowShortcuts?: () => void;
  enabled?: boolean;
}

/**
 * Return value from useKeyboardShortcuts hook.
 *
 * @property isShortcutsModalOpen - Whether the shortcuts modal is open.
 * @property setIsShortcutsModalOpen - Function to open/close shortcuts modal.
 * @property shortcuts - Array of shortcut definitions with keys and descriptions.
 */
interface UseKeyboardShortcutsReturn {
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;
  shortcuts: { keys: string; description: string }[];
}

/**
 * Hook for managing keyboard shortcuts in the presentation editor.
 *
 * Registers global keyboard shortcuts for common presentation actions.
 * Automatically detects Mac vs Windows/Linux and uses appropriate modifier
 * keys (Cmd on Mac, Ctrl on others). Prevents shortcuts when typing in
 * input fields or text areas.
 *
 * Supported shortcuts:
 * - Ctrl/Cmd + Z: Undo
 * - Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
 * - Arrow Up/Left: Previous slide
 * - Arrow Down/Right: Next slide
 * - P: Enter presentation mode
 * - ?: Show keyboard shortcuts modal
 * - Esc: Close modal / Exit mode
 * - Ctrl/Cmd + Backspace/Delete: Delete slide
 *
 * @param options - Configuration object with callback functions for actions.
 * @returns Object with shortcuts modal state and shortcut definitions.
 */
export const useKeyboardShortcuts = (
  options: UseKeyboardShortcutsOptions = {}
): UseKeyboardShortcutsReturn => {
  const {
    onUndo,
    onRedo,
    onPrevSlide,
    onNextSlide,
    onPresentMode,
    onDeleteSlide,
    onShowShortcuts,
    enabled = true,
  } = options;

  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Define shortcuts with their descriptions
  const shortcutsList: { keys: string; description: string }[] = [
    { keys: "⌘/Ctrl + Z", description: "Undo" },
    { keys: "⌘/Ctrl + Shift + Z", description: "Redo" },
    { keys: "↑ Arrow Up", description: "Previous slide" },
    { keys: "↓ Arrow Down", description: "Next slide" },
    { keys: "P", description: "Enter presentation mode" },
    { keys: "?", description: "Show keyboard shortcuts" },
    { keys: "Esc", description: "Close modal / Exit mode" },
  ];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      // Undo: Cmd/Ctrl + Z
      if (cmdOrCtrl && !event.shiftKey && event.key === "z") {
        event.preventDefault();
        onUndo?.();
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if (cmdOrCtrl && event.shiftKey && event.key === "z") {
        event.preventDefault();
        onRedo?.();
        return;
      }
      if (cmdOrCtrl && event.key === "y") {
        event.preventDefault();
        onRedo?.();
        return;
      }

      // Navigation: Arrow keys (without modifiers)
      if (!cmdOrCtrl && !event.shiftKey && !event.altKey) {
        switch (event.key) {
          case "ArrowUp":
          case "ArrowLeft":
            event.preventDefault();
            onPrevSlide?.();
            return;
          case "ArrowDown":
          case "ArrowRight":
            event.preventDefault();
            onNextSlide?.();
            return;
        }
      }

      // Present mode: P key
      if (event.key === "p" || event.key === "P") {
        if (!cmdOrCtrl && !event.shiftKey && !event.altKey) {
          event.preventDefault();
          onPresentMode?.();
          return;
        }
      }

      // Show shortcuts: ? key
      if (event.key === "?") {
        event.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        onShowShortcuts?.();
        return;
      }

      // Delete slide: Backspace or Delete (with Cmd/Ctrl)
      if (cmdOrCtrl && (event.key === "Backspace" || event.key === "Delete")) {
        event.preventDefault();
        onDeleteSlide?.();
        return;
      }

      // Close modal: Escape
      if (event.key === "Escape") {
        setIsShortcutsModalOpen(false);
        return;
      }
    },
    [
      enabled,
      onUndo,
      onRedo,
      onPrevSlide,
      onNextSlide,
      onPresentMode,
      onDeleteSlide,
      onShowShortcuts,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    shortcuts: shortcutsList,
  };
};

export default useKeyboardShortcuts;
