/**
 * Media file processing and font analysis utilities.
 *
 * This module provides functions for processing PowerPoint files, extracting
 * slide XML content, and analyzing fonts used in presentations. It includes
 * font normalization, Google Fonts availability checking, and PowerPoint file
 * structure extraction.
 *
 * Note: Some functions (PDF/PPTX conversion) are not available in serverless
 * environments like Vercel due to missing system binaries. These will be
 * replaced with external services in the future.
 */

import { promises as fs } from "node:fs";
import JSZip from "jszip";

/**
 * Result structure for font analysis.
 *
 * Contains information about fonts found in a presentation, categorized by
 * whether they are available via Google Fonts or not.
 *
 * @property internally_supported_fonts - Array of fonts that are available
 *   via Google Fonts, including their Google Fonts URLs for loading.
 * @property not_supported_fonts - Array of font names that are not available
 *   via Google Fonts and may need alternative handling.
 */
type FontAnalysisResult = {
  internally_supported_fonts: { name: string; google_fonts_url: string }[];
  not_supported_fonts: string[];
};

/**
 * Error message for serverless environment limitations.
 *
 * Some media processing features require system binaries (pdftoppm, LibreOffice)
 * that are not available in serverless environments like Vercel. These features
 * will be replaced with external services (CloudConvert/ConvertAPI) in the future.
 */
const SERVERLESS_ERROR_MESSAGE =
  "This feature is not available in serverless environment. It requires system binaries that are not available on Vercel.";

/**
 * Converts a PDF file to PNG images (one per page).
 *
 * This function is not implemented in serverless environments. It requires
 * system binaries (pdftoppm) that are not available on Vercel. Will be
 * replaced with an external service in the future.
 *
 * @param _pdfPath - Path to the PDF file to convert (unused, function throws).
 * @param _outputDir - Directory where PNG files should be saved (unused).
 * @returns Never returns (always throws).
 * @throws {Error} Always throws an error indicating serverless limitation.
 */
export const convertPdfToPngs = async (
  _pdfPath: string,
  _outputDir: string,
): Promise<string[]> => {
  throw new Error(`PDF to PNG conversion: ${SERVERLESS_ERROR_MESSAGE}`);
};

/**
 * Converts a PowerPoint file to PDF.
 *
 * This function is not implemented in serverless environments. It requires
 * system binaries (LibreOffice) that are not available on Vercel. Will be
 * replaced with an external service in the future.
 *
 * @param _pptxPath - Path to the PPTX file to convert (unused, function throws).
 * @param _outputDir - Directory where PDF file should be saved (unused).
 * @returns Never returns (always throws).
 * @throws {Error} Always throws an error indicating serverless limitation.
 */
export const convertPptxToPdf = async (
  _pptxPath: string,
  _outputDir: string,
): Promise<string> => {
  throw new Error(`PPTX to PDF conversion: ${SERVERLESS_ERROR_MESSAGE}`);
};

/**
 * Extracts slide XML content from a PowerPoint file.
 *
 * Reads a PPTX file (which is a ZIP archive) and extracts the XML content
 * for each slide. PPTX files store slide content as XML files within the
 * ZIP structure. This function extracts and returns those XML strings in
 * slide order.
 *
 * @param pptxPath - Path to the PPTX file to extract slides from.
 * @returns Promise that resolves to an array of XML strings, one per slide,
 *   in presentation order. Each XML string contains the slide's structure,
 *   content, and formatting information.
 *
 * @example
 * ```typescript
 * const slideXmls = await extractSlideXmls("/path/to/presentation.pptx");
 * // Returns: ["<?xml version='1.0'?>...", "<?xml version='1.0'?>...", ...]
 * ```
 */
export const extractSlideXmls = async (pptxPath: string): Promise<string[]> => {
  const buffer = await fs.readFile(pptxPath);
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter(
      (name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml"),
    )
    .sort((a, b) => {
      const getIndex = (name: string) => {
        const match = name.match(/slide(\d+)\.xml$/);
        return match ? Number(match[1]) : 0;
      };
      return getIndex(a) - getIndex(b);
    });

  const xmls: string[] = [];
  for (const fileName of slideFiles) {
    const file = zip.file(fileName);
    if (!file) continue;
    xmls.push(await file.async("string"));
  }
  return xmls;
};

const STYLE_TOKENS = new Set([
  "italic",
  "italics",
  "oblique",
  "roman",
  "bolditalic",
  "bolditalics",
  "thin",
  "hairline",
  "extralight",
  "ultralight",
  "light",
  "demilight",
  "semilight",
  "book",
  "regular",
  "normal",
  "medium",
  "semibold",
  "demibold",
  "bold",
  "extrabold",
  "ultrabold",
  "black",
  "extrablack",
  "ultrablack",
  "heavy",
  "narrow",
  "condensed",
  "semicondensed",
  "extracondensed",
  "ultracondensed",
  "expanded",
  "semiexpanded",
  "extraexpanded",
  "ultraexpanded",
]);

const STYLE_MODIFIERS = new Set(["semi", "demi", "extra", "ultra"]);

const insertSpacesInCamelCase = (value: string): string => {
  return value
    .replace(/(?<=[a-z0-9])([A-Z])/g, " $1")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
};

/**
 * Normalizes a font family name by removing style tokens and formatting.
 *
 * Cleans font names by:
 * - Replacing underscores and hyphens with spaces
 * - Inserting spaces in camelCase names
 * - Removing style tokens (bold, italic, thin, etc.) from the end
 * - Removing style modifiers (semi, demi, extra, ultra) from the middle
 * - Normalizing whitespace
 *
 * This produces a clean base font name that can be used for font matching
 * and Google Fonts lookups, regardless of how the font name was originally
 * formatted (e.g., "Inter-Bold", "interBold", "Inter Bold" all become "Inter").
 *
 * @param rawName - Raw font name that may contain style tokens, formatting,
 *   or inconsistent casing.
 * @returns Normalized font family name with style tokens removed and
 *   formatting cleaned. Returns the original string if it's empty or falsy.
 *
 * @example
 * ```typescript
 * normalizeFontFamilyName("Inter-Bold"); // Returns: "Inter"
 * normalizeFontFamilyName("RobotoMedium"); // Returns: "Roboto"
 * normalizeFontFamilyName("Open Sans SemiBold"); // Returns: "Open Sans"
 * ```
 */
export const normalizeFontFamilyName = (rawName: string): string => {
  if (!rawName) return rawName;
  let name = rawName.replace(/[_-]/g, " ");
  name = insertSpacesInCamelCase(name);
  name = name.replace(/\s+/g, " ").trim();
  let lower = name.toLowerCase();

  for (const style of Array.from(STYLE_TOKENS).sort(
    (a, b) => b.length - a.length,
  )) {
    if (lower.endsWith(` ${style}`)) {
      name = name.slice(0, -(style.length + 1));
      lower = lower.slice(0, -(style.length + 1));
      break;
    }
  }

  const tokens = name.split(" ");
  const filtered = tokens.filter((token, index) => {
    if (index === 0) return true;
    const lowerToken = token.toLowerCase();
    return !STYLE_TOKENS.has(lowerToken) && !STYLE_MODIFIERS.has(lowerToken);
  });

  return filtered.join(" ").trim();
};

/**
 * Extracts font names from PowerPoint OXML content.
 *
 * Parses XML content (from a PPTX slide) and extracts all font family names
 * referenced in typeface attributes. Filters out system font placeholders
 * that don't represent actual fonts.
 *
 * @param xmlContent - XML string content from a PowerPoint slide file.
 *   Contains slide structure with font references in typeface attributes.
 * @returns Array of unique font family names found in the XML. System font
 *   placeholders (like "+mn-lt", "+mj-lt") are filtered out.
 *
 * @example
 * ```typescript
 * const fonts = extractFontsFromOxml(slideXml);
 * // Returns: ["Arial", "Times New Roman", "Calibri"]
 * ```
 */
export const extractFontsFromOxml = (xmlContent: string): string[] => {
  const regex = /typeface="([^"]+)"/g;
  const fonts = new Set<string>();
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(xmlContent))) {
    const font = match[1];
    if (font) fonts.add(font);
  }
  const systemFonts = new Set([
    "+mn-lt",
    "+mj-lt",
    "+mn-ea",
    "+mj-ea",
    "+mn-cs",
    "+mj-cs",
    "",
  ]);
  return Array.from(fonts).filter((font) => !systemFonts.has(font));
};

const checkGoogleFontAvailability = async (
  fontName: string,
): Promise<boolean> => {
  const formatted = fontName.replace(/ /g, "+");
  const url = `https://fonts.googleapis.com/css2?family=${formatted}&display=swap`;
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.status === 200;
  } catch (error) {
    console.warn("Font availability check failed:", error);
    return false;
  }
};

/**
 * Analyzes fonts used across multiple slides and checks Google Fonts availability.
 *
 * Extracts all unique fonts from slide XML content, normalizes their names,
 * and checks which ones are available via Google Fonts. Returns categorized
 * results indicating which fonts can be loaded from Google Fonts and which
 * cannot.
 *
 * This is useful for determining which fonts need to be loaded for proper
 * slide rendering, and which fonts may need fallback handling.
 *
 * @param slideXmls - Array of XML strings, one per slide, containing slide
 *   content and font references.
 * @returns Promise that resolves to a FontAnalysisResult object containing:
 *   - internally_supported_fonts: Fonts available via Google Fonts with their URLs
 *   - not_supported_fonts: Font names not available via Google Fonts
 *
 * @example
 * ```typescript
 * const slideXmls = await extractSlideXmls(pptxPath);
 * const analysis = await analyzeFontsInSlides(slideXmls);
 * // Returns: {
 * //   internally_supported_fonts: [
 * //     { name: "Inter", google_fonts_url: "https://fonts.googleapis.com/..." }
 * //   ],
 * //   not_supported_fonts: ["CustomFont"]
 * // }
 * ```
 */
export const analyzeFontsInSlides = async (
  slideXmls: string[],
): Promise<FontAnalysisResult> => {
  const rawFonts = new Set<string>();
  slideXmls.forEach((xml) => {
    extractFontsFromOxml(xml).forEach((font) => rawFonts.add(font));
  });
  const normalized = Array.from(rawFonts)
    .map(normalizeFontFamilyName)
    .filter(Boolean);
  if (!normalized.length) {
    return { internally_supported_fonts: [], not_supported_fonts: [] };
  }

  const results: { name: string; available: boolean }[] = [];
  for (const font of normalized) {
    const available = await checkGoogleFontAvailability(font);
    results.push({ name: font, available });
  }

  const internally_supported_fonts: {
    name: string;
    google_fonts_url: string;
  }[] = [];
  const not_supported_fonts: string[] = [];

  results.forEach((result) => {
    if (result.available) {
      const formatted = result.name.replace(/ /g, "+");
      internally_supported_fonts.push({
        name: result.name,
        google_fonts_url: `https://fonts.googleapis.com/css2?family=${formatted}&display=swap`,
      });
    } else {
      not_supported_fonts.push(result.name);
    }
  });

  return { internally_supported_fonts, not_supported_fonts };
};
