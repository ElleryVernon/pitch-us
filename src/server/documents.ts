/**
 * Document processing and text extraction utilities.
 *
 * This module provides functions for extracting text content from various
 * document formats (PDF, DOCX, etc.) and decomposing documents into smaller
 * text files. It supports both local file system and Supabase storage for
 * document access and output. Text extraction is performed concurrently
 * for better performance.
 */

import path from "node:path";

import { promises as fs } from "node:fs";
import mammoth from "mammoth";
import { extractText } from "unpdf";
import {
  downloadSupabaseFile,
  isSupabaseEnabled,
  parseSupabaseStoragePath,
  uploadSupabaseTextFile,
} from "@/server/supabase-storage";

/**
 * Resolves the file name from a file path.
 *
 * Extracts the base filename from a file path, handling both local paths
 * and Supabase storage paths. For Supabase paths, extracts the filename
 * from the storage path structure.
 *
 * @param filePath - File path (local or Supabase storage path) to extract
 *   the filename from.
 * @returns The base filename (e.g., "document.pdf") without directory path.
 */
const resolveFileName = (filePath: string): string => {
  const storageLocation = parseSupabaseStoragePath(filePath);
  if (storageLocation) {
    return path.basename(storageLocation.path);
  }
  return path.basename(filePath);
};

const readFileBuffer = async (filePath: string): Promise<Buffer> => {
  if (parseSupabaseStoragePath(filePath)) {
    return downloadSupabaseFile(filePath);
  }
  return fs.readFile(filePath);
};

const saveDecomposedText = async (
  fileName: string,
  outputDir: string,
  text: string,
): Promise<string> => {
  const normalized = text.replace(/<br\s*\/?>/gi, "\n");
  if (isSupabaseEnabled()) {
    const outputId = path.basename(outputDir);
    const storagePath = path.posix.join(
      "decomposed",
      outputId,
      `${fileName}.txt`,
    );
    return uploadSupabaseTextFile({ path: storagePath, text: normalized });
  }
  const outputPath = path.join(outputDir, `${fileName}.txt`);
  await fs.writeFile(outputPath, normalized, "utf-8");
  return outputPath;
};

/**
 * Information about a decomposed document file.
 *
 * Represents metadata for a document that has been processed and decomposed
 * into a text file. Used to track which documents have been processed and
 * where their extracted text is stored.
 *
 * @property name - Original filename of the document (e.g., "presentation.pdf").
 * @property file_path - Path to the extracted text file. Can be a local
 *   file path or Supabase storage path.
 */
export type DecomposedFileInfo = {
  name: string;
  file_path: string;
};

/**
 * Maximum number of documents to process concurrently.
 *
 * Limits the number of simultaneous document processing operations to avoid
 * overwhelming the system with too many concurrent file operations or API calls.
 */
const DECOMPOSE_CONCURRENCY = 2;

/**
 * Maps items to results with concurrency control.
 *
 * Processes an array of items concurrently, but limits the number of
 * simultaneous operations. This is useful for I/O-bound operations like
 * file processing where you want parallelism but need to control resource usage.
 *
 * The function creates a pool of worker functions that process items from
 * a shared queue. Results are placed in the correct positions to maintain
 * input order.
 *
 * @param items - Array of items to process.
 * @param limit - Maximum number of concurrent operations. Must be at least 1.
 * @param task - Async function that processes a single item and returns a result.
 *   Receives the item and its index as parameters.
 * @returns Promise that resolves to an array of results in the same order
 *   as the input items.
 *
 * @example
 * ```typescript
 * const results = await mapWithConcurrency(
 *   filePaths,
 *   2,
 *   async (filePath, index) => await processFile(filePath)
 * );
 * ```
 */
const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(limit, items.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await task(items[currentIndex], currentIndex);
    }
  });
  await Promise.all(workers);
  return results;
};

export const decomposeDocuments = async (
  filePaths: string[],
  outputDir: string,
): Promise<DecomposedFileInfo[]> => {
  return mapWithConcurrency(
    filePaths,
    DECOMPOSE_CONCURRENCY,
    async (filePath) => {
      const fileName = resolveFileName(filePath);
      const ext = path.extname(fileName).toLowerCase();
      if (ext === ".txt") {
        return { name: fileName, file_path: filePath };
      }

      let text = "";
      if (ext === ".pdf") {
        const buffer = await readFileBuffer(filePath);
        try {
          // unpdf is optimized for serverless environments (no worker required)
          const { text: extractedText } = await extractText(
            new Uint8Array(buffer),
            { mergePages: true },
          );
          text = extractedText || "";
        } catch (error) {
          console.warn("PDF parsing failed:", error);
          text = "";
        }
      } else if (ext === ".docx") {
        const buffer = await readFileBuffer(filePath);
        const parsed = await mammoth.extractRawText({ buffer });
        text = parsed.value || "";
      } else {
        try {
          if (parseSupabaseStoragePath(filePath)) {
            const buffer = await readFileBuffer(filePath);
            text = buffer.toString("utf-8");
          } else {
            text = await fs.readFile(filePath, "utf-8");
          }
        } catch {
          text = "";
        }
      }

      const outputPath = await saveDecomposedText(fileName, outputDir, text);
      return { name: fileName, file_path: outputPath };
    },
  );
};
