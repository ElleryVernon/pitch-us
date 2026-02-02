/**
 * File upload and document extraction state management.
 *
 * This module provides a Zustand store for managing file uploads, document
 * extraction progress, and pending uploads. It tracks the state of files
 * being processed (extracting text content) and stores configuration and
 * extracted content for presentation generation.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { PresentationConfig } from "@/app/(presentation-generator)/utils/type";

/**
 * Structure for a file that has been uploaded and is being processed.
 *
 * Represents a file that has been uploaded and is in the process of having
 * its text content extracted. Tracks the extraction status and any errors
 * that occur during processing.
 *
 * @property id - Unique identifier for this file item.
 * @property fileName - Original filename of the uploaded file.
 * @property fileSize - Size of the file in bytes.
 * @property fileType - MIME type of the file (e.g., "application/pdf",
 *   "application/vnd.openxmlformats-officedocument.wordprocessingml.document").
 * @property content - Extracted text content from the file. Empty string until
 *   extraction is complete. Contains the full text content after successful
 *   extraction.
 * @property status - Current extraction status:
 *   - "extracting": Text extraction is in progress
 *   - "completed": Text has been successfully extracted
 *   - "error": Extraction failed
 * @property error - Optional error message if extraction failed. Only present
 *   when status is "error".
 */
export type ExtractedFileItem = {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  content: string;
  status: "extracting" | "completed" | "error";
  error?: string;
};

/**
 * Pending upload data ready for presentation generation.
 *
 * Contains all the information needed to generate a presentation, including
 * user configuration, extracted document content, and file metadata. This
 * structure is created after files are uploaded and processed, and is used
 * to initiate presentation generation.
 *
 * @property config - Presentation configuration including number of slides,
 *   language, tone, verbosity, and other generation settings.
 * @property documentContent - Optional extracted text content from all uploaded
 *   documents combined. Used as source material for LLM content generation.
 *   May be undefined if no documents were uploaded or extraction failed.
 * @property fileMetadata - Optional array of file metadata for uploaded files.
 *   Used for display purposes and file management. Each entry contains the
 *   file name, size, and type.
 */
export type PendingUpload = {
  config: PresentationConfig;
  // Extracted document content (from browser-side parsing)
  documentContent?: string;
  fileMetadata?: Array<{ name: string; size: number; type: string }>;
};

interface UploadState {
  config: PresentationConfig | null;
  extractedFiles: ExtractedFileItem[];
  pendingUpload: PendingUpload | null;

  // Actions
  setConfig: (config: PresentationConfig | null) => void;
  setExtractedFiles: (files: ExtractedFileItem[]) => void;
  addExtractedFile: (file: ExtractedFileItem) => void;
  updateExtractedFile: (
    id: string,
    updates: Partial<ExtractedFileItem>
  ) => void;
  clearExtractedFiles: () => void;
  setPendingUpload: (upload: PendingUpload | null) => void;
  clearPendingUpload: () => void;
  reset: () => void;
}

const initialState = {
  config: null,
  extractedFiles: [],
  pendingUpload: null,
};

export const useUploadStore = create<UploadState>()(
  devtools(
    (set) => ({
      ...initialState,

      setConfig: (config) => set({ config }),

      setExtractedFiles: (files) => set({ extractedFiles: files }),

      addExtractedFile: (file) =>
        set((state) => ({
          extractedFiles: [...state.extractedFiles, file],
        })),

      updateExtractedFile: (id, updates) =>
        set((state) => ({
          extractedFiles: state.extractedFiles.map((file) =>
            file.id === id ? { ...file, ...updates } : file
          ),
        })),

      clearExtractedFiles: () => set({ extractedFiles: [] }),

      setPendingUpload: (upload) => set({ pendingUpload: upload }),

      clearPendingUpload: () => set({ pendingUpload: null }),

      reset: () => set(initialState),
    }),
    { name: "upload" }
  )
);
