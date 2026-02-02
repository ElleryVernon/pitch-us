/**
 * Claude-style chat input component with file upload and paste support.
 *
 * A sophisticated chat input component inspired by Claude AI's interface,
 * featuring a two-phase interaction model (upload and compose), file attachment
 * support, paste handling, and model selection. The component supports drag-and-drop
 * file uploads, clipboard paste for both files and text, and displays file previews
 * with upload status indicators.
 *
 * Features:
 * - Two-phase UI: Upload phase (for attaching files) and Compose phase (for typing)
 * - File attachment: PDF, PPT, PPTX files with preview cards
 * - Paste support: Text paste and file paste from clipboard
 * - Model selection: Dropdown for choosing LLM models
 * - Extended thinking: Toggle for enabling extended reasoning mode
 * - Auto-resizing textarea: Grows with content up to maximum height
 * - Keyboard shortcuts: Enter to send, Shift+Enter for new line
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  ChevronDown,
  ArrowUp,
  X,
  FileText,
  Loader2,
  Check,
  Archive,
  CloudUpload,
} from "lucide-react";

/**
 * Icon components used throughout the chat input.
 *
 * Exports a collection of icon components including custom SVG icons and
 * Lucide React icons. Icons are used for UI elements like buttons, file
 * types, and status indicators.
 */
export const Icons = {
  Logo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
      {...props}
    >
      <defs>
        <ellipse id="petal-pair" cx="100" cy="100" rx="90" ry="22" />
      </defs>
      <g fill="#D46B4F" fillRule="evenodd">
        <use href="#petal-pair" transform="rotate(0 100 100)" />
        <use href="#petal-pair" transform="rotate(45 100 100)" />
        <use href="#petal-pair" transform="rotate(90 100 100)" />
        <use href="#petal-pair" transform="rotate(135 100 100)" />
      </g>
    </svg>
  ),
  // Using Lucide React for premium, consistent icons
  Plus: Plus,
  Thinking: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M10.3857 2.50977C14.3486 2.71054 17.5 5.98724 17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 9.72386 2.72386 9.5 3 9.5C3.27614 9.5 3.5 9.72386 3.5 10C3.5 13.5899 6.41015 16.5 10 16.5C13.5899 16.5 16.5 13.5899 16.5 10C16.5 6.5225 13.7691 3.68312 10.335 3.50879L10 3.5L9.89941 3.49023C9.67145 3.44371 9.5 3.24171 9.5 3C9.5 2.72386 9.72386 2.5 10 2.5L10.3857 2.50977ZM10 5.5C10.2761 5.5 10.5 5.72386 10.5 6V9.69043L13.2236 11.0527C13.4706 11.1762 13.5708 11.4766 13.4473 11.7236C13.3392 11.9397 13.0957 12.0435 12.8711 11.9834L12.7764 11.9473L9.77637 10.4473C9.60698 10.3626 9.5 10.1894 9.5 10V6C9.5 5.72386 9.72386 5.5 10 5.5ZM3.66211 6.94141C4.0273 6.94159 4.32303 7.23735 4.32324 7.60254C4.32324 7.96791 4.02743 8.26446 3.66211 8.26465C3.29663 8.26465 3 7.96802 3 7.60254C3.00021 7.23723 3.29676 6.94141 3.66211 6.94141ZM4.95605 4.29395C5.32146 4.29404 5.61719 4.59063 5.61719 4.95605C5.6171 5.3214 5.3214 5.61709 4.95605 5.61719C4.59063 5.61719 4.29403 5.32146 4.29395 4.95605C4.29395 4.59057 4.59057 4.29395 4.95605 4.29395ZM7.60254 3C7.96802 3 8.26465 3.29663 8.26465 3.66211C8.26446 4.02743 7.96791 4.32324 7.60254 4.32324C7.23736 4.32302 6.94159 4.0273 6.94141 3.66211C6.94141 3.29676 7.23724 3.00022 7.60254 3Z"></path>
    </svg>
  ),
  SelectArrow: ChevronDown,
  ArrowUp: ArrowUp,
  X: X,
  FileText: FileText,
  Loader2: Loader2,
  Check: Check,
  Archive: Archive,
  Clock: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      {...props}
    >
      <path d="M10.3857 2.50977C14.3486 2.71054 17.5 5.98724 17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 9.72386 2.72386 9.5 3 9.5C3.27614 9.5 3.5 9.72386 3.5 10C3.5 13.5899 6.41015 16.5 10 16.5C13.5899 16.5 16.5 13.5899 16.5 10C16.5 6.5225 13.7691 3.68312 10.335 3.50879L10 3.5L9.89941 3.49023C9.67145 3.44371 9.5 3.24171 9.5 3C9.5 2.72386 9.72386 2.5 10 2.5L10.3857 2.50977ZM10 5.5C10.2761 5.5 10.5 5.72386 10.5 6V9.69043L13.2236 11.0527C13.4706 11.1762 13.5708 11.4766 13.4473 11.7236C13.3392 11.9397 13.0957 12.0435 12.8711 11.9834L12.7764 11.9473L9.77637 10.4473C9.60698 10.3626 9.5 10.1894 9.5 10V6C9.5 5.72386 9.72386 5.5 10 5.5ZM3.66211 6.94141C4.0273 6.94159 4.32303 7.23735 4.32324 7.60254C4.32324 7.96791 4.02743 8.26446 3.66211 8.26465C3.29663 8.26465 3 7.96802 3 7.60254C3.00021 7.23723 3.29676 6.94141 3.66211 6.94141ZM4.95605 4.29395C5.32146 4.29404 5.61719 4.59063 5.61719 4.95605C5.6171 5.3214 5.3214 5.61709 4.95605 5.61719C4.59063 5.61719 4.29403 5.32146 4.29395 4.95605C4.29395 4.59057 4.59057 4.29395 4.95605 4.29395ZM7.60254 3C7.96802 3 8.26465 3.29663 8.26465 3.66211C8.26446 4.02743 7.96791 4.32324 7.60254 4.32324C7.23736 4.32302 6.94159 4.0273 6.94141 3.66211C6.94141 3.29676 7.23724 3.00022 7.60254 3Z"></path>
    </svg>
  ),
};

/**
 * Utility functions for file handling and formatting.
 */

/**
 * Formats a file size in bytes to a human-readable string.
 *
 * Converts byte values to appropriate units (Bytes, KB, MB, GB) with two
 * decimal places. Uses base-1024 (binary) conversion.
 *
 * @param bytes - File size in bytes.
 * @returns Formatted string (e.g., "1.5 MB", "256 KB").
 */
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Maximum number of file attachments allowed.
 *
 * Limits the number of files that can be attached to prevent UI clutter
 * and manage resource usage.
 */
const MAX_ATTACHMENTS = 3;

/**
 * Allowed file extensions for uploads.
 *
 * File extensions that are accepted for attachment. Only PDF and PowerPoint
 * formats are supported.
 */
const ALLOWED_EXTENSIONS = ["pdf", "ppt", "pptx"];

/**
 * Allowed MIME types for file uploads.
 *
 * MIME types that are accepted for attachment. Used for file type validation
 * in addition to extension checking.
 */
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

/**
 * HTML accept attribute value for file input.
 *
 * Combined list of extensions and MIME types for use in HTML file input
 * accept attribute. Allows browsers to filter file picker to only show
 * supported file types.
 */
const ACCEPT_ATTRIBUTE = [
  ".pdf",
  ".ppt",
  ".pptx",
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
].join(",");

/**
 * Extracts the file extension from a filename.
 *
 * Gets the extension (part after the last dot) from a filename and converts
 * it to lowercase. Returns empty string if no extension is found.
 *
 * @param fileName - Full filename including extension.
 * @returns File extension in lowercase (e.g., "pdf", "pptx"), or empty string.
 */
const getFileExtension = (fileName: string): string => {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
};

/**
 * Checks if a file is supported for upload.
 *
 * Validates that a file matches the allowed extensions or MIME types.
 * Used to filter out unsupported files before processing.
 *
 * @param file - File object to validate.
 * @returns True if the file extension or MIME type is in the allowed lists,
 *   false otherwise.
 */
const isSupportedFile = (file: File): boolean => {
  const extension = getFileExtension(file.name);
  if (ALLOWED_EXTENSIONS.includes(extension)) {
    return true;
  }
  return ALLOWED_MIME_TYPES.includes(file.type);
};

/**
 * Component definitions for the chat input interface.
 */

/**
 * Structure for an attached file.
 *
 * Represents a file that has been attached to the chat input, including
 * metadata and processing status.
 *
 * @property id - Unique identifier for this file attachment.
 * @property file - The actual File object from the file input or drag-drop.
 * @property type - MIME type of the file (e.g., "application/pdf").
 * @property preview - Optional preview URL for image files. Created using
 *   URL.createObjectURL() for display purposes.
 * @property uploadStatus - Current upload/processing status ("uploading",
 *   "completed", "error", etc.).
 * @property content - Optional extracted text content from the file. Populated
 *   after file processing.
 */
interface AttachedFile {
  id: string;
  file: File;
  type: string;
  preview: string | null;
  uploadStatus: string;
  content?: string;
}

/**
 * Structure for pasted text content.
 *
 * Represents text content that has been pasted into the chat input (rather
 * than typed). Used for tracking and displaying pasted content separately
 * from typed messages.
 *
 * @property id - Unique identifier for this pasted content.
 * @property content - The pasted text content.
 * @property timestamp - When the content was pasted.
 */
interface PastedContent {
  id: string;
  content: string;
  timestamp: Date;
}

/**
 * Props for the FilePreviewCard component.
 *
 * @property file - AttachedFile object to display.
 * @property onRemove - Callback function called when the file should be removed.
 *   Receives the file ID as a parameter.
 * @property disableEntryAnimation - Whether to skip the fade-in animation
 *   when the card is first rendered. Used to prevent animation when content
 *   is programmatically added.
 */
interface FilePreviewCardProps {
  file: AttachedFile;
  onRemove: (id: string) => void;
  disableEntryAnimation?: boolean;
}

/**
 * File preview card component.
 *
 * Displays a preview of an attached file with thumbnail (for images) or
 * file icon and metadata (for documents). Shows upload status and provides
 * a remove button on hover. Supports fade-in animation on mount.
 *
 * @param file - File attachment to display.
 * @param onRemove - Function to call when remove button is clicked.
 * @param disableEntryAnimation - Whether to disable the entry animation.
 * @returns A card element displaying file preview with remove button and status.
 */
const FilePreviewCard: React.FC<FilePreviewCardProps> = ({
  file,
  onRemove,
  disableEntryAnimation = false,
}) => {
  const isImage = file.type.startsWith("image/") && file.preview;
  const shouldAnimateRef = useRef(!disableEntryAnimation);

  return (
    <div
      className={`relative group flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-bg-300 bg-bg-200 transition-all hover:border-text-400 ${
        shouldAnimateRef.current ? "animate-fade-in" : ""
      }`}
    >
      {isImage ? (
        <div className="w-full h-full relative">
          <img
            src={file.preview!}
            alt={file.file.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
        </div>
      ) : (
        <div className="w-full h-full p-3 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-bg-300 rounded">
              <Icons.FileText className="w-3.5 h-3.5 text-text-300" />
            </div>
            <span className="text-[9px] font-medium text-text-400 uppercase tracking-wider truncate">
              {file.file.name.split(".").pop()}
            </span>
          </div>
          <div className="space-y-0.5">
            <p
              className="text-[11px] font-medium text-text-200 truncate"
              title={file.file.name}
            >
              {file.file.name}
            </p>
            <p className="text-[9px] text-text-500">
              {formatFileSize(file.file.size)}
            </p>
          </div>
        </div>
      )}

      {/* Remove Button Overlay */}
      <button
        onClick={() => onRemove(file.id)}
        className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Icons.X className="w-3 h-3" />
      </button>

      {/* Upload Status */}
      {file.uploadStatus === "uploading" && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <Icons.Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
      )}
    </div>
  );
};

/**
 * Props for the PastedContentCard component.
 *
 * @property content - PastedContent object to display.
 * @property onRemove - Callback function called when the pasted content
 *   should be removed. Receives the content ID as a parameter.
 * @property disableEntryAnimation - Whether to skip the fade-in animation.
 */
interface PastedContentCardProps {
  content: PastedContent;
  onRemove: (id: string) => void;
  disableEntryAnimation?: boolean;
}

/**
 * Pasted content preview card component.
 *
 * Displays a preview card for text content that was pasted (rather than typed).
 * Shows a snippet of the pasted text and a "PASTED" badge. Provides a remove
 * button on hover. Used to distinguish pasted content from typed messages.
 *
 * @param content - Pasted content object to display.
 * @param onRemove - Function to call when remove button is clicked.
 * @param disableEntryAnimation - Whether to disable the entry animation.
 * @returns A card element displaying pasted content preview with remove button.
 */
const PastedContentCard: React.FC<PastedContentCardProps> = ({
  content,
  onRemove,
  disableEntryAnimation = false,
}) => {
  const shouldAnimateRef = useRef(!disableEntryAnimation);

  return (
    <div
      className={`relative group flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border border-[#E5E5E5] dark:border-[#30302E] bg-white dark:bg-[#20201F] p-2.5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${
        shouldAnimateRef.current ? "animate-fade-in" : ""
      }`}
    >
      <div className="overflow-hidden w-full">
        <p className="text-[10px] text-[#9CA3AF] leading-[1.4] font-mono break-words whitespace-pre-wrap line-clamp-4 select-none">
          {content.content}
        </p>
      </div>

      <div className="flex items-center justify-between w-full mt-2">
        <div className="inline-flex items-center justify-center px-1.5 py-[2px] rounded border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-transparent">
          <span className="text-[9px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider font-sans">
            PASTED
          </span>
        </div>
      </div>

      <button
        onClick={() => onRemove(content.id)}
        className="absolute top-2 right-2 p-[3px] bg-white dark:bg-[#30302E] border border-[#E5E5E5] dark:border-[#404040] rounded-full text-[#9CA3AF] hover:text-[#6B7280] dark:hover:text-white transition-colors shadow-sm opacity-0 group-hover:opacity-100"
      >
        <Icons.X className="w-2 h-2" />
      </button>
    </div>
  );
};

/**
 * Model definition structure.
 *
 * Represents an LLM model that can be selected for content generation.
 *
 * @property id - Unique identifier for the model (e.g., "gpt-4", "claude-3-opus").
 * @property name - Display name for the model (e.g., "GPT-4", "Claude 3 Opus").
 * @property description - Brief description explaining the model's capabilities
 *   or use case.
 * @property badge - Optional badge text (e.g., "Pro", "Fast") to highlight
 *   special features or tiers.
 */
interface Model {
  id: string;
  name: string;
  description: string;
  badge?: string;
}

/**
 * Props for the ModelSelector component.
 *
 * @property models - Array of available models to choose from.
 * @property selectedModel - ID of the currently selected model.
 * @property onSelect - Callback function called when a model is selected.
 *   Receives the model ID as a parameter.
 */
interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
}

/**
 * Model selector dropdown component.
 *
 * Displays a dropdown menu for selecting an LLM model. Shows the currently
 * selected model name and opens a dropdown with all available models when
 * clicked. Each model option displays its name, description, and optional badge.
 * Closes when clicking outside or selecting a model.
 *
 * @param models - Array of available models.
 * @param selectedModel - ID of the currently selected model.
 * @param onSelect - Function to call when a model is selected.
 * @returns A button with dropdown menu for model selection.
 */
const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = models.find((m) => m.id === selectedModel) || models[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-center relative shrink-0 transition font-base duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] h-8 rounded-lg px-2.5 min-w-[3.25rem] active:scale-[0.98] whitespace-nowrap pl-2.5 pr-2 gap-1 
                ${
                  isOpen
                    ? "bg-bg-200 text-text-100 dark:bg-[#454540] dark:text-[#ECECEC]"
                    : "text-text-100 hover:text-text-100 hover:bg-bg-200 dark:text-[#ECECEC] dark:hover:text-[#ECECEC] dark:hover:bg-[#454540]"
                }`}
      >
        <div className="font-ui inline-flex gap-[3px] text-[13px] h-[15px] leading-none items-baseline">
          <div className="flex items-center gap-[4px]">
            <div className="whitespace-nowrap select-none font-normal">
              {currentModel.name}
            </div>
          </div>
        </div>
        <div
          className="flex items-center justify-center opacity-75"
          style={{ width: "20px", height: "20px" }}
        >
          <Icons.SelectArrow
            className={`shrink-0 opacity-75 transition-transform duration-200 w-4 h-4 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-[220px] sm:w-[260px] bg-white dark:bg-[#212121] border border-[#DDDDDD] dark:border-[#30302E] rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col p-1.5 animate-fade-in origin-bottom-right">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onSelect(model.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start justify-between group transition-colors hover:bg-bg-200 dark:hover:bg-[#30302E]`}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-normal text-text-100 dark:text-[#ECECEC]">
                    {model.name}
                  </span>
                  {model.badge && (
                    <span
                      className={`px-1.5 py-[1px] rounded-full text-[10px] font-medium border ${
                        model.badge === "Pro"
                          ? "border-accent/30 text-accent bg-accent/10"
                          : "border-bg-300 text-text-300"
                      }`}
                    >
                      {model.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-text-300 dark:text-[#999999]">
                  {model.description}
                </span>
              </div>
              {selectedModel === model.id && (
                <Icons.Check className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-1" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Props for the UploadZone component.
 *
 * @property onFilesSelected - Callback function called when files are selected
 *   (via click or drag-drop). Receives a FileList or File array.
 * @property fileInputRef - Ref to the hidden file input element. Used to
 *   programmatically trigger file selection dialog.
 * @property isDragging - Whether files are currently being dragged over the zone.
 *   Used to show visual feedback during drag operations.
 */
interface UploadZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isDragging: boolean;
}

/**
 * Upload zone component for the initial/upload phase.
 *
 * Displays a large clickable area with upload icon and instructions for
 * uploading files. This is shown when the component is in "upload" phase.
 * Users can click to open file picker or drag-and-drop files onto this zone.
 * Provides visual feedback when files are being dragged over.
 *
 * @param onFilesSelected - Function to call when files are selected.
 * @param fileInputRef - Ref to the file input element.
 * @param isDragging - Whether drag operation is active.
 * @returns A clickable upload zone with icon and instructions.
 */
const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  fileInputRef,
  isDragging,
}) => {
  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      className={`
        flex flex-col items-center justify-center cursor-pointer
        h-full py-8 sm:py-10
        transition-all duration-200 ease-out relative group
        ${isDragging 
          ? "bg-accent/[0.03]" 
          : "hover:bg-bg-200/30"
        }
      `}
    >
      {/* Cloud Upload Icon */}
      <div className={`
        relative mb-5 transition-all duration-200
        ${isDragging ? "scale-105" : "group-hover:scale-[1.02]"}
      `}>
        <CloudUpload
          className={`w-12 h-12 sm:w-14 sm:h-14 transition-colors duration-200 ${
            isDragging ? "text-accent" : "text-text-400 group-hover:text-text-300"
          }`}
          strokeWidth={1.2}
        />
      </div>

      {/* Text */}
      <div className="text-center space-y-1.5">
        {/* Mobile text */}
        <p className={`sm:hidden text-sm font-medium transition-colors duration-200 ${
          isDragging ? "text-accent" : "text-text-200"
        }`}>
          {isDragging ? "Drop to upload" : "Upload your deck, we'll make it pitch-perfect"}
        </p>
        {/* Desktop text */}
        <p className={`hidden sm:block text-base font-medium transition-colors duration-200 ${
          isDragging ? "text-accent" : "text-text-200"
        }`}>
          {isDragging ? "Drop to upload" : "Drop your deck, we'll make it pitch-perfect"}
        </p>
        {/* Mobile sub text */}
        <p className="sm:hidden text-xs text-text-400">
          <span className={`font-medium transition-colors duration-200 ${
            isDragging ? "text-accent" : "text-accent/80 group-hover:text-accent"
          }`}>
            Tap to browse
          </span>
        </p>
        {/* Desktop sub text */}
        <p className="hidden sm:block text-sm text-text-400">
          or{" "}
          <span className={`font-medium transition-colors duration-200 ${
            isDragging ? "text-accent" : "text-accent/80 group-hover:text-accent"
          }`}>
            browse files
          </span>
        </p>
      </div>

      {/* Supported formats */}
      <div className="flex items-center gap-2 mt-5">
        {["PDF", "PPT", "PPTX"].map((format) => (
          <span
            key={format}
            className={`
              px-2.5 py-1 text-[11px] font-semibold rounded-md border
              transition-colors duration-200
              ${isDragging 
                ? "text-accent border-accent/30 bg-accent/10" 
                : "text-text-300 border-bg-300 bg-bg-200"
              }
            `}
          >
            {format}
          </span>
        ))}
      </div>
    </div>
  );
};

/**
 * Main chat input component with two-phase interaction model.
 */

/**
 * UI phase type for the chat input.
 *
 * Determines which UI state is displayed:
 * - "upload": Initial state showing upload zone for file selection
 * - "compose": Active state showing text input and attached content
 */
type Phase = "upload" | "compose";

/**
 * Result returned from onSendMessage callback.
 *
 * @property navigating - If true, indicates a page navigation is pending.
 *   When set, the component will fadeout instead of clearing state to prevent
 *   layout jumps before the actual navigation occurs.
 */
export interface SendMessageResult {
  navigating?: boolean;
}

/**
 * Props for the ClaudeChatInput component.
 *
 * @property onSendMessage - Callback function called when the user sends
 *   a message. Receives an object containing the message text, attached files,
 *   pasted content, selected model ID, and thinking mode status.
 *   Can optionally return a SendMessageResult to control post-send behavior.
 */
interface ClaudeChatInputProps {
  onSendMessage: (data: {
    message: string;
    files: AttachedFile[];
    pastedContent: PastedContent[];
    model: string;
    isThinkingEnabled: boolean;
  }) => void | Promise<void | SendMessageResult>;
}

/**
 * Main Claude-style chat input component.
 *
 * A sophisticated chat input component featuring a two-phase interaction model:
 * 1. Upload phase: Initial state with drag-and-drop file upload zone
 * 2. Compose phase: Active state with text input, file previews, and model selection
 *
 * Features:
 * - Automatic phase transitions when files/content are added
 * - Drag-and-drop file uploads (PDF, PPT, PPTX)
 * - Clipboard paste support for files and text
 * - Model selection dropdown (Pitch 1.0 Lite, Pitch 1.0, Pitch 1.0 Max)
 * - Extended thinking mode toggle
 * - Auto-resizing textarea
 * - Keyboard shortcuts (Enter to send, Shift+Enter for new line)
 * - Smooth animations between phases
 * - File preview cards with remove functionality
 * - Pasted content tracking and display
 *
 * The component manages its own state for message text, files, pasted content,
 * selected model, and UI phase. When the user sends a message, all this data
 * is passed to the onSendMessage callback.
 *
 * @param onSendMessage - Function called when user sends a message with all
 *   collected data (message, files, pasted content, model, thinking mode).
 * @returns A complete chat input interface with upload and compose phases.
 */
export const ClaudeChatInput: React.FC<ClaudeChatInputProps> = ({
  onSendMessage,
}) => {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [pastedContent, setPastedContent] = useState<PastedContent[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedModel, setSelectedModel] = useState("pitch-1-lite");
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Phase state for upload-first UI
  const [phase, setPhase] = useState<Phase>("upload");
  const [suppressEntryAnimation, setSuppressEntryAnimation] = useState(false);
  // Crossfade is handled via CSS

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isClearingToUploadRef = useRef(false);
  const suppressTimerRef = useRef<number | null>(null);

  const models = [
    {
      id: "pitch-1-lite",
      name: "Pitch 1.0 Lite",
      description: "The 'Elevator Pitch' speed",
    },
    {
      id: "pitch-1",
      name: "Pitch 1.0",
      description: "The 'Partner Meeting' standard",
      badge: "Pro",
    },
    {
      id: "pitch-1-max",
      name: "Pitch 1.0 Max",
      description: "The 'Term Sheet' closer",
      badge: "Pro",
    },
  ];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 384) + "px"; // 96 * 4 = 384px (max-h-96)
    }
  }, [message]);

  // Auto-transition to compose phase when files are uploaded
  useEffect(() => {
    if (isClearingToUploadRef.current) return;
    if (files.length > 0 && phase === "upload") {
      setSuppressEntryAnimation(true);
      if (suppressTimerRef.current) {
        window.clearTimeout(suppressTimerRef.current);
      }
      suppressTimerRef.current = window.setTimeout(() => {
        setSuppressEntryAnimation(false);
      }, 240);

      setPhase("compose");
      // Focus textarea after transition (slightly delayed to wait for render)
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [files.length, phase]);

  // Auto-transition to compose phase when content is pasted (if it's not a file)
  useEffect(() => {
    if (isClearingToUploadRef.current) return;
    if (pastedContent.length > 0 && phase === "upload") {
      setSuppressEntryAnimation(true);
      if (suppressTimerRef.current) {
        window.clearTimeout(suppressTimerRef.current);
      }
      suppressTimerRef.current = window.setTimeout(() => {
        setSuppressEntryAnimation(false);
      }, 240);

      setPhase("compose");
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [pastedContent.length, phase]);

  // Handle file removal with smooth transition
  const handleRemoveFile = useCallback((id: string) => {
    const remainingFiles = files.filter(f => f.id !== id);
    
    // If this is the last file and no other content, transition first then remove
    if (remainingFiles.length === 0 && pastedContent.length === 0 && !message.trim()) {
      isClearingToUploadRef.current = true;
      setPhase("upload");
      // Remove file after transition animation completes
      setTimeout(() => {
        setFiles(remainingFiles);
        isClearingToUploadRef.current = false;
      }, 250);
    } else {
      setFiles(remainingFiles);
    }
  }, [files, pastedContent.length, message]);

  // Handle pasted content removal with smooth transition
  const handleRemovePastedContent = useCallback((id: string) => {
    const remainingContent = pastedContent.filter(c => c.id !== id);
    
    // If this is the last content and no other content, transition first then remove
    if (remainingContent.length === 0 && files.length === 0 && !message.trim()) {
      isClearingToUploadRef.current = true;
      setPhase("upload");
      // Remove content after transition animation completes
      setTimeout(() => {
        setPastedContent(remainingContent);
        isClearingToUploadRef.current = false;
      }, 250);
    } else {
      setPastedContent(remainingContent);
    }
  }, [pastedContent, files.length, message]);

  // File Handling
  const handleFiles = useCallback(
    (newFilesList: FileList | File[]) => {
      isClearingToUploadRef.current = false;
      const incomingFiles = Array.from(newFilesList);
      const invalidFiles = incomingFiles.filter(
        (file) => !isSupportedFile(file),
      );
      const validFiles = incomingFiles.filter((file) => isSupportedFile(file));

      if (invalidFiles.length > 0) {
        toast.error("Invalid file type", {
          description: "Please upload only PDF, PPT, or PPTX files",
        });
      }

      if (validFiles.length === 0) {
        return;
      }

      const availableSlots = MAX_ATTACHMENTS - files.length;
      if (availableSlots <= 0) {
        toast.error("File limit reached", {
          description: `You can upload up to ${MAX_ATTACHMENTS} files`,
        });
        return;
      }

      const acceptedFiles = validFiles.slice(0, availableSlots);
      const isTruncated = validFiles.length > availableSlots;
      const newFiles = acceptedFiles.map((file) => {
        const isImage =
          file.type.startsWith("image/") ||
          /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
        return {
          id: Math.random().toString(36).substr(2, 9),
          file,
          type: isImage
            ? "image/unknown"
            : file.type || "application/octet-stream", // Force image type if detected by extension
          preview: isImage ? URL.createObjectURL(file) : null,
          uploadStatus: "pending",
        };
      });

      if (newFiles.length === 0) {
        return;
      }

      if (isTruncated) {
        toast.error("File limit reached", {
          description: `Only ${MAX_ATTACHMENTS} files can be uploaded`,
        });
      }

      // Simulate Upload
      setFiles((prev) => [...prev, ...newFiles]);

      newFiles.forEach((f) => {
        setTimeout(
          () => {
            setFiles((prev) =>
              prev.map((p) =>
                p.id === f.id ? { ...p, uploadStatus: "complete" } : p,
              ),
            );
          },
          800 + Math.random() * 1000,
        );
      });
    },
    [files],
  );

  // Drag & Drop
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  // Paste Handling
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const pastedFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file") {
        const file = items[i].getAsFile();
        if (file) pastedFiles.push(file);
      }
    }

    if (pastedFiles.length > 0) {
      e.preventDefault();
      handleFiles(pastedFiles);
      return;
    }

    // Handle large text paste
    const text = e.clipboardData.getData("text");
    if (text.length > 300) {
      e.preventDefault();
      const snippet = {
        id: Math.random().toString(36).substr(2, 9),
        content: text,
        timestamp: new Date(),
      };
      setPastedContent((prev) => [...prev, snippet]);

      if (!message) {
        setMessage("Analyzed pasted text...");
      }
    }
  };

  // Global Paste Handling
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Ignore if compose phase and textarea is focused (handled natively)
      if (phase === "compose" && document.activeElement === textareaRef.current) return;
      
      // Handle paste for upload phase or when textarea not focused
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      let hasText = false;

      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === "file") {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        } else if (items[i].kind === "string" && items[i].type === "text/plain") {
          hasText = true;
        }
      }

      if (pastedFiles.length > 0) {
        e.preventDefault();
        handleFiles(pastedFiles);
        return;
      }

      // Handle text paste manually if we are in upload phase
      if (hasText && phase === "upload") {
        e.preventDefault(); // Prevent double paste if focus is somehow on an input
        const text = e.clipboardData?.getData("text");
        if (text) {
          if (text.length > 300) {
            const snippet = {
              id: Math.random().toString(36).substr(2, 9),
              content: text,
              timestamp: new Date(),
            };
            setPastedContent((prev) => [...prev, snippet]);
            setMessage("Analyzed pasted text...");
          } else {
            // For short text, we just switch to compose mode and set the message
            setMessage(text);
            setSuppressEntryAnimation(true);
            if (suppressTimerRef.current) {
              window.clearTimeout(suppressTimerRef.current);
            }
            suppressTimerRef.current = window.setTimeout(() => {
              setSuppressEntryAnimation(false);
            }, 240);

            setPhase("compose");
            setTimeout(() => {
              textareaRef.current?.focus();
              // Move cursor to end
              if (textareaRef.current) {
                 textareaRef.current.selectionStart = textareaRef.current.value.length;
                 textareaRef.current.selectionEnd = textareaRef.current.value.length;
              }
            }, 100);
          }
        }
      }
    };

    document.addEventListener("paste", handleGlobalPaste);
    return () => document.removeEventListener("paste", handleGlobalPaste);
  }, [phase, handleFiles, setPastedContent, setMessage]);

  const handleSend = async () => {
    if (!message.trim() && files.length === 0 && pastedContent.length === 0) {
      return;
    }
    if (isSending) {
      return;
    }

    setIsSending(true);
    let navigating = false;
    try {
      const result = await onSendMessage({
        message,
        files,
        pastedContent,
        model: selectedModel,
        isThinkingEnabled,
      });

      // Check if page navigation is pending
      if (result && typeof result === "object" && result.navigating) {
        // Keep UI state intact to prevent layout jump before navigation
        navigating = true;
      } else {
        // Normal case: clear state
        setMessage("");
        setFiles([]);
        setPastedContent([]);
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      }
    } finally {
      // Don't reset isSending if we're exiting (navigation pending)
      if (!navigating) {
        setIsSending(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasContent =
    message.trim() || files.length > 0 || pastedContent.length > 0;

  return (
    <div
      className={`relative w-full max-w-3xl mx-auto transition-all duration-300 font-sans`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Main Container */}
      <div
        className={`
          !box-content mx-0 sm:mx-2 md:mx-0 relative z-10 rounded-2xl sm:rounded-3xl
          border bg-bg-100 dark:bg-[#30302E] font-sans antialiased overflow-hidden
          shadow-[0_6px_18px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_22px_rgba(0,0,0,0.09)]
          focus-within:shadow-[0_10px_26px_rgba(0,0,0,0.12)]
          h-[220px] sm:h-[256px]
          ${phase === "upload" 
            ? `cursor-pointer ${isDragging ? "border-accent border-dashed" : "border-bg-200/60"}` 
            : "cursor-text border-bg-200/60"
          }
        `}
      >
        {/* Upload Phase - absolutely positioned */}
        <div
          className={`absolute inset-0 transition-opacity duration-[240ms] ease-out ${
            phase === "upload" ? "opacity-100" : "opacity-0"
          }`}
          style={{ pointerEvents: phase === "upload" ? "auto" : "none" }}
        >
          <UploadZone
            onFilesSelected={handleFiles}
            fileInputRef={fileInputRef}
            isDragging={isDragging}
          />
        </div>

        {/* Compose Phase - absolutely positioned */}
        <div
          className={`absolute inset-0 flex flex-col px-4 pt-4 pb-4 gap-4 sm:px-6 sm:pt-6 sm:pb-5 sm:gap-5 overflow-y-auto transition-opacity duration-[240ms] ease-out ${
            phase === "compose" ? "opacity-100" : "opacity-0"
          }`}
          style={{ pointerEvents: phase === "compose" ? "auto" : "none" }}
        >
              {/* 1. Artifacts (Files & Pastes) - Rendered ABOVE text input */}
              {(files.length > 0 || pastedContent.length > 0) && (
                <div className="flex gap-2 sm:gap-3 overflow-x-auto custom-scrollbar pb-1 sm:pb-2 px-0.5 sm:px-1">
                  {pastedContent.map((content) => (
                    <PastedContentCard
                      key={content.id}
                      content={content}
                      onRemove={handleRemovePastedContent}
                      disableEntryAnimation={suppressEntryAnimation}
                    />
                  ))}
                  {files.map((file) => (
                    <FilePreviewCard
                      key={file.id}
                      file={file}
                      onRemove={handleRemoveFile}
                      disableEntryAnimation={suppressEntryAnimation}
                    />
                  ))}
                </div>
              )}

              {/* 2. Input Area */}
              <div className="relative mb-1">
                <div className="max-h-64 sm:max-h-96 w-full overflow-y-auto custom-scrollbar font-sans break-words transition-opacity duration-200 min-h-[2.5rem] sm:min-h-[3rem] pl-0.5 sm:pl-1">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    placeholder="Add context about your startup (optional)"
                    className="w-full bg-transparent border-0 outline-none text-text-100 text-[16px] placeholder:text-text-400 resize-none overflow-hidden py-0.5 sm:py-1 leading-[1.6] block font-normal antialiased"
                    rows={1}
                    style={{ minHeight: "1.5em" }}
                  />
                </div>
              </div>

              {/* 3. Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 w-full">
                {/* Left Tools */}
                <div className="relative flex items-center min-w-0 gap-2 sm:gap-3">
                  {/* Toggle Menu / Attach Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center relative shrink-0 transition-colors duration-200 h-8 w-8 rounded-full active:scale-95 border border-bg-200 bg-bg-100 text-text-300 hover:text-text-200 hover:bg-bg-200"
                    type="button"
                    aria-label="Upload Data Room"
                  >
                    <Icons.Plus className="w-4 h-4" />
                  </button>

                  {/* Extended Thinking Button */}
                  <div className="flex shrink min-w-8 !shrink-0">
                    <button
                      onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                      className={`transition-all duration-200 h-8 w-8 flex items-center justify-center rounded-full active:scale-95 border border-bg-200
                        ${
                          isThinkingEnabled
                            ? "text-accent bg-accent/10"
                            : "text-text-300 hover:text-text-200 hover:bg-bg-200 bg-bg-100"
                        }
                      `}
                      aria-pressed={isThinkingEnabled}
                      aria-label="Deep Dive"
                    >
                      <Icons.Thinking className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Right Tools */}
                <div className="flex flex-row items-center min-w-0 gap-1 ml-auto">
                  {/* Model Selector */}
                  <div className="shrink-0 p-1 -m-1">
                    <ModelSelector
                      models={models}
                      selectedModel={selectedModel}
                      onSelect={setSelectedModel}
                    />
                  </div>

                  {/* Send Button */}
                  <div>
                    <button
                      onClick={handleSend}
                      disabled={!hasContent || isSending}
                      className={`
                        inline-flex items-center justify-center relative shrink-0 transition-colors h-8 w-8 rounded-full active:scale-95
                        ${
                          hasContent && !isSending
                            ? "bg-accent text-bg-0 hover:bg-accent-hover shadow-md"
                            : "bg-accent/25 text-bg-0/70 cursor-default"
                        }
                      `}
                      type="button"
                      aria-label="Generate Deck"
                    >
                      {isSending ? (
                        <Icons.Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icons.ArrowUp className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
        </div>
      </div>

      {/* Drag Overlay for Compose Phase */}
      {isDragging && phase === "compose" && (
        <div className="absolute inset-0 bg-bg-200/90 border-2 border-dashed border-accent rounded-2xl sm:rounded-3xl z-50 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none">
          <Icons.Archive className="w-10 h-10 text-accent mb-2 animate-bounce" />
          <p className="text-accent font-medium">Drop files to upload</p>
        </div>
      )}

      {/* Hidden Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        multiple
        className="sr-only"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
          overflow: "hidden",
        }}
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="text-center mt-3 sm:mt-4">
        <p className="text-xs text-text-500">
          Generated decks are for reference. Always double-check your numbers.
        </p>
      </div>
    </div>
  );
};

export default ClaudeChatInput;
