/**
 * Utilities for converting element attributes to PPTX (PowerPoint) models.
 *
 * Provides functions for converting HTML/CSS element attributes and slide
 * data into PPTX-compatible models for PowerPoint generation. Handles
 * conversion of text boxes, auto shapes, pictures, connectors, charts,
 * and tables. Includes utilities for text alignment, line height, and
 * various visual properties (fills, strokes, shadows, fonts).
 */

import {
  ElementAttributes,
  SlideAttributesResult,
  ChartDataAttribute,
  TableDataAttribute,
} from "@/types/element-attributes";
import {
  PptxSlideModel,
  PptxTextBoxModel,
  PptxAutoShapeBoxModel,
  PptxPictureBoxModel,
  PptxConnectorModel,
  PptxChartModel,
  PptxTableModel,
  PptxPositionModel,
  PptxFillModel,
  PptxStrokeModel,
  PptxShadowModel,
  PptxFontModel,
  PptxParagraphModel,
  PptxPictureModel,
  PptxObjectFitModel,
  PptxBoxShapeEnum,
  PptxObjectFitEnum,
  PptxAlignment,
  PptxShapeType,
  PptxConnectorType,
  PptxChartType,
  PptxChartSeries,
} from "@/types/pptx-models";

/**
 * Standard slide dimensions in pixels.
 * Used for positioning and sizing elements within slides.
 */
const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;

/**
 * Converts CSS text-align value to PPTX alignment enum.
 *
 * Maps CSS text alignment strings (left, center, right, justify) to
 * PPTX alignment enum values. Returns undefined if no alignment is provided,
 * or defaults to LEFT for unknown values.
 *
 * @param textAlign - CSS text-align value (e.g., "left", "center", "right", "justify").
 * @returns PPTX alignment enum value, or undefined if not provided.
 */
function convertTextAlignToPptxAlignment(
  textAlign?: string,
): PptxAlignment | undefined {
  if (!textAlign) return undefined;

  switch (textAlign.toLowerCase()) {
    case "left":
      return PptxAlignment.LEFT;
    case "center":
      return PptxAlignment.CENTER;
    case "right":
      return PptxAlignment.RIGHT;
    case "justify":
      return PptxAlignment.JUSTIFY;
    default:
      return PptxAlignment.LEFT;
  }
}

/**
 * Converts absolute line height to relative line height.
 *
 * Converts pixel-based line height to a relative value (multiplier) based on
 * font size. If line height is less than 10, treats it as already relative.
 * Adjusts the result by subtracting 0.3 to account for PPTX rendering differences.
 *
 * @param lineHeight - Line height in pixels or relative value.
 * @param fontSize - Font size in pixels for calculating relative value.
 * @returns Relative line height (multiplier), or undefined if not provided.
 */
function convertLineHeightToRelative(
  lineHeight?: number,
  fontSize?: number,
): number | undefined {
  if (!lineHeight) return undefined;

  let calculatedLineHeight = 1.2;
  if (lineHeight < 10) {
    calculatedLineHeight = lineHeight;
  }

  if (fontSize && fontSize > 0) {
    calculatedLineHeight = Math.round((lineHeight / fontSize) * 100) / 100;
  }

  return calculatedLineHeight - 0.3;
}

/**
 * Union type for all supported PPTX shape types.
 *
 * Represents any shape that can be added to a PPTX slide, including
 * text boxes, auto shapes, connectors, pictures, charts, and tables.
 */
type AnyPptxShape =
  | PptxTextBoxModel
  | PptxAutoShapeBoxModel
  | PptxConnectorModel
  | PptxPictureBoxModel
  | PptxChartModel
  | PptxTableModel;

/**
 * Converts slide element attributes to PPTX slide models.
 *
 * Main conversion function that transforms an array of slide attributes
 * (containing elements, backgrounds, and speaker notes) into PPTX slide
 * models ready for PowerPoint generation. Handles background images and
 * colors, converts all elements to PPTX shapes, and preserves speaker notes.
 *
 * @param slidesAttributes - Array of slide attributes containing elements,
 *   backgrounds, and metadata for each slide.
 * @returns Array of PPTX slide models ready for PowerPoint generation.
 *
 * @example
 * ```typescript
 * const pptxSlides = convertElementAttributesToPptxSlides([
 *   {
 *     elements: [textElement, imageElement],
 *     backgroundColor: "#ffffff",
 *     speakerNote: "Slide notes"
 *   }
 * ]);
 * ```
 */
export function convertElementAttributesToPptxSlides(
  slidesAttributes: SlideAttributesResult[],
): PptxSlideModel[] {
  return slidesAttributes.map((slideAttributes) => {
    const shapes = slideAttributes.elements
      .map((element) => {
        return convertElementToPptxShape(element);
      })
      .filter(Boolean);

    const slide: PptxSlideModel = {
      backgroundImage: slideAttributes.backgroundImage,
      shapes: shapes as AnyPptxShape[],
      note: slideAttributes.speakerNote,
    };

    if (slideAttributes.backgroundColor) {
      slide.background = {
        color: slideAttributes.backgroundColor,
        opacity: 1.0,
      };
    }

    if (slideAttributes.backgroundImage) {
      const backgroundShape: PptxPictureBoxModel = {
        shape_type: "picture",
        position: {
          left: 0,
          top: 0,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
        },
        margin: undefined,
        clip: false,
        invert: false,
        opacity: 1,
        border_radius: undefined,
        shape: PptxBoxShapeEnum.RECTANGLE,
        object_fit: { fit: PptxObjectFitEnum.FILL },
        picture: {
          is_network:
            slideAttributes.backgroundImage.startsWith("http") ||
            slideAttributes.backgroundImage.startsWith("supabase://"),
          path: slideAttributes.backgroundImage,
        },
      };
      slide.shapes = [backgroundShape, ...slide.shapes];
    }

    return slide;
  });
}

/**
 * Converts an element attribute to a PPTX shape.
 *
 * Determines the appropriate PPTX shape type based on element properties
 * and delegates to the specific conversion function. Handles charts, tables,
 * images, text elements, connectors, and auto shapes.
 *
 * @param element - Element attributes from DOM analysis.
 * @returns PPTX shape model, or null if element cannot be converted
 *   (e.g., missing position).
 */
function convertElementToPptxShape(
  element: ElementAttributes,
): AnyPptxShape | null {
  if (!element.position) {
    return null;
  }

  // Handle native charts (instead of screenshotting SVG)
  if (element.chartData) {
    return convertToChart(element);
  }

  // Handle native tables (instead of screenshotting)
  if (element.tableData) {
    return convertToTable(element);
  }

  if (
    element.tagName === "img" ||
    (element.className &&
      typeof element.className === "string" &&
      element.className.includes("image")) ||
    element.imageSrc
  ) {
    return convertToPictureBox(element);
  }

  if (element.innerText && element.innerText.trim().length > 0) {
    // Use AutoShape model if there's background color and border radius
    if (
      element.background?.color &&
      element.borderRadius &&
      element.borderRadius.some((radius) => radius > 0)
    ) {
      return convertToAutoShapeBox(element);
    }
    return convertToTextBox(element);
  }

  if (element.tagName === "hr") {
    return convertToConnector(element);
  }

  return convertToAutoShapeBox(element);
}

/**
 * Converts element attributes to a PPTX text box model.
 *
 * Creates a text box shape with text content, font properties, paragraph
 * formatting, and optional background fill. Used for simple text elements
 * without background colors or border radius.
 *
 * @param element - Element attributes containing text and styling information.
 * @returns PPTX text box model with formatted text and styling.
 */
function convertToTextBox(element: ElementAttributes): PptxTextBoxModel {
  const position: PptxPositionModel = {
    left: Math.round(element.position?.left ?? 0),
    top: Math.round(element.position?.top ?? 0),
    width: Math.round(element.position?.width ?? 0),
    height: Math.round(element.position?.height ?? 0),
  };

  const fill: PptxFillModel | undefined = element.background?.color
    ? {
        color: element.background.color,
        opacity: element.background.opacity ?? 1.0,
      }
    : undefined;

  const font: PptxFontModel | undefined = element.font
    ? {
        name: element.font.name ?? "Inter",
        size: Math.round(element.font.size ?? 16),
        font_weight: element.font.weight ?? 400,
        italic: element.font.italic ?? false,
        color: element.font.color ?? "000000",
        underline: element.font.underline,
        strike: element.font.strike,
        charSpacing: element.font.charSpacing,
      }
    : undefined;

  const paragraph: PptxParagraphModel = {
    spacing: undefined,
    alignment: convertTextAlignToPptxAlignment(element.textAlign),
    font,
    line_height: convertLineHeightToRelative(
      element.lineHeight,
      element.font?.size,
    ),
    text: element.innerText,
  };

  return {
    shape_type: "textbox",
    margin: undefined,
    fill,
    position,
    text_wrap: element.textWrap ?? true,
    paragraphs: [paragraph],
  };
}

/**
 * Converts element attributes to a PPTX auto shape model.
 *
 * Creates an auto shape (rectangle or rounded rectangle) with optional
 * fill, stroke, shadow, and text content. Used for elements with background
 * colors, borders, or border radius. Supports both filled shapes and
 * shapes with text content.
 *
 * @param element - Element attributes containing shape properties, styling,
 *   and optional text content.
 * @returns PPTX auto shape model with visual properties and optional text.
 */
function convertToAutoShapeBox(
  element: ElementAttributes,
): PptxAutoShapeBoxModel {
  const position: PptxPositionModel = {
    left: Math.round(element.position?.left ?? 0),
    top: Math.round(element.position?.top ?? 0),
    width: Math.round(element.position?.width ?? 0),
    height: Math.round(element.position?.height ?? 0),
  };
  const fill: PptxFillModel | undefined = element.background?.color
    ? {
        color: element.background.color,
        opacity: element.background.opacity ?? 1.0,
      }
    : undefined;

  const stroke: PptxStrokeModel | undefined = element.border?.color
    ? {
        color: element.border.color,
        thickness: element.border.width ?? 1,
        opacity: element.border.opacity ?? 1.0,
      }
    : undefined;

  const shadow: PptxShadowModel | undefined = element.shadow?.color
    ? {
        radius: Math.round(element.shadow.radius ?? 4),
        offset: Math.round(
          element.shadow.offset
            ? Math.sqrt(
                element.shadow.offset[0] ** 2 + element.shadow.offset[1] ** 2,
              )
            : 0,
        ),
        color: element.shadow.color,
        opacity: element.shadow.opacity ?? 0.5,
        angle: Math.round(element.shadow.angle ?? 0),
      }
    : undefined;

  const paragraphs: PptxParagraphModel[] | undefined = element.innerText
    ? [
        {
          spacing: undefined,
          alignment: convertTextAlignToPptxAlignment(element.textAlign),
          font: element.font
            ? {
                name: element.font.name ?? "Inter",
                size: Math.round(element.font.size ?? 16),
                font_weight: element.font.weight ?? 400,
                italic: element.font.italic ?? false,
                color: element.font.color ?? "000000",
                underline: element.font.underline,
                strike: element.font.strike,
                charSpacing: element.font.charSpacing,
              }
            : undefined,
          line_height: convertLineHeightToRelative(
            element.lineHeight,
            element.font?.size,
          ),
          text: element.innerText,
        },
      ]
    : undefined;

  const shapeType = element.borderRadius
    ? PptxShapeType.ROUNDED_RECTANGLE
    : PptxShapeType.RECTANGLE;

  let borderRadius = undefined;
  for (const eachCornerRadius of element.borderRadius ?? []) {
    if (eachCornerRadius > 0) {
      borderRadius = Math.max(borderRadius ?? 0, eachCornerRadius);
    }
  }

  return {
    shape_type: "autoshape",
    type: shapeType,
    margin: undefined,
    fill,
    stroke,
    shadow,
    position,
    text_wrap: element.textWrap ?? true,
    border_radius: borderRadius || undefined,
    paragraphs,
  };
}

/**
 * Converts element attributes to a PPTX picture box model.
 *
 * Creates a picture shape with image source, object fit settings, opacity,
 * border radius, and optional clipping. Handles both network images (HTTP/HTTPS)
 * and local images. Supports various shapes (rectangle, circle, etc.) and
 * object fit modes (contain, cover, fill).
 *
 * @param element - Element attributes containing image source and styling.
 * @returns PPTX picture box model with image properties and styling.
 */
function convertToPictureBox(element: ElementAttributes): PptxPictureBoxModel {
  const position: PptxPositionModel = {
    left: Math.round(element.position?.left ?? 0),
    top: Math.round(element.position?.top ?? 0),
    width: Math.round(element.position?.width ?? 0),
    height: Math.round(element.position?.height ?? 0),
  };

  const objectFit: PptxObjectFitModel = {
    fit: element.objectFit
      ? (element.objectFit as PptxObjectFitEnum)
      : PptxObjectFitEnum.CONTAIN,
  };

  const picture: PptxPictureModel = {
    is_network: element.imageSrc ? element.imageSrc.startsWith("http") : false,
    path: element.imageSrc || "",
  };

  return {
    shape_type: "picture",
    position,
    margin: undefined,
    clip: element.clip ?? true,
    invert: element.filters?.invert === 1,
    opacity: element.opacity,
    border_radius: element.borderRadius
      ? element.borderRadius.map((r) => Math.round(r))
      : undefined,
    shape: element.shape
      ? (element.shape as PptxBoxShapeEnum)
      : PptxBoxShapeEnum.RECTANGLE,
    object_fit: objectFit,
    picture,
  };
}

/**
 * Converts element attributes to a PPTX connector model.
 *
 * Creates a connector (line) shape, typically used for horizontal rules
 * (hr elements). Uses border or background color for the line color and
 * border width for thickness.
 *
 * @param element - Element attributes containing position and border/background
 *   color information.
 * @returns PPTX connector model with line properties.
 */
function convertToConnector(element: ElementAttributes): PptxConnectorModel {
  const position: PptxPositionModel = {
    left: Math.round(element.position?.left ?? 0),
    top: Math.round(element.position?.top ?? 0),
    width: Math.round(element.position?.width ?? 0),
    height: Math.round(element.position?.height ?? 0),
  };

  return {
    shape_type: "connector",
    type: PptxConnectorType.STRAIGHT,
    position,
    thickness: element.border?.width ?? 0.5,
    color: element.border?.color || element.background?.color || "000000",
    opacity: element.border?.opacity ?? 1.0,
  };
}

/**
 * Converts element attributes with chart data to a PPTX chart model.
 *
 * Creates a native PPTX chart (bar, line, area, pie, doughnut, scatter)
 * from chart data attributes. Validates chart data structure, extracts labels
 * and values, maps chart types, and configures chart options including colors,
 * grid lines, and bar direction. Supports single-series charts with custom colors.
 *
 * @param element - Element attributes containing chartData and position.
 * @returns PPTX chart model with series data and options, or null if
 *   chart data is invalid or missing.
 */
function convertToChart(element: ElementAttributes): PptxChartModel | null {
  if (!element.chartData || !element.position) {
    return null;
  }

  const chartData = element.chartData;
  const position: PptxPositionModel = {
    left: Math.round(element.position.left ?? 0),
    top: Math.round(element.position.top ?? 0),
    width: Math.round(element.position.width ?? 0),
    height: Math.round(element.position.height ?? 0),
  };

  // Validate chartData structure
  if (
    !chartData.data ||
    !Array.isArray(chartData.data) ||
    chartData.data.length === 0
  ) {
    console.warn(
      "[convertToChart] Invalid chart data: data array is missing or empty",
    );
    return null;
  }

  if (!chartData.labelKey || !chartData.valueKey) {
    console.warn(
      "[convertToChart] Invalid chart data: labelKey or valueKey is missing",
    );
    return null;
  }

  // Debug logging for chart data
  console.log("[convertToChart] Processing chart:", {
    type: chartData.type,
    labelKey: chartData.labelKey,
    valueKey: chartData.valueKey,
    dataLength: chartData.data.length,
    firstItem: chartData.data[0],
    firstLabel: chartData.data[0]?.[chartData.labelKey],
    firstValue: chartData.data[0]?.[chartData.valueKey],
  });

  // Map chart type string to enum
  const chartTypeMap: Record<string, PptxChartType> = {
    area: PptxChartType.AREA,
    bar: PptxChartType.BAR,
    line: PptxChartType.LINE,
    pie: PptxChartType.PIE,
    doughnut: PptxChartType.DOUGHNUT,
    scatter: PptxChartType.SCATTER,
  };

  const chartType = chartTypeMap[chartData.type] ?? PptxChartType.BAR;

  // Extract labels and values from data with explicit validation
  const labels: string[] = [];
  const values: number[] = [];

  for (let i = 0; i < chartData.data.length; i++) {
    const item = chartData.data[i];
    // Access the property by key and ensure it's a string
    const labelValue = item[chartData.labelKey];
    const valueValue = item[chartData.valueKey];

    // Use fallback labels if the key doesn't exist
    const label =
      labelValue !== undefined && labelValue !== null
        ? String(labelValue)
        : `Category ${i + 1}`;
    const value =
      typeof valueValue === "number"
        ? valueValue
        : parseFloat(String(valueValue)) || 0;

    labels.push(label);
    values.push(value);
  }

  // For bar charts with multiple colors or pie/doughnut charts,
  // each data point should use the chartColors array for individual bar colors
  // pptxgenjs applies chartColors to each category in single-series charts
  const series: PptxChartSeries[] = [
    {
      name: chartData.title || "Data",
      labels,
      values,
      color: chartData.color,
    },
  ];

  // Debug log final series data
  console.log("[convertToChart] Final series:", {
    labels: series[0].labels,
    values: series[0].values,
    chartColors: chartData.colors,
  });

  return {
    shape_type: "chart",
    chartType,
    position,
    data: series,
    options: {
      title: chartData.title,
      showLegend: false,
      chartColors:
        chartData.colors || (chartData.color ? [chartData.color] : undefined),
      lineSmooth: true,
      valGridLine: { style: "dash", color: "334155" },
      catGridLine: { style: "none" },
      barDir: chartData.barDir, // 'bar' for horizontal, 'col' for vertical
    },
  };
}

/**
 * Converts element attributes with table data to a PPTX table model.
 *
 * Creates a native PPTX table from table data attributes. Handles header rows
 * with custom styling (background color, font weight) and data rows. Configures
 * cell alignment, borders, and font properties. Supports tables with or without
 * headers.
 *
 * @param element - Element attributes containing tableData and position.
 * @returns PPTX table model with rows and cell formatting, or null if
 *   table data is invalid or missing.
 */
function convertToTable(element: ElementAttributes): PptxTableModel | null {
  if (!element.tableData || !element.position) {
    return null;
  }

  const tableData = element.tableData;
  const position: PptxPositionModel = {
    left: Math.round(element.position.left ?? 0),
    top: Math.round(element.position.top ?? 0),
    width: Math.round(element.position.width ?? 0),
    height: Math.round(element.position.height ?? 0),
  };

  const rows: PptxTableModel["rows"] = [];

  // Add header row if present
  if (tableData.headers && tableData.headers.length > 0) {
    rows.push({
      cells: tableData.headers.map((header) => ({
        text: header,
        font: {
          name: "Inter",
          size: 12,
          font_weight: 600,
          italic: false,
          color: tableData.headerColor || "ffffff",
        },
        fill: tableData.headerBackground
          ? { color: tableData.headerBackground, opacity: 1 }
          : { color: "334155", opacity: 1 },
        align: "center",
        valign: "middle",
      })),
    });
  }

  // Add data rows
  for (const row of tableData.rows) {
    rows.push({
      cells: row.map((cell) => ({
        text: cell,
        align: "left",
        valign: "middle",
      })),
    });
  }

  return {
    shape_type: "table",
    position,
    rows,
    options: {
      border: { pt: 1, color: "334155" },
      fontSize: 11,
      fontFace: "Inter",
    },
  };
}
