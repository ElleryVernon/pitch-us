/**
 * Chromium/Puppeteer executable path resolution.
 *
 * This module provides functions for locating the Chromium executable needed
 * by Puppeteer for PDF generation and browser automation. It handles different
 * environments (local development, Vercel serverless) and supports various
 * installation locations across operating systems.
 */

import fs from "node:fs";
import path from "node:path";
import chromium from "@sparticuz/chromium";

/**
 * Checks if a file exists at the given path.
 *
 * Safely checks for file existence, returning false if the check fails
 * (e.g., due to permissions) rather than throwing an error.
 *
 * @param filePath - Absolute or relative path to check.
 * @returns True if the file exists, false otherwise (including if check fails).
 */
const fileExists = (filePath: string): boolean => {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
};

const pickFirstExistingPath = (paths: string[]): string | null => {
  for (const candidate of paths) {
    if (candidate && fileExists(candidate)) {
      return candidate;
    }
  }
  return null;
};

const getLocalChromeCandidates = (): string[] => {
  const platform = process.platform;
  if (platform === "darwin") {
    return [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ];
  }
  if (platform === "win32") {
    const programFiles = process.env["PROGRAMFILES"] || "C:\\Program Files";
    const programFilesX86 =
      process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
    const localAppData = process.env["LOCALAPPDATA"] || "";
    return [
      path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(
        programFilesX86,
        "Google",
        "Chrome",
        "Application",
        "chrome.exe",
      ),
      path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(programFiles, "Chromium", "Application", "chrome.exe"),
      path.join(programFilesX86, "Chromium", "Application", "chrome.exe"),
    ];
  }
  return [
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
  ];
};

const getEnvChromeCandidates = (): string[] => {
  return [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_BIN,
    process.env.CHROMIUM_PATH,
    process.env.GOOGLE_CHROME_BIN,
  ].filter((value): value is string => Boolean(value));
};

/**
 * Gets the path to the Chromium executable for Puppeteer.
 *
 * Resolves the Chromium executable path based on the environment and
 * configuration. The function checks multiple sources in order:
 * 1. Explicit PUPPETEER_EXECUTABLE_PATH environment variable
 * 2. Local Chrome/Chromium installations (if not on Vercel)
 * 3. Environment variable candidates (CHROME_BIN, CHROMIUM_PATH, etc.)
 * 4. @sparticuz/chromium package (for serverless environments like Vercel)
 *
 * On Vercel or other serverless environments, uses the @sparticuz/chromium
 * package which provides a pre-built Chromium binary. In local development,
 * attempts to find a local Chrome/Chromium installation.
 *
 * @returns Promise that resolves to the absolute path of the Chromium
 *   executable. In serverless environments, this may be a path to a
 *   downloaded or bundled Chromium binary.
 *
 * @remarks
 * The function prioritizes explicit configuration, then local installations,
 * and finally falls back to the serverless Chromium package. This ensures
 * compatibility across different deployment environments.
 */
export const getChromiumExecutablePath = async (): Promise<string> => {
  const explicitPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (explicitPath) {
    return explicitPath;
  }

  const isVercel = Boolean(process.env.VERCEL);
  if (!isVercel) {
    const localCandidate = pickFirstExistingPath([
      ...getEnvChromeCandidates(),
      ...getLocalChromeCandidates(),
    ]);
    if (localCandidate) {
      return localCandidate;
    }
  }

  const downloadUrl = process.env.CHROMIUM_DOWNLOAD_URL;
  return downloadUrl
    ? chromium.executablePath(downloadUrl)
    : chromium.executablePath();
};
