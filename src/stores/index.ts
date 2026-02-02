/**
 * Barrel export for all Zustand stores.
 *
 * This module re-exports all store hooks and related types from individual
 * store modules, providing a single import point for store access throughout
 * the application.
 *
 * Exports:
 * - Store hooks: React hooks for accessing and updating store state
 * - Type definitions: TypeScript types used by the stores
 *
 * @example
 * ```typescript
 * import {
 *   usePresentationDataStore,
 *   usePresentationUIStore,
 *   useUndoRedoStore
 * } from "@/stores";
 * ```
 */

// Zustand stores barrel export
export { usePresentationUIStore } from "./presentation-ui";
export { useUndoRedoStore } from "./undo-redo";
export {
  useUploadStore,
  type ExtractedFileItem,
  type PendingUpload,
} from "./upload";
export {
  usePresentationDataStore,
  type PresentationData,
  type OutlineSlide,
} from "./presentation-data";
export {
  useUserConfigStore,
  type LLMConfig,
} from "./user-config";
