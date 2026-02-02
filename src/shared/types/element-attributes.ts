/**
 * Type definitions for element attributes extracted from rendered slides.
 *
 * This module defines data structures used when extracting visual and structural
 * information from slide elements rendered in the browser. These attributes are
 * extracted using Puppeteer and used to reconstruct slides in PowerPoint format
 * or for other processing purposes.
 *
 * The attributes capture styling, positioning, content, and other properties
 * of DOM elements that represent slide content.
 */

import { ElementHandle } from "puppeteer-core";

/**
 * Chart data structure extracted from slide elements for native PPTX export.
 *
 * Represents chart data that has been extracted from a rendered chart element
 * on a slide. Used when converting web-rendered charts to native PowerPoint
 * charts instead of using screenshots. This allows for editable charts in the
 * exported PowerPoint file.
 *
 * @property type - Chart type identifier. Determines the visual style of the
 *   chart. Supported types: "area", "bar", "line", "pie", "doughnut", "scatter".
 * @property title - Optional chart title text. Displayed above the chart.
 * @property data - Array of data objects. Each object represents one data point
 *   or category. Objects can have any string or number properties, with specific
 *   keys identified by labelKey and valueKey.
 * @property labelKey - Key name in the data objects that contains the label
 *   text (e.g., "category", "month", "product"). Used to extract category labels
 *   from the data array.
 * @property valueKey - Key name in the data objects that contains the numerical
 *   value (e.g., "value", "sales", "count"). Used to extract values from the
 *   data array.
 * @property color - Optional single color for the entire chart. Applied uniformly
 *   if colors array is not provided.
 * @property colors - Optional array of color strings. Provides a color scheme
 *   for the chart. Each color corresponds to a data series or category.
 * @property barDir - Optional bar direction for bar charts. "bar" creates
 *   horizontal bars, "col" (column) creates vertical bars. Defaults to "col"
 *   if not specified.
 *
 * @example
 * ```typescript
 * const chartData: ChartDataAttribute = {
 *   type: "bar",
 *   title: "Quarterly Sales",
 *   data: [
 *     { quarter: "Q1", sales: 100000 },
 *     { quarter: "Q2", sales: 150000 }
 *   ],
 *   labelKey: "quarter",
 *   valueKey: "sales",
 *   colors: ["#4CAF50", "#2196F3"]
 * };
 * ```
 */
export interface ChartDataAttribute {
  type: "area" | "bar" | "line" | "pie" | "doughnut" | "scatter";
  title?: string;
  data: Array<Record<string, string | number>>;
  labelKey: string;
  valueKey: string;
  color?: string;
  colors?: string[];
  barDir?: "bar" | "col"; // 'bar' for horizontal bars, 'col' for vertical columns
}

/**
 * Table data structure extracted from slide elements for native PPTX export.
 *
 * Represents table data that has been extracted from a rendered table element
 * on a slide. Used when converting web-rendered tables to native PowerPoint
 * tables instead of using screenshots. This allows for editable tables in the
 * exported PowerPoint file.
 *
 * @property headers - Optional array of header row cell texts. If provided,
 *   the first row of the table will be styled as a header row. Each string
 *   represents one column header.
 * @property rows - Required array of table rows. Each row is an array of
 *   strings representing cell contents. All rows should have the same number
 *   of cells (matching the number of headers if headers are provided).
 * @property headerBackground - Optional background color for the header row.
 *   Hex color string (e.g., "#333333"). Applied to all header cells.
 * @property headerColor - Optional text color for the header row. Hex color
 *   string (e.g., "#FFFFFF"). Applied to all header cell text.
 *
 * @example
 * ```typescript
 * const tableData: TableDataAttribute = {
 *   headers: ["Product", "Sales", "Growth"],
 *   rows: [
 *     ["Widget A", "$10,000", "+20%"],
 *     ["Widget B", "$15,000", "+15%"]
 *   ],
 *   headerBackground: "#333333",
 *   headerColor: "#FFFFFF"
 * };
 * ```
 */
export interface TableDataAttribute {
  headers?: string[];
  rows: string[][];
  headerBackground?: string;
  headerColor?: string;
}

/**
 * Complete attribute structure for a slide element extracted from the DOM.
 *
 * Represents all visual, structural, and content properties of an element
 * rendered on a slide. This structure is populated by extracting computed
 * styles and properties from DOM elements using Puppeteer. Used to convert
 * web-rendered slides to PowerPoint format while preserving visual appearance.
 *
 * The structure captures CSS properties, positioning, content, and special
 * data (charts, tables) that can be used for native PowerPoint export.
 *
 * @property tagName - HTML tag name of the element (e.g., "div", "p", "img").
 *   Used to identify the element type during processing.
 * @property id - Optional HTML id attribute of the element. Used for element
 *   identification and referencing.
 * @property className - Optional CSS class names applied to the element.
 *   May contain multiple space-separated class names.
 * @property innerText - Optional text content of the element. Extracted text
 *   that will be displayed in PowerPoint. For elements with nested children,
 *   contains the concatenated text from all descendants.
 * @property opacity - Optional overall opacity of the element. Value from 0.0
 *   (transparent) to 1.0 (opaque). Affects the entire element including
 *   content and background.
 * @property background - Optional background styling object. Contains background
 *   color and opacity. Used to set element backgrounds in PowerPoint.
 * @property background.color - Background color as a hex string (e.g., "#FFFFFF").
 * @property background.opacity - Background opacity from 0.0 to 1.0.
 * @property border - Optional border styling object. Defines the border around
 *   the element.
 * @property border.color - Border color as a hex string.
 * @property border.width - Border width in pixels.
 * @property border.opacity - Border opacity from 0.0 to 1.0.
 * @property shadow - Optional CSS box-shadow properties. Creates drop shadow
 *   effects for elements.
 * @property shadow.offset - Shadow offset as [x, y] coordinates in pixels.
 * @property shadow.color - Shadow color as a hex string.
 * @property shadow.opacity - Shadow opacity from 0.0 to 1.0.
 * @property shadow.radius - Blur radius of the shadow in pixels. Larger values
 *   create softer shadows.
 * @property shadow.angle - Shadow angle in degrees (0-360). Direction of the
 *   shadow offset.
 * @property shadow.spread - Shadow spread radius in pixels. Expands or contracts
 *   the shadow.
 * @property shadow.inset - Whether the shadow is an inset shadow (inside the
 *   element) rather than an outer shadow.
 * @property font - Optional typography properties. Defines text appearance.
 * @property font.name - Font family name (e.g., "Arial", "Helvetica").
 * @property font.size - Font size in pixels.
 * @property font.weight - Font weight/thickness (100-900, or 400 for normal).
 * @property font.color - Text color as a hex string.
 * @property font.italic - Whether text is italicized.
 * @property font.underline - Whether text is underlined.
 * @property font.strike - Whether text has strikethrough.
 * @property font.charSpacing - Character spacing (letter-spacing) in pixels.
 * @property position - Optional absolute positioning. Defines element location
 *   and size on the slide.
 * @property position.left - Horizontal position in pixels from the left edge.
 * @property position.top - Vertical position in pixels from the top edge.
 * @property position.width - Element width in pixels.
 * @property position.height - Element height in pixels.
 * @property margin - Optional margin spacing. Space outside the element.
 * @property margin.top - Top margin in pixels.
 * @property margin.bottom - Bottom margin in pixels.
 * @property margin.left - Left margin in pixels.
 * @property margin.right - Right margin in pixels.
 * @property padding - Optional padding spacing. Space inside the element.
 * @property padding.top - Top padding in pixels.
 * @property padding.bottom - Bottom padding in pixels.
 * @property padding.left - Left padding in pixels.
 * @property padding.right - Right padding in pixels.
 * @property zIndex - Optional stacking order. Higher values appear on top of
 *   lower values. Controls element layering.
 * @property textAlign - Optional horizontal text alignment. "left", "center",
 *   "right", or "justify". Only relevant for text-containing elements.
 * @property lineHeight - Optional line height as a multiplier or pixel value.
 *   Controls vertical spacing between lines of text.
 * @property borderRadius - Optional array of border radius values [top-left,
 *   top-right, bottom-right, bottom-left] in pixels. Creates rounded corners.
 *   Can be a single number (all corners) or four values.
 * @property imageSrc - Optional image source URL or path. For img elements,
 *   contains the image location.
 * @property objectFit - Optional CSS object-fit value for images. "contain",
 *   "cover", or "fill". Controls how images fit their containers.
 * @property clip - Optional boolean indicating whether content should be clipped
 *   to element boundaries. If true, overflow is hidden.
 * @property overlay - Optional overlay color or effect. Hex color string for
 *   color overlays applied to images or elements.
 * @property shape - Optional shape type for masking. "rectangle" or "circle".
 *   Used to clip elements into specific shapes.
 * @property connectorType - Optional connector line type identifier. Used for
 *   connector/shape-connecting elements. Values like "straight", "elbow", "curved".
 * @property textWrap - Optional boolean indicating whether text should wrap
 *   within element boundaries. If false, text may overflow.
 * @property should_screenshot - Optional boolean flag indicating this element
 *   should be exported as a screenshot rather than converted to native PowerPoint
 *   elements. Used for complex elements that can't be easily converted.
 * @property element - Optional Puppeteer ElementHandle reference. Direct reference
 *   to the DOM element for additional processing or screenshot capture. Used
 *   during the extraction process but not included in final export data.
 * @property filters - Optional CSS filter properties. Applies visual effects to
 *   the element.
 * @property filters.invert - Inversion amount (0-1). 1 fully inverts colors.
 * @property filters.brightness - Brightness multiplier. 1 is normal, >1 is brighter.
 * @property filters.contrast - Contrast multiplier. 1 is normal, >1 is more contrast.
 * @property filters.saturate - Saturation multiplier. 1 is normal, 0 is grayscale.
 * @property filters.hueRotate - Hue rotation in degrees (0-360).
 * @property filters.blur - Blur radius in pixels. Creates a blur effect.
 * @property filters.grayscale - Grayscale amount (0-1). 1 is fully grayscale.
 * @property filters.sepia - Sepia tone amount (0-1). 1 is fully sepia.
 * @property filters.opacity - Filter-specific opacity (0-1).
 * @property chartData - Optional chart data for native PowerPoint chart export.
 *   When present, the element will be exported as a native editable chart
 *   instead of a screenshot. Used for better PowerPoint compatibility.
 * @property tableData - Optional table data for native PowerPoint table export.
 *   When present, the element will be exported as a native editable table
 *   instead of a screenshot. Used for better PowerPoint compatibility.
 */
export interface ElementAttributes {
  tagName: string;
  id?: string;
  className?: string;
  innerText?: string;
  opacity?: number;
  background?: {
    color?: string;
    opacity?: number;
  };
  border?: {
    color?: string;
    width?: number;
    opacity?: number;
  };
  shadow?: {
    offset?: [number, number];
    color?: string;
    opacity?: number;
    radius?: number;
    angle?: number;
    spread?: number;
    inset?: boolean;
  };
  font?: {
    name?: string;
    size?: number;
    weight?: number;
    color?: string;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    charSpacing?: number;
  };
  position?: {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
  };
  margin?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  padding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  zIndex?: number;
  textAlign?: "left" | "center" | "right" | "justify";
  lineHeight?: number;
  borderRadius?: number[];
  imageSrc?: string;
  objectFit?: "contain" | "cover" | "fill";
  clip?: boolean;
  overlay?: string;
  shape?: "rectangle" | "circle";
  connectorType?: string;
  textWrap?: boolean;
  should_screenshot?: boolean;
  element?: ElementHandle<Element>;
  filters?: {
    invert?: number;
    brightness?: number;
    contrast?: number;
    saturate?: number;
    hueRotate?: number;
    blur?: number;
    grayscale?: number;
    sepia?: number;
    opacity?: number;
  };
  // Native chart data for PPTX export (instead of screenshot)
  chartData?: ChartDataAttribute;
  // Native table data for PPTX export (instead of screenshot)
  tableData?: TableDataAttribute;
}

/**
 * Complete result structure from extracting slide attributes.
 *
 * Represents all extracted information from a rendered slide, including all
 * elements and slide-level properties. This is the output of the slide
 * attribute extraction process, which analyzes a rendered slide DOM and
 * extracts all visual and structural information needed for PowerPoint export.
 *
 * @property elements - Required array of ElementAttributes objects. Contains
 *   all elements found on the slide, each with its complete attribute set.
 *   Elements are typically in DOM order, which determines rendering order.
 * @property backgroundColor - Optional slide background color. Hex color string
 *   (e.g., "#FFFFFF") representing the slide's background. Extracted from
 *   the slide container's background style.
 * @property backgroundImage - Optional slide background image URL or path.
 *   If present, indicates the slide has a background image. Takes precedence
 *   over backgroundColor if both are present.
 * @property speakerNote - Optional speaker notes text extracted from the slide.
 *   Contains any presenter notes or additional information associated with
 *   the slide. Not displayed on the slide itself but included in PowerPoint
 *   notes view.
 */
export interface SlideAttributesResult {
  elements: ElementAttributes[];
  backgroundColor?: string;
  backgroundImage?: string;
  speakerNote?: string;
}
