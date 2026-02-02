/**
 * Document text extraction utilities for client-side file processing.
 *
 * Provides functions for extracting text content from various document formats
 * (PDF, DOCX, TXT) in the browser. Uses unpdf for PDF extraction and mammoth
 * for DOCX extraction. Supports progress tracking and error handling.
 */

"use client";

import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

/**
 * Structure for extracted document data.
 *
 * Contains the extracted text content along with file metadata for tracking
 * and display purposes.
 *
 * @property fileName - Original filename.
 * @property fileSize - File size in bytes.
 * @property fileType - MIME type or file extension.
 * @property content - Extracted text content.
 * @property extractedAt - Timestamp when extraction completed (milliseconds).
 */
export interface ExtractedDocument {
  fileName: string;
  fileSize: number;
  fileType: string;
  content: string;
  extractedAt: number;
}

/**
 * Structure for tracking extraction progress.
 *
 * Used to report the status and progress of document extraction operations
 * for UI feedback.
 *
 * @property fileName - Name of the file being extracted.
 * @property status - Current extraction status.
 * @property progress - Progress percentage (0-100).
 * @property error - Error message if extraction failed.
 */
export interface ExtractionProgress {
  fileName: string;
  status: "pending" | "extracting" | "completed" | "error";
  progress: number; // 0-100
  error?: string;
}

/**
 * Extracts text content from a PDF file.
 *
 * Uses unpdf (PDF.js wrapper) to extract all text from a PDF document,
 * merging text from all pages into a single string.
 *
 * @param file - PDF File object to extract text from.
 * @returns Extracted text content as a string.
 * @throws Error if PDF parsing fails.
 */
async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

/**
 * Extracts text content from a DOCX file.
 *
 * Uses mammoth library to extract raw text from a Word document (.docx or .doc).
 * Preserves basic text content but does not include formatting.
 *
 * @param file - DOCX/DOC File object to extract text from.
 * @returns Extracted text content as a string.
 * @throws Error if DOCX parsing fails.
 */
async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || "";
}

/**
 * Extracts text content from a plain text file.
 *
 * Reads a text file using the FileReader API and returns its content as a string.
 *
 * @param file - Text File object to read.
 * @returns File content as a string.
 * @throws Error if file reading fails.
 */
async function extractTextFromTxt(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read text file"));
    reader.readAsText(file);
  });
}

/**
 * Gets the file extension from a filename.
 *
 * Extracts the extension (part after the last dot) and converts it to lowercase.
 *
 * @param fileName - Filename to extract extension from.
 * @returns File extension in lowercase, or empty string if no extension.
 */
function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

/**
 * Extracts text content from a file based on its type.
 *
 * Automatically detects the file type by extension and uses the appropriate
 * extraction method (PDF, DOCX, or plain text). Supports progress callbacks
 * for UI feedback during extraction.
 *
 * @param file - File object to extract text from.
 * @param onProgress - Optional callback function called with progress
 *   percentage (0-100) during extraction.
 * @returns ExtractedDocument object with content and metadata.
 * @throws Error if file type is unsupported or extraction fails.
 *
 * @example
 * ```typescript
 * const doc = await extractTextFromFile(file, (progress) => {
 *   console.log(`Extracting: ${progress}%`);
 * });
 * console.log(doc.content); // Extracted text
 * ```
 */
export async function extractTextFromFile(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<ExtractedDocument> {
  const extension = getFileExtension(file.name);

  onProgress?.(10);

  let content = "";

  try {
    switch (extension) {
      case "pdf":
        onProgress?.(30);
        content = await extractTextFromPdf(file);
        break;

      case "docx":
      case "doc":
        onProgress?.(30);
        content = await extractTextFromDocx(file);
        break;

      case "txt":
        onProgress?.(30);
        content = await extractTextFromTxt(file);
        break;

      case "pptx":
      case "ppt":
        // For PPTX, we'll extract what we can using mammoth
        // PPTX is essentially a zip with XML, similar structure to DOCX
        onProgress?.(30);
        try {
          content = await extractTextFromDocx(file);
        } catch {
          // If mammoth fails, try reading as text
          content = await extractTextFromTxt(file);
        }
        break;

      default:
        // Try to read as plain text
        content = await extractTextFromTxt(file);
    }

    onProgress?.(90);

    // Normalize whitespace and clean up
    content = content
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    onProgress?.(100);

    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || `application/${extension}`,
      content,
      extractedAt: Date.now(),
    };
  } catch (error) {
    console.error(`Failed to extract text from ${file.name}:`, error);
    throw new Error(
      `Failed to extract text from ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Extracts text from multiple files with progress tracking.
 *
 * Processes an array of files sequentially, extracting text from each and
 * reporting progress for each file individually. Useful for batch processing
 * multiple documents with UI feedback.
 *
 * @param files - Array of File objects to extract text from.
 * @param onProgress - Optional callback function called for each file with
 *   file index and extraction progress status.
 * @returns Array of ExtractedDocument objects, one per file.
 * @throws Error if any file extraction fails (stops processing on first error).
 *
 * @example
 * ```typescript
 * const docs = await extractTextFromFiles(files, (index, progress) => {
 *   console.log(`File ${index}: ${progress.status} - ${progress.progress}%`);
 * });
 * ```
 */
export async function extractTextFromFiles(
  files: File[],
  onProgress?: (fileIndex: number, progress: ExtractionProgress) => void,
): Promise<ExtractedDocument[]> {
  const results: ExtractedDocument[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    onProgress?.(i, {
      fileName: file.name,
      status: "extracting",
      progress: 0,
    });

    try {
      const extracted = await extractTextFromFile(file, (progress) => {
        onProgress?.(i, {
          fileName: file.name,
          status: "extracting",
          progress,
        });
      });

      results.push(extracted);

      onProgress?.(i, {
        fileName: file.name,
        status: "completed",
        progress: 100,
      });
    } catch (error) {
      onProgress?.(i, {
        fileName: file.name,
        status: "error",
        progress: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Continue with other files even if one fails
      results.push({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        content: "",
        extractedAt: Date.now(),
      });
    }
  }

  return results;
}

/**
 * Combines extracted documents into a single content string.
 *
 * Filters out empty documents and joins the remaining content with
 * separator lines ("---") between documents. Useful for combining
 * multiple document extracts into a single prompt or content block.
 *
 * @param documents - Array of extracted document objects.
 * @returns Combined content string with separators between documents.
 *
 * @example
 * ```typescript
 * const combined = combineExtractedContent([
 *   { content: "Document 1", ... },
 *   { content: "Document 2", ... }
 * ]);
 * // Returns: "Document 1\n\n---\n\nDocument 2"
 * ```
 */
export function combineExtractedContent(
  documents: ExtractedDocument[],
): string {
  return documents
    .filter((doc) => doc.content.length > 0)
    .map((doc) => doc.content)
    .join("\n\n---\n\n");
}

/**
 * Extracts file metadata from extracted documents.
 *
 * Converts ExtractedDocument objects into a simplified metadata format
 * containing only name, size, and type. Useful for displaying file
 * information without the full document content.
 *
 * @param documents - Array of extracted document objects.
 * @returns Array of file metadata objects with name, size, and type.
 *
 * @example
 * ```typescript
 * const metadata = getFileMetadata(documents);
 * // Returns: [{ name: "doc.pdf", size: 1024, type: "application/pdf" }, ...]
 * ```
 */
export function getFileMetadata(
  documents: ExtractedDocument[],
): Array<{ name: string; size: number; type: string }> {
  return documents.map((doc) => ({
    name: doc.fileName,
    size: doc.fileSize,
    type: doc.fileType,
  }));
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
