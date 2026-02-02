"use client";

import React from "react";
import { X, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: { keys: string; description: string }[];
}

/**
 * Modal component showing available keyboard shortcuts
 * Displays in a clean, accessible format
 */
const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  shortcuts,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-stagger-1">
        <div className="bg-bg-100 rounded-2xl border border-bg-200 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-bg-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Keyboard className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-lg font-medium text-text-200">
                Keyboard Shortcuts
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-bg-200 transition-colors text-text-300 hover:text-text-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Shortcuts list */}
          <div className="p-6 max-h-[60vh] overflow-y-auto custom_scrollbar">
            <div className="space-y-3">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-bg-200/50 transition-colors"
                >
                  <span className="text-sm text-text-300">
                    {shortcut.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.split(" + ").map((key, keyIndex) => (
                      <React.Fragment key={keyIndex}>
                        {keyIndex > 0 && (
                          <span className="text-text-400 text-xs mx-0.5">+</span>
                        )}
                        <kbd
                          className={cn(
                            "px-2 py-1 text-xs font-medium rounded-md",
                            "bg-bg-200 text-text-200 border border-bg-300",
                            "shadow-sm"
                          )}
                        >
                          {key.trim()}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-bg-200 bg-bg-200/30">
            <p className="text-xs text-text-400 text-center">
              Press <kbd className="px-1.5 py-0.5 text-xs rounded bg-bg-200 border border-bg-300">?</kbd> anytime to show this dialog
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default KeyboardShortcutsModal;
