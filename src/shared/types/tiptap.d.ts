/**
 * Type declarations for TipTap editor extensions.
 *
 * This file provides TypeScript type extensions for TipTap, a headless
 * rich text editor framework. The declarations extend TipTap's core types
 * to include storage types for various extensions, ensuring type safety
 * when working with editor extensions and their storage mechanisms.
 */

import { MarkdownStorage } from "@tiptap/markdown";

/**
 * Type extension for TipTap core module.
 *
 * Extends the @tiptap/core module to add type definitions for extension
 * storage. TipTap extensions can store data in the editor's storage object,
 * and this declaration ensures TypeScript knows about the markdown extension's
 * storage structure.
 *
 * @remarks
 * This is specifically for TipTap 3.x compatibility. The Storage interface
 * extension allows the markdown extension to store its state in a type-safe
 * manner within the editor instance.
 */
declare module "@tiptap/core" {
  /**
   * Extended Storage interface for TipTap editor.
   *
   * The Storage interface is used by TipTap extensions to store extension-specific
   * data within the editor instance. This extension adds the markdown storage
   * type, which is used by the TipTap markdown extension to store markdown
   * conversion state and configuration.
   *
   * @property markdown - Storage object for the markdown extension. Contains
   *   state and configuration related to markdown parsing and serialization
   *   within the editor.
   */
  interface Storage {
    markdown: MarkdownStorage;
  }
}
