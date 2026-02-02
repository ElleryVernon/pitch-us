/**
 * PowerPoint (PPTX) export functionality.
 *
 * This module provides functions for converting presentation models into actual
 * PowerPoint files (.pptx) using the pptxgenjs library. It handles conversion
 * of all slide elements including text boxes, shapes, images, charts, and tables,
 * with proper font mapping, color conversion, and layout preservation.
 *
 * The export process converts web-based presentation models (with pixel-based
 * measurements and web fonts) into PowerPoint-compatible formats (with point-based
 * measurements and system fonts). Images are fetched and embedded, and charts/tables
 * are created using PowerPoint's native elements for best compatibility.
 */

import pptxgen from "pptxgenjs";
import path from "node:path";
import {
  PptxPresentationModel,
  PptxTextBoxModel,
  PptxAutoShapeBoxModel,
  PptxPictureBoxModel,
  PptxConnectorModel,
  PptxChartModel,
  PptxTableModel,
  PptxChartType,
} from "@/types/pptx-models";
import { getExportsDirectory } from "../storage";
import {
  getSupabasePublicUrl,
  isSupabaseEnabled,
  uploadSupabaseFileAndGetPublicUrl,
} from "../supabase-storage";

/**
 * Pixels per inch conversion constant.
 *
 * Used to convert pixel measurements (from web) to inches (for PowerPoint).
 * Standard web resolution assumes 96 pixels per inch.
 */
const PX_PER_INCH = 96;

/**
 * Width compensation factor for text boxes
 * Web fonts (Inter, etc.) often have slightly narrower character widths than
 * system fonts (Arial). This factor adds a small buffer to prevent unwanted
 * line breaks when exporting to PPTX.
 */
const TEXT_WIDTH_COMPENSATION = 1.02; // 2% extra width for text boxes

/**
 * Converts pixels to inches for PowerPoint positioning.
 *
 * PowerPoint uses inches as the unit for element positioning and sizing.
 * This function converts pixel values from web-based layouts to inches.
 *
 * @param value - Pixel value to convert.
 * @returns Equivalent value in inches.
 */
const toInches = (value: number): number => {
  return value / PX_PER_INCH;
};

/**
 * Converts pixels to inches with text width compensation.
 *
 * Similar to toInches, but applies a compensation factor to account for
 * font metric differences between web fonts and system fonts. Web fonts
 * (like Inter) often render narrower than system fonts (like Arial), so
 * this adds a small buffer to prevent unwanted line breaks in PowerPoint.
 *
 * @param value - Pixel value to convert.
 * @returns Equivalent value in inches with 2% width compensation applied.
 */
const toInchesWithCompensation = (value: number): number => {
  return (value * TEXT_WIDTH_COMPENSATION) / PX_PER_INCH;
};

/**
 * Map web fonts to PowerPoint-compatible system fonts
 * This ensures consistent rendering across different systems
 */
const mapFontToSystem = (fontName?: string): string => {
  if (!fontName) return "Arial";

  // Normalize font name (remove quotes, lowercase)
  const normalized = fontName.replace(/['"]/g, "").toLowerCase().trim();

  // Font mapping table: web font -> system font
  const fontMap: Record<string, string> = {
    // Sans-serif fonts
    inter: "Arial",
    "inter var": "Arial",
    roboto: "Arial",
    "open sans": "Arial",
    lato: "Arial",
    montserrat: "Arial",
    poppins: "Arial",
    "nunito sans": "Arial",
    nunito: "Arial",
    "source sans pro": "Arial",
    "dm sans": "Arial",
    "plus jakarta sans": "Arial",
    manrope: "Arial",
    outfit: "Arial",
    "work sans": "Arial",
    // Serif fonts
    "playfair display": "Georgia",
    merriweather: "Georgia",
    lora: "Georgia",
    "libre baskerville": "Georgia",
    // Monospace fonts
    "fira code": "Courier New",
    "jetbrains mono": "Courier New",
    "source code pro": "Courier New",
    inconsolata: "Courier New",
    // System fonts
    "-apple-system": "Arial",
    blinkmacsystemfont: "Arial",
    "segoe ui": "Segoe UI",
    helvetica: "Arial",
    "helvetica neue": "Arial",
    arial: "Arial",
    "sans-serif": "Arial",
    serif: "Times New Roman",
    monospace: "Courier New",
  };

  // Check if font is in mapping
  for (const [webFont, systemFont] of Object.entries(fontMap)) {
    if (normalized.includes(webFont)) {
      return systemFont;
    }
  }

  // Return original if it's a known system font, otherwise default to Arial
  const systemFonts = [
    "arial",
    "times new roman",
    "georgia",
    "verdana",
    "tahoma",
    "trebuchet ms",
    "courier new",
    "comic sans ms",
    "impact",
    "segoe ui",
    "calibri",
    "cambria",
  ];

  if (systemFonts.some((sf) => normalized.includes(sf))) {
    return fontName;
  }

  return "Arial";
};

const normalizeColor = (value?: string): string | undefined => {
  if (!value) return undefined;
  return value.replace("#", "");
};

const normalizeAlignment = (
  alignment?: number | string,
): pptxgen.HAlign | undefined => {
  if (alignment === undefined || alignment === null) return undefined;
  if (typeof alignment === "string") {
    const lower = alignment.toLowerCase();
    if (["left", "center", "right", "justify"].includes(lower)) {
      return lower as pptxgen.HAlign;
    }
    return undefined;
  }
  // PptxAlignment enum values: LEFT=1, CENTER=2, RIGHT=3, JUSTIFY=4
  switch (alignment) {
    case 1:
      return "left";
    case 2:
      return "center";
    case 3:
      return "right";
    case 4:
    case 5:
    case 6:
    case 7:
      return "justify";
    default:
      return undefined;
  }
};

const isDataUri = (value: string): boolean => value.startsWith("data:");

const resolveRemoteImagePath = (value: string): string => {
  if (value.startsWith("supabase://")) {
    return getSupabasePublicUrl(value);
  }
  return value;
};

const buildImageSource = async (
  value: string,
): Promise<{ data?: string; path?: string }> => {
  if (isDataUri(value)) {
    return { data: value };
  }
  const resolved = resolveRemoteImagePath(value);
  if (!resolved.startsWith("http")) {
    return { path: resolved };
  }
  const response = await fetch(resolved);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get("content-type") || "image/png";
  return {
    data: `data:${contentType};base64,${buffer.toString("base64")}`,
  };
};

const buildParagraphText = (paragraphs?: PptxTextBoxModel["paragraphs"]) =>
  paragraphs
    ?.map((p) => p.text || "")
    .filter(Boolean)
    .join("\n") || "";

const toPoint = (value?: number): number | undefined => {
  if (!value || value <= 0) return undefined;
  return (value * 72) / 96;
};

// Type for all shape types
type AnyPptxShape =
  | PptxTextBoxModel
  | PptxAutoShapeBoxModel
  | PptxConnectorModel
  | PptxPictureBoxModel
  | PptxChartModel
  | PptxTableModel;

// Type guard functions
const isTextBox = (shape: AnyPptxShape): shape is PptxTextBoxModel => {
  return shape.shape_type === "textbox";
};

const isAutoShape = (shape: AnyPptxShape): shape is PptxAutoShapeBoxModel => {
  return shape.shape_type === "autoshape";
};

const isPicture = (shape: AnyPptxShape): shape is PptxPictureBoxModel => {
  return shape.shape_type === "picture";
};

const isConnector = (
  shape:
    | PptxTextBoxModel
    | PptxAutoShapeBoxModel
    | PptxConnectorModel
    | PptxPictureBoxModel
    | PptxChartModel
    | PptxTableModel,
): shape is PptxConnectorModel => {
  return shape.shape_type === "connector";
};

const isChart = (
  shape:
    | PptxTextBoxModel
    | PptxAutoShapeBoxModel
    | PptxConnectorModel
    | PptxPictureBoxModel
    | PptxChartModel
    | PptxTableModel,
): shape is PptxChartModel => {
  return shape.shape_type === "chart";
};

const isTable = (
  shape:
    | PptxTextBoxModel
    | PptxAutoShapeBoxModel
    | PptxConnectorModel
    | PptxPictureBoxModel
    | PptxChartModel
    | PptxTableModel,
): shape is PptxTableModel => {
  return shape.shape_type === "table";
};

// Map our chart types to pptxgenjs chart types
const mapChartType = (
  chartType: PptxChartType,
  pptx: pptxgen,
): pptxgen.CHART_NAME => {
  switch (chartType) {
    case PptxChartType.AREA:
      return pptx.ChartType.area;
    case PptxChartType.AREA_STACKED:
      return pptx.ChartType.area;
    case PptxChartType.BAR:
      return pptx.ChartType.bar;
    case PptxChartType.BAR_STACKED:
      return pptx.ChartType.bar;
    case PptxChartType.LINE:
      return pptx.ChartType.line;
    case PptxChartType.LINE_STACKED:
      return pptx.ChartType.line;
    case PptxChartType.PIE:
      return pptx.ChartType.pie;
    case PptxChartType.DOUGHNUT:
      return pptx.ChartType.doughnut;
    case PptxChartType.SCATTER:
      return pptx.ChartType.scatter;
    case PptxChartType.BUBBLE:
      return pptx.ChartType.bubble;
    case PptxChartType.RADAR:
      return pptx.ChartType.radar;
    default:
      return pptx.ChartType.bar;
  }
};

/**
 * Exports a presentation model to a PowerPoint (.pptx) file.
 *
 * Converts a PptxPresentationModel (internal presentation format) into an actual
 * PowerPoint file. The function processes all slides and their elements (text
 * boxes, shapes, images, charts, tables) and creates a PPTX file using pptxgenjs.
 *
 * The export process:
 * 1. Creates a new PowerPoint presentation with wide layout
 * 2. Processes each slide, converting backgrounds, shapes, and content
 * 3. Maps web fonts to system fonts for compatibility
 * 4. Fetches and embeds images (from URLs, data URIs, or Supabase storage)
 * 5. Creates native PowerPoint charts and tables
 * 6. Saves the file to disk or Supabase Storage
 * 7. Returns a file path or public URL
 *
 * Font mapping ensures web fonts are converted to PowerPoint-compatible system
 * fonts. Image sources are resolved (Supabase paths converted to URLs, remote
 * images downloaded and embedded as data URIs).
 *
 * @param model - PptxPresentationModel containing all slides and their elements.
 *   Must have a valid slides array.
 * @returns Promise that resolves to:
 *   - A public URL string if Supabase is enabled (file uploaded to Supabase Storage)
 *   - A local file path string if Supabase is disabled (file saved to local exports directory)
 * @throws {Error} Throws an error if the model is invalid (missing slides array)
 *   or if file creation/upload fails.
 *
 * @example
 * ```typescript
 * const pptxModel: PptxPresentationModel = {
 *   name: "My Presentation",
 *   slides: [/* slide models *\/]
 * };
 * const fileUrl = await exportPptxModel(pptxModel);
 * // Returns: "https://...supabase.co/.../presentation-1234567890.pptx"
 * //   or: "/app_data/exports/presentation-1234567890.pptx"
 * ```
 */
export const exportPptxModel = async (
  model: PptxPresentationModel,
): Promise<string> => {
  if (!model || !Array.isArray(model.slides)) {
    throw new Error("Invalid PPTX model: slides are missing.");
  }
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";

  for (const slideModel of model.slides) {
    const slide = pptx.addSlide();
    const hasBackgroundImage = Boolean(slideModel.backgroundImage);
    if (slideModel.background?.color) {
      slide.background = {
        color: normalizeColor(slideModel.background.color),
      };
    }

    if (slideModel.backgroundImage) {
      const source = await buildImageSource(slideModel.backgroundImage);
      slide.addImage({
        ...source,
        x: toInches(0),
        y: toInches(0),
        w: toInches(1280),
        h: toInches(720),
      });
    }

    const shapes = Array.isArray(slideModel.shapes) ? slideModel.shapes : [];
    for (const shape of shapes) {
      if (
        hasBackgroundImage &&
        isPicture(shape) &&
        slideModel.backgroundImage &&
        shape.picture.path === slideModel.backgroundImage
      ) {
        continue;
      }
      if (isTextBox(shape)) {
        const text = buildParagraphText(shape.paragraphs);
        const font = shape.paragraphs?.[0]?.font;
        const lineHeight = shape.paragraphs?.[0]?.line_height;
        // lineSpacing: convert line_height to percentage (1.5 -> 150)
        const lineSpacingPct =
          lineHeight && lineHeight > 0
            ? Math.round(lineHeight * 100)
            : undefined;

        // Map font to system-compatible font for consistent rendering
        const mappedFont = mapFontToSystem(font?.name);

        slide.addText(text, {
          x: toInches(shape.position.left),
          y: toInches(shape.position.top),
          // Use width compensation to prevent unwanted line breaks due to font metric differences
          w: toInchesWithCompensation(shape.position.width),
          h: toInches(shape.position.height),
          fontFace: mappedFont,
          fontSize: toPoint(font?.size),
          color: normalizeColor(font?.color),
          bold: (font?.font_weight || 400) >= 600,
          italic: font?.italic,
          underline: font?.underline ? { style: "sng" } : undefined,
          strike: font?.strike ? "sngStrike" : undefined,
          charSpacing: font?.charSpacing,
          align: normalizeAlignment(shape.paragraphs?.[0]?.alignment),
          valign: "top",
          lineSpacingMultiple: lineSpacingPct
            ? lineSpacingPct / 100
            : undefined,
          wrap: true, // Enable text wrapping
        });
        continue;
      }

      if (isAutoShape(shape)) {
        // Check what styling the shape has
        const hasFill = shape.fill?.color;
        const hasStroke = shape.stroke?.color;
        const hasShadow = shape.shadow;
        const hasText = shape.paragraphs?.length && shape.paragraphs.length > 0;

        // If shape has text, add text with shape properties (combined)
        if (hasText) {
          const text = buildParagraphText(shape.paragraphs);
          const font = shape.paragraphs?.[0]?.font;
          const lineHeight = shape.paragraphs?.[0]?.line_height;
          const lineSpacingPct =
            lineHeight && lineHeight > 0
              ? Math.round(lineHeight * 100)
              : undefined;

          // Map font to system-compatible font
          const mappedFont = mapFontToSystem(font?.name);

          // Use addText with shape parameter for combined text+shape
          const shapeType = shape.border_radius
            ? pptx.ShapeType.roundRect
            : pptx.ShapeType.rect;

          slide.addText(text, {
            x: toInches(shape.position.left),
            y: toInches(shape.position.top),
            w: toInches(shape.position.width),
            h: toInches(shape.position.height),
            fontFace: mappedFont,
            fontSize: toPoint(font?.size),
            color: normalizeColor(font?.color),
            bold: (font?.font_weight || 400) >= 600,
            italic: font?.italic,
            underline: font?.underline ? { style: "sng" } : undefined,
            strike: font?.strike ? "sngStrike" : undefined,
            charSpacing: font?.charSpacing,
            align: normalizeAlignment(shape.paragraphs?.[0]?.alignment),
            valign: "middle",
            lineSpacingMultiple: lineSpacingPct
              ? lineSpacingPct / 100
              : undefined,
            wrap: true,
            // Add shape properties
            shape: hasFill || hasStroke ? shapeType : undefined,
            fill: hasFill
              ? { color: normalizeColor(shape.fill!.color) }
              : undefined,
            line: hasStroke
              ? {
                  color: normalizeColor(shape.stroke!.color),
                  width: shape.stroke!.thickness ?? 1,
                }
              : undefined,
            shadow: hasShadow
              ? {
                  type: "outer",
                  blur: shape.shadow!.radius * 0.75,
                  offset: shape.shadow!.offset * 0.75,
                  angle: shape.shadow!.angle,
                  color: normalizeColor(shape.shadow!.color),
                  opacity: shape.shadow!.opacity,
                }
              : undefined,
            rectRadius: shape.border_radius
              ? (shape.border_radius /
                  Math.min(shape.position.width, shape.position.height)) *
                0.5
              : undefined,
          });
        } else if (hasFill || hasStroke || hasShadow) {
          // Shape without text - just add the shape
          const shapeType = shape.border_radius
            ? pptx.ShapeType.roundRect
            : pptx.ShapeType.rect;

          slide.addShape(shapeType, {
            x: toInches(shape.position.left),
            y: toInches(shape.position.top),
            w: toInches(shape.position.width),
            h: toInches(shape.position.height),
            fill: hasFill
              ? { color: normalizeColor(shape.fill!.color) }
              : { type: "none" },
            line: hasStroke
              ? {
                  color: normalizeColor(shape.stroke!.color),
                  width: shape.stroke!.thickness ?? 1,
                }
              : { type: "none" },
            shadow: hasShadow
              ? {
                  type: "outer",
                  blur: shape.shadow!.radius * 0.75,
                  offset: shape.shadow!.offset * 0.75,
                  angle: shape.shadow!.angle,
                  color: normalizeColor(shape.shadow!.color),
                  opacity: shape.shadow!.opacity,
                }
              : undefined,
            rectRadius: shape.border_radius
              ? (shape.border_radius /
                  Math.min(shape.position.width, shape.position.height)) *
                0.5
              : undefined,
          });
        }
        continue;
      }

      if (isPicture(shape)) {
        if (hasBackgroundImage) {
          continue;
        }
        const source = await buildImageSource(shape.picture.path);
        slide.addImage({
          ...source,
          x: toInches(shape.position.left),
          y: toInches(shape.position.top),
          w: toInches(shape.position.width),
          h: toInches(shape.position.height),
        });
        continue;
      }

      if (isConnector(shape)) {
        if (hasBackgroundImage) {
          continue;
        }
        slide.addShape(pptx.ShapeType.line, {
          x: toInches(shape.position.left),
          y: toInches(shape.position.top),
          w: toInches(shape.position.width),
          h: toInches(shape.position.height),
          line: {
            color: normalizeColor(shape.color),
            width: shape.thickness ?? 1,
          },
        });
        continue;
      }

      // Handle native PPTX charts
      if (isChart(shape)) {
        const chartType = mapChartType(shape.chartType, pptx);
        const chartData = shape.data.map((series) => ({
          name: series.name,
          labels: series.labels,
          values: series.values,
        }));

        // Debug log chart data before adding to slide
        console.log("[export.ts] Adding chart:", {
          chartType: shape.chartType,
          seriesCount: chartData.length,
          firstSeriesLabels: chartData[0]?.labels,
          firstSeriesValues: chartData[0]?.values,
          barDir: shape.options?.barDir,
        });

        const chartOptions: pptxgen.IChartOpts = {
          x: toInches(shape.position.left),
          y: toInches(shape.position.top),
          w: toInches(shape.position.width),
          h: toInches(shape.position.height),
          showLegend: shape.options?.showLegend ?? false,
          legendPos: shape.options?.legendPos ?? "b",
          showTitle: !!shape.options?.title,
          title: shape.options?.title,
          titleFontSize: shape.options?.titleFontSize ?? 14,
          titleColor: normalizeColor(shape.options?.titleColor),
          showValue: shape.options?.showDataLabels ?? false,
          chartColors: shape.options?.chartColors?.map((c) =>
            normalizeColor(c),
          ) as string[],
          barGapWidthPct: shape.options?.barGapWidthPct ?? 50,
          barDir: shape.options?.barDir ?? "col", // 'bar' for horizontal, 'col' for vertical
          lineSmooth: shape.options?.lineSmooth ?? true,
          lineDataSymbol: shape.options?.lineDataSymbol ?? "none",
        };

        // Add category axis settings
        if (shape.options?.catAxisTitle) {
          chartOptions.catAxisTitle = shape.options.catAxisTitle;
          chartOptions.showCatAxisTitle = true;
        }
        if (shape.options?.valAxisTitle) {
          chartOptions.valAxisTitle = shape.options.valAxisTitle;
          chartOptions.showValAxisTitle = true;
        }

        // Grid lines
        if (shape.options?.catGridLine) {
          chartOptions.catGridLine = {
            style: shape.options.catGridLine.style ?? "solid",
            color: normalizeColor(shape.options.catGridLine.color),
          };
        }
        if (shape.options?.valGridLine) {
          chartOptions.valGridLine = {
            style: shape.options.valGridLine.style ?? "solid",
            color: normalizeColor(shape.options.valGridLine.color),
          };
        }

        slide.addChart(chartType, chartData, chartOptions);
        continue;
      }

      // Handle native PPTX tables
      if (isTable(shape)) {
        const tableData: pptxgen.TableRow[] = shape.rows.map((row) =>
          row.cells.map((cell) => ({
            text: cell.text,
            options: {
              fontFace: cell.font?.name,
              fontSize: toPoint(cell.font?.size),
              color: normalizeColor(cell.font?.color),
              bold: (cell.font?.font_weight || 400) >= 600,
              fill: cell.fill?.color
                ? { color: normalizeColor(cell.fill.color) }
                : undefined,
              align: cell.align ?? "left",
              valign: cell.valign ?? "middle",
              colspan: cell.colspan,
              rowspan: cell.rowspan,
            },
          })),
        );

        const tableOptions: pptxgen.TableProps = {
          x: toInches(shape.position.left),
          y: toInches(shape.position.top),
          w: toInches(shape.position.width),
          h: toInches(shape.position.height),
          colW: shape.options?.colWidths?.map((w) => toInches(w)),
          rowH: shape.options?.rowHeights?.map((h) => toInches(h)),
          border: shape.options?.border
            ? {
                pt: shape.options.border.pt ?? 1,
                color: normalizeColor(shape.options.border.color) ?? "CFCFCF",
              }
            : { pt: 1, color: "CFCFCF" },
          fill: shape.options?.fill
            ? { color: normalizeColor(shape.options.fill) }
            : undefined,
          fontFace: shape.options?.fontFace,
          fontSize: shape.options?.fontSize,
          color: normalizeColor(shape.options?.color),
          align: shape.options?.align ?? "left",
          valign: shape.options?.valign ?? "middle",
        };

        slide.addTable(tableData, tableOptions);
        continue;
      }
    }
  }

  const fileName = `${model.name || "presentation"}-${Date.now()}.pptx`;

  if (isSupabaseEnabled()) {
    const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
    const storagePath = `exports/${fileName}`;
    return uploadSupabaseFileAndGetPublicUrl({
      path: storagePath,
      data: buffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      upsert: true,
    });
  }

  const outputPath = path.join(getExportsDirectory(), fileName);
  await pptx.writeFile({ fileName: outputPath });
  return `/app_data/exports/${fileName}`;
};
