import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { getChromiumExecutablePath } from "@/server/chromium";
import { sanitizeFilename } from "@/app/(presentation-generator)/utils/others";

/**
 * Runtime configuration for this API route.
 * - nodejs: Runs on Node.js runtime (required for Puppeteer)
 * - maxDuration: Maximum execution time of 300 seconds (5 minutes)
 * - force-dynamic: Always generates dynamic responses (no caching)
 */
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Handles POST requests to export a presentation as a PDF file.
 *
 * Uses Puppeteer (headless Chrome) to render the presentation in a browser
 * and generate a PDF. The process:
 * 1. Launches a headless browser instance
 * 2. Navigates to the presentation's PDF maker page
 * 3. Waits for all content to load and render
 * 4. Generates PDF from the rendered page
 * 5. Saves PDF to storage or returns as base64 (Vercel)
 *
 * Request body:
 * - `id` (required): Unique identifier of the presentation to export
 * - `title` (optional): Filename for the PDF (default: "presentation")
 *
 * Environment handling:
 * - Vercel: Returns base64-encoded PDF (filesystem is ephemeral)
 * - Local: Saves PDF to app data directory and returns file path
 *
 * Browser configuration:
 * - Uses Chromium executable (configured for serverless environments)
 * - Disables sandboxing for serverless compatibility
 * - Sets viewport to 1280x720 (standard presentation size)
 * - Waits for 99% of visible elements to load before generating PDF
 *
 * @param req - The HTTP request object containing presentation ID and title.
 * @returns A JSON response with:
 *   - Vercel: `{ success: true, base64: "...", filename: "..." }`
 *   - Local: `{ success: true, path: "/app_data/exports/..." }`
 *
 * @throws Returns error responses for:
 *   - 400: Missing presentation ID
 *   - 500: Browser launch failed, PDF generation failed, or storage error
 *
 * @example
 * ```typescript
 * // Request: POST /api/v1/exports/pdf
 * // Body: { id: "abc-123", title: "My Presentation" }
 * // Response: { success: true, path: "/app_data/exports/My_Presentation.pdf" }
 * ```
 */
export async function POST(req: NextRequest) {
  const { id, title } = await req.json();
  if (!id) {
    return NextResponse.json(
      { error: "Missing Presentation ID" },
      { status: 400 },
    );
  }

  // Get Chromium executable path (handles serverless vs local environments)
  const executablePath = await getChromiumExecutablePath();

  // Launch headless browser with serverless-optimized configuration
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      ...chromium.args, // Serverless-optimized Chromium arguments
      "--no-sandbox", // Required for serverless environments
      "--disable-setuid-sandbox", // Required for serverless environments
      "--disable-dev-shm-usage", // Prevents /dev/shm issues in containers
      "--disable-gpu", // Not needed for headless rendering
      "--disable-web-security", // Allows cross-origin resources
      "--disable-background-timer-throttling", // Ensures consistent rendering
      "--disable-backgrounding-occluded-windows", // Prevents background throttling
      "--disable-renderer-backgrounding", // Keeps renderer active
      "--disable-features=TranslateUI", // Disables translation UI
      "--disable-ipc-flooding-protection", // Prevents IPC limit issues
    ],
  });
  const page = await browser.newPage();
  // Set viewport to standard presentation size (16:9 aspect ratio)
  await page.setViewport({ width: 1280, height: 720 });
  // Set long timeouts to handle slow-loading content
  page.setDefaultNavigationTimeout(300000);
  page.setDefaultTimeout(300000);

  // In Vercel environment, need to use actual URL instead of localhost
  // Vercel provides VERCEL_URL environment variable with the deployment URL
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  // Navigate to the PDF maker page for this presentation
  // The page renders the presentation and is then converted to PDF
  await page.goto(`${baseUrl}/pdf-maker?id=${id}`, {
    waitUntil: "networkidle0", // Wait until no network requests for 500ms
    timeout: 300000,
  });

  // Wait for page to be fully loaded
  await page.waitForFunction('() => document.readyState === "complete"');

  try {
    // Wait for 99% of visible elements to be loaded and rendered
    // This ensures images, fonts, and other resources are loaded before PDF generation
    await page.waitForFunction(
      `
      () => {
        const allElements = document.querySelectorAll('*');
        let loadedElements = 0;
        let totalElements = allElements.length;
        
        for (let el of allElements) {
            const style = window.getComputedStyle(el);
            const isVisible = style.display !== 'none' && 
                            style.visibility !== 'hidden' && 
                            style.opacity !== '0';
            
            if (isVisible && el.offsetWidth > 0 && el.offsetHeight > 0) {
                loadedElements++;
            }
        }
        
        return (loadedElements / totalElements) >= 0.99;
      }
      `,
      { timeout: 300000 },
    );

    // Additional wait to ensure any animations or transitions complete
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    // If content loading check fails, log warning but continue
    // Some content may not be fully loaded, but PDF will still be generated
    console.log("Warning: Some content may not have loaded completely:", error);
  }

  // Generate PDF from the rendered page
  // Size matches viewport (1280x720) for consistent output
  const pdfBuffer = await page.pdf({
    width: "1280px",
    height: "720px",
    printBackground: true, // Include background colors and images
    margin: { top: 0, right: 0, bottom: 0, left: 0 }, // No margins for full-bleed
  });

  await browser.close();

  // Sanitize title to create safe filename
  const sanitizedTitle = sanitizeFilename(title ?? "presentation");

  // In Vercel environment, only /tmp directory is available
  // Files in /tmp are ephemeral and deleted after the function completes
  const tmpDir = process.env.VERCEL
    ? "/tmp"
    : process.env.APP_DATA_DIRECTORY || "/tmp";
  const destinationPath = path.join(tmpDir, "exports", `${sanitizedTitle}.pdf`);
  await fs.promises.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.promises.writeFile(destinationPath, pdfBuffer);

  // In Vercel, /tmp files are deleted after response, so also consider returning base64 for direct download
  if (process.env.VERCEL) {
    // In Vercel environment, return base64 encoded PDF instead of file path
    // This allows the client to download the PDF directly without relying on file storage
    const base64Pdf = Buffer.from(pdfBuffer).toString("base64");
    return NextResponse.json({
      success: true,
      base64: base64Pdf,
      filename: `${sanitizedTitle}.pdf`,
    });
  }

  // Maintain existing approach for local environment
  // Return file path that can be accessed via HTTP
  const appDataDirectory = process.env.APP_DATA_DIRECTORY;
  if (!appDataDirectory) {
    return NextResponse.json(
      { error: "App data directory not found" },
      { status: 500 },
    );
  }

  // Convert absolute path to relative URL path
  const relativePath = path
    .relative(appDataDirectory, destinationPath)
    .split(path.sep)
    .join("/");
  const publicPath = `/app_data/${relativePath}`;

  return NextResponse.json({
    success: true,
    path: publicPath,
  });
}
