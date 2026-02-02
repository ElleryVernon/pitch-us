/**
 * Type definitions for PowerPoint (PPTX) presentation models.
 *
 * This module defines the complete data structures used to represent PowerPoint
 * presentations, slides, and all their constituent elements (shapes, text boxes,
 * images, charts, tables, etc.). These types are used when converting slides
 * from the application's internal format to PowerPoint format for export.
 *
 * The types closely mirror the structure expected by pptxgenjs library, which
 * is used to generate actual PPTX files. All measurements are typically in
 * points (pt), which is the standard unit for PowerPoint.
 */

/**
 * Shape types for picture boxes in PowerPoint.
 *
 * Defines the geometric shape that can be applied to image containers.
 * Used to clip or mask images into specific shapes beyond the default rectangle.
 *
 * @property RECTANGLE - Standard rectangular shape. Default shape for images.
 * @property CIRCLE - Circular shape. Clips images into a perfect circle.
 */
export enum PptxBoxShapeEnum {
  RECTANGLE = "rectangle",
  CIRCLE = "circle",
}

/**
 * Object-fit behavior for images in PowerPoint.
 *
 * Defines how images are resized and positioned within their containers.
 * Controls whether images fill the container, maintain aspect ratio, or
 * use their natural size.
 *
 * @property CONTAIN - Image is scaled to fit entirely within the container
 *   while maintaining aspect ratio. May leave empty space if aspect ratios
 *   don't match.
 * @property COVER - Image is scaled to fill the entire container while
 *   maintaining aspect ratio. May crop parts of the image if aspect ratios
 *   don't match.
 * @property FILL - Image is stretched to fill the container exactly, ignoring
 *   aspect ratio. May cause distortion.
 */
export enum PptxObjectFitEnum {
  CONTAIN = "contain",
  COVER = "cover",
  FILL = "fill",
}

/**
 * Text alignment options for paragraphs in PowerPoint.
 *
 * Defines how text is horizontally aligned within text boxes and table cells.
 * The numeric values correspond to PowerPoint's internal alignment constants.
 *
 * @property LEFT - Text is aligned to the left edge. Default alignment.
 * @property CENTER - Text is centered horizontally within the container.
 * @property RIGHT - Text is aligned to the right edge.
 * @property JUSTIFY - Text is justified, spreading words to fill the full
 *   width of the container.
 * @property JUSTIFY_LOW - Low-justified text alignment. Similar to justify but
 *   with different spacing algorithm, used for certain languages.
 * @property DISTRIBUTE - Text is distributed evenly across the width, with
 *   equal spacing between characters.
 * @property THAI_DISTRIBUTE - Thai-specific text distribution algorithm.
 *   Used for proper spacing in Thai language text.
 * @property MIXED - Indicates mixed alignment within a paragraph (e.g., when
 *   different text runs have different alignments). Rarely used directly.
 */
export enum PptxAlignment {
  CENTER = 2,
  DISTRIBUTE = 5,
  JUSTIFY = 4,
  JUSTIFY_LOW = 7,
  LEFT = 1,
  RIGHT = 3,
  THAI_DISTRIBUTE = 6,
  MIXED = -2,
}

/**
 * Shape type identifiers for PowerPoint auto-shapes.
 *
 * Defines all available geometric shapes and special shapes that can be used
 * in PowerPoint presentations. These numeric values correspond to PowerPoint's
 * internal shape type constants (MSO_SHAPE_TYPE). Used when creating shapes
 * beyond simple rectangles and circles.
 *
 * Includes basic shapes (rectangles, circles, triangles), arrows, flowchart
 * symbols, callouts, stars, mathematical symbols, and many specialized shapes.
 * Each value represents a specific visual shape that PowerPoint can render.
 *
 * @property RECTANGLE - Basic rectangle shape (value: 1)
 * @property OVAL - Ellipse/circle shape (value: 9)
 * @property DIAMOND - Diamond/rhombus shape (value: 4)
 * @property [Additional shapes] - Many more shape types including arrows,
 *   flowcharts, callouts, stars, etc. See PowerPoint documentation for
 *   complete list of available shapes.
 */
export enum PptxShapeType {
  ACTION_BUTTON_BACK_OR_PREVIOUS = 129,
  ACTION_BUTTON_BEGINNING = 131,
  ACTION_BUTTON_CUSTOM = 125,
  ACTION_BUTTON_DOCUMENT = 134,
  ACTION_BUTTON_END = 132,
  ACTION_BUTTON_FORWARD_OR_NEXT = 130,
  ACTION_BUTTON_HELP = 127,
  ACTION_BUTTON_HOME = 126,
  ACTION_BUTTON_INFORMATION = 128,
  ACTION_BUTTON_MOVIE = 136,
  ACTION_BUTTON_RETURN = 133,
  ACTION_BUTTON_SOUND = 135,
  ARC = 25,
  BALLOON = 137,
  BENT_ARROW = 41,
  BENT_UP_ARROW = 44,
  BEVEL = 15,
  BLOCK_ARC = 20,
  CAN = 13,
  CHART_PLUS = 182,
  CHART_STAR = 181,
  CHART_X = 180,
  CHEVRON = 52,
  CHORD = 161,
  CIRCULAR_ARROW = 60,
  CLOUD = 179,
  CLOUD_CALLOUT = 108,
  CORNER = 162,
  CORNER_TABS = 169,
  CROSS = 11,
  CUBE = 14,
  CURVED_DOWN_ARROW = 48,
  CURVED_DOWN_RIBBON = 100,
  CURVED_LEFT_ARROW = 46,
  CURVED_RIGHT_ARROW = 45,
  CURVED_UP_ARROW = 47,
  CURVED_UP_RIBBON = 99,
  DECAGON = 144,
  DIAGONAL_STRIPE = 141,
  DIAMOND = 4,
  DODECAGON = 146,
  DONUT = 18,
  DOUBLE_BRACE = 27,
  DOUBLE_BRACKET = 26,
  DOUBLE_WAVE = 104,
  DOWN_ARROW = 36,
  DOWN_ARROW_CALLOUT = 56,
  DOWN_RIBBON = 98,
  EXPLOSION1 = 89,
  EXPLOSION2 = 90,
  FLOWCHART_ALTERNATE_PROCESS = 62,
  FLOWCHART_CARD = 75,
  FLOWCHART_COLLATE = 79,
  FLOWCHART_CONNECTOR = 73,
  FLOWCHART_DATA = 64,
  FLOWCHART_DECISION = 63,
  FLOWCHART_DELAY = 84,
  FLOWCHART_DIRECT_ACCESS_STORAGE = 87,
  FLOWCHART_DISPLAY = 88,
  FLOWCHART_DOCUMENT = 67,
  FLOWCHART_EXTRACT = 81,
  FLOWCHART_INTERNAL_STORAGE = 66,
  FLOWCHART_MAGNETIC_DISK = 86,
  FLOWCHART_MANUAL_INPUT = 71,
  FLOWCHART_MANUAL_OPERATION = 72,
  FLOWCHART_MERGE = 82,
  FLOWCHART_MULTIDOCUMENT = 68,
  FLOWCHART_OFFLINE_STORAGE = 139,
  FLOWCHART_OFFPAGE_CONNECTOR = 74,
  FLOWCHART_OR = 78,
  FLOWCHART_PREDEFINED_PROCESS = 65,
  FLOWCHART_PREPARATION = 70,
  FLOWCHART_PROCESS = 61,
  FLOWCHART_PUNCHED_TAPE = 76,
  FLOWCHART_SEQUENTIAL_ACCESS_STORAGE = 85,
  FLOWCHART_SORT = 80,
  FLOWCHART_STORED_DATA = 83,
  FLOWCHART_SUMMING_JUNCTION = 77,
  FLOWCHART_TERMINATOR = 69,
  FOLDED_CORNER = 16,
  FRAME = 158,
  FUNNEL = 174,
  GEAR_6 = 172,
  GEAR_9 = 173,
  HALF_FRAME = 159,
  HEART = 21,
  HEPTAGON = 145,
  HEXAGON = 10,
  HORIZONTAL_SCROLL = 102,
  ISOSCELES_TRIANGLE = 7,
  LEFT_ARROW = 34,
  LEFT_ARROW_CALLOUT = 54,
  LEFT_BRACE = 31,
  LEFT_BRACKET = 29,
  LEFT_CIRCULAR_ARROW = 176,
  LEFT_RIGHT_ARROW = 37,
  LEFT_RIGHT_ARROW_CALLOUT = 57,
  LEFT_RIGHT_CIRCULAR_ARROW = 177,
  LEFT_RIGHT_RIBBON = 140,
  LEFT_RIGHT_UP_ARROW = 40,
  LEFT_UP_ARROW = 43,
  LIGHTNING_BOLT = 22,
  LINE_CALLOUT_1 = 109,
  LINE_CALLOUT_1_ACCENT_BAR = 113,
  LINE_CALLOUT_1_BORDER_AND_ACCENT_BAR = 121,
  LINE_CALLOUT_1_NO_BORDER = 117,
  LINE_CALLOUT_2 = 110,
  LINE_CALLOUT_2_ACCENT_BAR = 114,
  LINE_CALLOUT_2_BORDER_AND_ACCENT_BAR = 122,
  LINE_CALLOUT_2_NO_BORDER = 118,
  LINE_CALLOUT_3 = 111,
  LINE_CALLOUT_3_ACCENT_BAR = 115,
  LINE_CALLOUT_3_BORDER_AND_ACCENT_BAR = 123,
  LINE_CALLOUT_3_NO_BORDER = 119,
  LINE_CALLOUT_4 = 112,
  LINE_CALLOUT_4_ACCENT_BAR = 116,
  LINE_CALLOUT_4_BORDER_AND_ACCENT_BAR = 124,
  LINE_CALLOUT_4_NO_BORDER = 120,
  LINE_INVERSE = 183,
  MATH_DIVIDE = 166,
  MATH_EQUAL = 167,
  MATH_MINUS = 164,
  MATH_MULTIPLY = 165,
  MATH_NOT_EQUAL = 168,
  MATH_PLUS = 163,
  MOON = 24,
  NON_ISOSCELES_TRAPEZOID = 143,
  NOTCHED_RIGHT_ARROW = 50,
  NO_SYMBOL = 19,
  OCTAGON = 6,
  OVAL = 9,
  OVAL_CALLOUT = 107,
  PARALLELOGRAM = 2,
  PENTAGON = 51,
  PIE = 142,
  PIE_WEDGE = 175,
  PLAQUE = 28,
  PLAQUE_TABS = 171,
  QUAD_ARROW = 39,
  QUAD_ARROW_CALLOUT = 59,
  RECTANGLE = 1,
  RECTANGULAR_CALLOUT = 105,
  REGULAR_PENTAGON = 12,
  RIGHT_ARROW = 33,
  RIGHT_ARROW_CALLOUT = 53,
  RIGHT_BRACE = 32,
  RIGHT_BRACKET = 30,
  RIGHT_TRIANGLE = 8,
  ROUNDED_RECTANGLE = 5,
  ROUNDED_RECTANGULAR_CALLOUT = 106,
  ROUND_1_RECTANGLE = 151,
  ROUND_2_DIAG_RECTANGLE = 153,
  ROUND_2_SAME_RECTANGLE = 152,
  SMILEY_FACE = 17,
  SNIP_1_RECTANGLE = 155,
  SNIP_2_DIAG_RECTANGLE = 157,
  SNIP_2_SAME_RECTANGLE = 156,
  SNIP_ROUND_RECTANGLE = 154,
  SQUARE_TABS = 170,
  STAR_10_POINT = 149,
  STAR_12_POINT = 150,
  STAR_16_POINT = 94,
  STAR_24_POINT = 95,
  STAR_32_POINT = 96,
  STAR_4_POINT = 91,
  STAR_5_POINT = 92,
  STAR_6_POINT = 147,
  STAR_7_POINT = 148,
  STAR_8_POINT = 93,
  STRIPED_RIGHT_ARROW = 49,
  SUN = 23,
  SWOOSH_ARROW = 178,
  TEAR = 160,
  TRAPEZOID = 3,
  UP_ARROW = 35,
  UP_ARROW_CALLOUT = 55,
  UP_DOWN_ARROW = 38,
  UP_DOWN_ARROW_CALLOUT = 58,
  UP_RIBBON = 97,
  U_TURN_ARROW = 42,
  VERTICAL_SCROLL = 101,
  WAVE = 103,
}

/**
 * Connector line types for connecting shapes in PowerPoint.
 *
 * Defines the visual style of connector lines used to link shapes together,
 * commonly used in flowcharts, organizational charts, and diagrams.
 *
 * @property STRAIGHT - Straight line connector. Draws a direct line between
 *   two connection points.
 * @property ELBOW - Elbow connector with 90-degree angles. Creates a line that
 *   turns at right angles, useful for avoiding overlapping shapes.
 * @property CURVE - Curved connector. Draws a smooth curved line between
 *   connection points.
 * @property MIXED - Indicates mixed connector types within a single connector
 *   (rarely used directly).
 */
export enum PptxConnectorType {
  CURVE = 3,
  ELBOW = 2,
  STRAIGHT = 1,
  MIXED = -2,
}

/**
 * Spacing model for margins and padding in PowerPoint elements.
 *
 * Defines spacing values for all four sides of an element. Used for margins
 * (space outside an element) and padding (space inside an element). All values
 * are in points (pt), which is the standard PowerPoint unit.
 *
 * @property top - Spacing in points for the top edge.
 * @property bottom - Spacing in points for the bottom edge.
 * @property left - Spacing in points for the left edge.
 * @property right - Spacing in points for the right edge.
 */
export interface PptxSpacingModel {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Position and size model for PowerPoint elements.
 *
 * Defines the location and dimensions of shapes, text boxes, images, and other
 * elements on a slide. All values are in points (pt), measured from the top-left
 * corner of the slide (0, 0).
 *
 * @property left - Horizontal position in points from the left edge of the slide.
 *   Positive values move the element to the right.
 * @property top - Vertical position in points from the top edge of the slide.
 *   Positive values move the element down.
 * @property width - Width of the element in points.
 * @property height - Height of the element in points.
 *
 * @example
 * ```typescript
 * // Position a text box at (100, 50) with size 400x200
 * const position: PptxPositionModel = {
 *   left: 100,
 *   top: 50,
 *   width: 400,
 *   height: 200
 * };
 * ```
 */
export interface PptxPositionModel {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Font properties model for text in PowerPoint.
 *
 * Defines the typography and styling for text elements. Used in paragraphs,
 * text runs, and table cells to control how text appears.
 *
 * @property name - Font family name (e.g., "Arial", "Calibri", "Times New Roman").
 *   Must be a font available in PowerPoint or installed on the system.
 * @property size - Font size in points. Typical values range from 8pt (small
 *   text) to 72pt+ (headings). Standard body text is usually 10-12pt.
 * @property font_weight - Font weight/thickness as a number. Common values:
 *   400 (normal), 600 (semi-bold), 700 (bold). Some fonts support more granular
 *   weights (100-900).
 * @property italic - Whether the text should be displayed in italic style.
 * @property color - Text color as a hex string (e.g., "#000000" for black,
 *   "#FF5733" for red) or PowerPoint color name.
 * @property underline - Whether the text should be underlined. Optional,
 *   defaults to false if not specified.
 * @property strike - Whether the text should have a strikethrough line.
 *   Optional, defaults to false if not specified.
 * @property charSpacing - Character spacing (letter-spacing) in points.
 *   Positive values increase spacing, negative values decrease it. Optional,
 *   defaults to 0 if not specified.
 */
export interface PptxFontModel {
  name: string;
  size: number;
  font_weight: number;
  italic: boolean;
  color: string;
  underline?: boolean;
  strike?: boolean;
  charSpacing?: number; // letter-spacing in pt
}

/**
 * Fill (background) model for shapes and text boxes in PowerPoint.
 *
 * Defines the background color and transparency for filled elements. Used to
 * set the background color of shapes, text boxes, and other filled elements.
 *
 * @property color - Fill color as a hex string (e.g., "#FFFFFF" for white,
 *   "#FF5733" for red) or PowerPoint color name.
 * @property opacity - Opacity/transparency value ranging from 0.0 (fully
 *   transparent) to 1.0 (fully opaque). Values between 0 and 1 create
 *   semi-transparent fills.
 */
export interface PptxFillModel {
  color: string;
  opacity: number;
}

/**
 * Stroke (border/outline) model for shapes in PowerPoint.
 *
 * Defines the border or outline properties for shapes. Used to add borders
 * around shapes, text boxes, and other elements.
 *
 * @property color - Stroke color as a hex string (e.g., "#000000" for black)
 *   or PowerPoint color name.
 * @property thickness - Stroke width in points. Typical values range from
 *   0.5pt (thin) to 10pt+ (thick). Common border thickness is 1-2pt.
 * @property opacity - Opacity/transparency value ranging from 0.0 (fully
 *   transparent) to 1.0 (fully opaque).
 */
export interface PptxStrokeModel {
  color: string;
  thickness: number;
  opacity: number;
}

/**
 * Shadow effect model for shapes in PowerPoint.
 *
 * Defines drop shadow properties to add depth and dimension to elements.
 * Shadows create a visual effect that makes elements appear to float above
 * the slide surface.
 *
 * @property radius - Blur radius of the shadow in points. Larger values create
 *   softer, more diffused shadows. Typical values range from 2pt (sharp) to
 *   20pt+ (very soft).
 * @property offset - Distance the shadow is offset from the element in points.
 *   Larger values create shadows that appear further away. Typically 2-10pt.
 * @property color - Shadow color as a hex string. Usually dark colors like
 *   "#000000" (black) or "#333333" (dark gray). Can be any color for creative
 *   effects.
 * @property opacity - Opacity/transparency value ranging from 0.0 (invisible)
 *   to 1.0 (fully opaque). Typical values are 0.2-0.5 for subtle shadows.
 * @property angle - Angle in degrees (0-360) indicating the direction of the
 *   shadow offset. 0° is right, 90° is down, 180° is left, 270° is up.
 *   Common values are 135° (bottom-right) or 225° (bottom-left).
 */
export interface PptxShadowModel {
  radius: number;
  offset: number;
  color: string;
  opacity: number;
  angle: number;
}

/**
 * Text run model for styled text segments within paragraphs.
 *
 * Represents a contiguous segment of text with specific formatting. Text runs
 * allow different parts of a paragraph to have different fonts, colors, or
 * styles. Used to create rich text with mixed formatting.
 *
 * @property text - The actual text content of this run.
 * @property font - Optional font properties for this text run. If not specified,
 *   inherits the paragraph's default font. Allows individual words or phrases
 *   to have different styling than the rest of the paragraph.
 */
export interface PptxTextRunModel {
  text: string;
  font?: PptxFontModel;
}

/**
 * Paragraph model for text content in PowerPoint.
 *
 * Represents a single paragraph within a text box. Paragraphs can contain
 * either plain text or multiple styled text runs. Controls alignment, spacing,
 * and overall paragraph formatting.
 *
 * @property spacing - Optional spacing model defining margins around the
 *   paragraph. Controls vertical and horizontal spacing between paragraphs.
 * @property alignment - Optional text alignment for the paragraph. Controls
 *   how text is horizontally aligned within the text box.
 * @property font - Optional default font for the paragraph. Applied to all
 *   text in the paragraph unless overridden by text runs. If not specified,
 *   uses the text box's default font.
 * @property line_height - Optional line height as a multiplier (e.g., 1.5)
 *   or absolute value in points. Controls vertical spacing between lines.
 *   Typical values are 1.0-2.0.
 * @property text - Optional plain text content. Used for simple paragraphs
 *   without mixed formatting. If both `text` and `text_runs` are provided,
 *   `text_runs` takes precedence.
 * @property text_runs - Optional array of styled text runs. Used for paragraphs
 *   with mixed formatting where different parts need different styles. Allows
 *   for rich text with bold, italic, colored segments, etc.
 */
export interface PptxParagraphModel {
  spacing?: PptxSpacingModel;
  alignment?: PptxAlignment;
  font?: PptxFontModel;
  line_height?: number;
  text?: string;
  text_runs?: PptxTextRunModel[];
}

/**
 * Object-fit model for image positioning and cropping.
 *
 * Defines how images are fitted within their containers, including focus point
 * for intelligent cropping. Used with picture boxes to control image display
 * behavior.
 *
 * @property fit - Optional object-fit behavior. Controls how the image is
 *   resized to fit the container (contain, cover, fill).
 * @property focus - Optional focus point coordinates [x, y] for intelligent
 *   cropping. When using "cover" fit mode, the focus point indicates which
 *   part of the image should remain visible after cropping. Coordinates are
 *   normalized (0.0 to 1.0) where [0, 0] is top-left and [1, 1] is bottom-right.
 *   Null values indicate no specific focus point.
 */
export interface PptxObjectFitModel {
  fit?: PptxObjectFitEnum;
  focus?: [number | null, number | null];
}

/**
 * Picture/image reference model for PowerPoint.
 *
 * Defines the source location of an image to be displayed in a picture box.
 * Supports both local file paths and network URLs.
 *
 * @property is_network - Boolean indicating whether the image is loaded from
 *   a network URL (true) or a local file path (false). Determines how
 *   PowerPoint should access the image.
 * @property path - The image path or URL. If `is_network` is true, this is
 *   a full URL (e.g., "https://example.com/image.jpg"). If false, this is
 *   a local file path relative to the presentation or absolute system path.
 */
export interface PptxPictureModel {
  is_network: boolean;
  path: string;
}

/**
 * Base interface for all shape models in PowerPoint.
 *
 * Empty base interface that all shape types extend. Provides a common type
 * for collections that can contain different shape types. All specific shape
 * models (text boxes, pictures, charts, etc.) extend this interface.
 */
export interface PptxShapeModel {}

/**
 * Text box shape model for PowerPoint.
 *
 * Represents a text box element on a slide that contains formatted text content.
 * Text boxes are the primary way to display text in PowerPoint presentations.
 * They can have backgrounds, borders, and contain multiple paragraphs with
 * rich formatting.
 *
 * @property shape_type - String identifier indicating this is a text box shape.
 *   Typically "textbox" or similar identifier used by the export library.
 * @property margin - Optional spacing model for margins around the text box.
 *   Controls space between the text box border and its content.
 * @property fill - Optional background fill for the text box. If provided,
 *   the text box will have a colored background. If omitted, the background
 *   is transparent.
 * @property position - Required position and size model. Defines where the
 *   text box is located on the slide and its dimensions.
 * @property text_wrap - Boolean indicating whether text should wrap within
 *   the text box boundaries. If true, long lines wrap to multiple lines.
 *   If false, text may overflow or be clipped.
 * @property paragraphs - Required array of paragraph models. Contains all the
 *   text content to be displayed in the text box. Each paragraph can have
 *   its own formatting and alignment.
 */
export interface PptxTextBoxModel extends PptxShapeModel {
  shape_type: string;
  margin?: PptxSpacingModel;
  fill?: PptxFillModel;
  position: PptxPositionModel;
  text_wrap: boolean;
  paragraphs: PptxParagraphModel[];
}

/**
 * Auto-shape box model for PowerPoint.
 *
 * Represents a geometric shape (rectangle, circle, arrow, flowchart symbol,
 * etc.) that can optionally contain text. Auto-shapes are more flexible than
 * text boxes as they can be various geometric forms and can have borders,
 * shadows, and custom shapes.
 *
 * @property shape_type - String identifier indicating this is an auto-shape.
 *   Typically "autoshape" or similar identifier used by the export library.
 * @property type - Optional specific shape type from PptxShapeType enum.
 *   Determines the geometric form of the shape (rectangle, circle, arrow,
 *   flowchart symbol, etc.). If not specified, defaults to rectangle.
 * @property margin - Optional spacing model for margins around the shape.
 *   Controls space between the shape border and its content (if any).
 * @property fill - Optional background fill for the shape. Defines the
 *   background color and transparency.
 * @property stroke - Optional border/outline for the shape. Defines the
 *   border color, thickness, and opacity.
 * @property shadow - Optional drop shadow effect for the shape. Adds depth
 *   and dimension to make the shape appear elevated.
 * @property position - Required position and size model. Defines where the
 *   shape is located on the slide and its dimensions.
 * @property text_wrap - Boolean indicating whether text within the shape
 *   should wrap. Only relevant if the shape contains text paragraphs.
 * @property border_radius - Optional corner radius in points for rounded
 *   rectangles. Creates rounded corners on rectangular shapes. Value of 0
 *   or undefined means sharp corners.
 * @property paragraphs - Optional array of paragraph models. Allows the shape
 *   to contain text content. If provided, text is displayed inside the shape.
 */
export interface PptxAutoShapeBoxModel extends PptxShapeModel {
  shape_type: string;
  type?: PptxShapeType;
  margin?: PptxSpacingModel;
  fill?: PptxFillModel;
  stroke?: PptxStrokeModel;
  shadow?: PptxShadowModel;
  position: PptxPositionModel;
  text_wrap: boolean;
  border_radius?: number;
  paragraphs?: PptxParagraphModel[];
}

/**
 * Picture box model for images in PowerPoint.
 *
 * Represents an image element on a slide. Images can be displayed with various
 * cropping, masking, and styling options. Supports both local files and
 * network URLs.
 *
 * @property shape_type - String identifier indicating this is a picture box.
 *   Typically "picture" or similar identifier used by the export library.
 * @property position - Required position and size model. Defines where the
 *   image is located on the slide and its display dimensions.
 * @property margin - Optional spacing model for margins around the image.
 *   Controls space between the image container border and the image itself.
 * @property clip - Boolean indicating whether the image should be clipped to
 *   the container boundaries. If true, parts of the image outside the container
 *   are hidden. If false, the image may overflow.
 * @property opacity - Optional opacity value ranging from 0.0 (transparent)
 *   to 1.0 (opaque). Controls the transparency of the entire image.
 * @property invert - Optional boolean to invert image colors. If true, creates
 *   a negative/inverted color effect.
 * @property border_radius - Optional array of corner radius values [top-left,
 *   top-right, bottom-right, bottom-left] in points. Creates rounded corners
 *   on the image container. Can be a single number (applied to all corners)
 *   or an array of four values for individual corner control.
 * @property shape - Optional shape enum to clip the image into a specific
 *   geometric form (rectangle or circle). Creates a mask effect.
 * @property object_fit - Optional object-fit model controlling how the image
 *   is resized and positioned within its container. Includes focus point for
 *   intelligent cropping.
 * @property picture - Required picture model containing the image source
 *   information (path/URL and network flag).
 */
export interface PptxPictureBoxModel extends PptxShapeModel {
  shape_type: string;
  position: PptxPositionModel;
  margin?: PptxSpacingModel;
  clip: boolean;
  opacity?: number;
  invert?: boolean;
  border_radius?: number[];
  shape?: PptxBoxShapeEnum;
  object_fit?: PptxObjectFitModel;
  picture: PptxPictureModel;
}

/**
 * Connector line model for PowerPoint.
 *
 * Represents a connector line used to link shapes together, commonly used
 * in flowcharts, organizational charts, and diagrams. Connectors automatically
 * adjust their path to connect shape connection points.
 *
 * @property shape_type - String identifier indicating this is a connector.
 *   Typically "connector" or similar identifier used by the export library.
 * @property type - Optional connector type from PptxConnectorType enum.
 *   Determines the visual style (straight, elbow, curved). If not specified,
 *   defaults to straight.
 * @property position - Required position and size model. Defines the bounding
 *   box of the connector. The actual line path is calculated based on the
 *   connected shapes' positions.
 * @property thickness - Required line thickness in points. Controls how thick
 *   the connector line appears. Typical values are 1-5pt.
 * @property color - Required line color as a hex string (e.g., "#000000")
 *   or PowerPoint color name.
 * @property opacity - Required opacity value ranging from 0.0 (transparent)
 *   to 1.0 (opaque). Controls the transparency of the connector line.
 */
export interface PptxConnectorModel extends PptxShapeModel {
  shape_type: string;
  type?: PptxConnectorType;
  position: PptxPositionModel;
  thickness: number;
  color: string;
  opacity: number;
}

/**
 * Chart type identifiers supported by pptxgenjs library.
 *
 * Defines all available chart types that can be created in PowerPoint
 * presentations. Each chart type has a specific use case and data
 * structure requirements.
 *
 * @property BAR - Vertical bar chart. Used for comparing values across
 *   categories. Bars extend upward from the X-axis.
 * @property BAR_STACKED - Stacked vertical bar chart. Multiple data series
 *   are stacked on top of each other in each bar.
 * @property LINE - Line chart. Used to show trends over time or continuous
 *   data. Points are connected by lines.
 * @property LINE_STACKED - Stacked line chart. Multiple data series are
 *   stacked, showing cumulative values.
 * @property PIE - Pie chart. Used to show proportions of a whole. Displays
 *   data as slices of a circle.
 * @property DOUGHNUT - Doughnut chart. Similar to pie chart but with a hole
 *   in the center. Can display multiple data series as concentric rings.
 * @property AREA - Area chart. Similar to line chart but the area under the
 *   line is filled. Shows cumulative values over time.
 * @property AREA_STACKED - Stacked area chart. Multiple data series are
 *   stacked, showing cumulative values with filled areas.
 * @property SCATTER - Scatter plot. Used to show relationships between two
 *   variables. Each point represents one data observation.
 * @property BUBBLE - Bubble chart. Extension of scatter plot where point
 *   size represents a third variable. Shows relationships between three
 *   variables.
 * @property RADAR - Radar/spider chart. Used to compare multiple variables
 *   for different categories. Data is plotted on axes arranged in a circle.
 */
export enum PptxChartType {
  AREA = "area",
  AREA_STACKED = "area-stacked",
  BAR = "bar",
  BAR_STACKED = "bar-stacked",
  LINE = "line",
  LINE_STACKED = "line-stacked",
  PIE = "pie",
  DOUGHNUT = "doughnut",
  SCATTER = "scatter",
  BUBBLE = "bubble",
  RADAR = "radar",
}

/**
 * Data point structure for chart data.
 *
 * Represents a single data point in a chart. Used primarily for pie charts
 * and other chart types where individual data points need names and values.
 *
 * @property name - Label for this data point. Displayed in the legend, on
 *   data labels, or on chart axes.
 * @property value - Numerical value for this data point. The actual number
 *   that will be plotted or displayed.
 * @property color - Optional color for this specific data point. If provided,
 *   overrides the default color scheme for this point. Hex color string.
 */
export interface PptxChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

/**
 * Data series structure for charts in PowerPoint.
 *
 * Represents a complete data series in a chart. Charts can contain multiple
 * series (e.g., "2023 Revenue" and "2024 Revenue" as separate series in a
 * bar chart). Each series has its own set of labels and values.
 *
 * @property name - Name of this data series. Displayed in the legend to
 *   identify this series (e.g., "Q1 Sales", "Product A").
 * @property labels - Array of category labels for the X-axis. These are the
 *   categories or time periods being compared (e.g., ["Jan", "Feb", "Mar"]
 *   or ["Product 1", "Product 2", "Product 3"]).
 * @property values - Array of numerical values corresponding to each label.
 *   Must have the same length as the labels array. Each value is plotted at
 *   the corresponding label position.
 * @property color - Optional color for this entire series. If provided,
 *   all data points in this series use this color. Hex color string.
 *
 * @example
 * ```typescript
 * const salesSeries: PptxChartSeries = {
 *   name: "2024 Sales",
 *   labels: ["Q1", "Q2", "Q3", "Q4"],
 *   values: [100000, 150000, 180000, 200000],
 *   color: "#4CAF50"
 * };
 * ```
 */
export interface PptxChartSeries {
  name: string;
  labels: string[];
  values: number[];
  color?: string;
}

/**
 * Chart configuration options for PowerPoint charts.
 *
 * Defines all customizable aspects of chart appearance and behavior. These
 * options control titles, legends, axes, grid lines, colors, and chart-specific
 * styling options.
 *
 * @property title - Optional chart title text. Displayed above the chart
 *   to describe what the chart shows.
 * @property titleFontSize - Optional font size in points for the chart title.
 *   If not specified, uses default title font size.
 * @property titleColor - Optional color for the chart title. Hex color string.
 * @property showLegend - Whether to display the legend. Legends show the
 *   names of data series. Defaults to true if not specified.
 * @property legendPos - Optional legend position. "b" (bottom), "t" (top),
 *   "l" (left), "r" (right), "tr" (top-right). Defaults to bottom if not
 *   specified.
 * @property showDataLabels - Whether to show data labels on chart elements
 *   (bars, points, slices, etc.). Data labels display the actual values.
 * @property dataLabelPosition - Optional position for data labels relative
 *   to chart elements. "outEnd" (outside end), "inEnd" (inside end), "ctr"
 *   (center), "inBase" (inside base).
 * @property showValue - Whether data labels should show the actual numerical
 *   value. Used with showDataLabels.
 * @property showPercent - Whether data labels should show percentages (for
 *   pie/doughnut charts). Used with showDataLabels.
 * @property showCatAxisTitle - Whether to show the category axis (X-axis)
 *   title. Category axis typically shows the categories being compared.
 * @property catAxisTitle - Text for the category axis title. Describes what
 *   the categories represent (e.g., "Quarter", "Product Category").
 * @property showValAxisTitle - Whether to show the value axis (Y-axis) title.
 *   Value axis typically shows the units or scale of the values.
 * @property valAxisTitle - Text for the value axis title. Describes what the
 *   values represent (e.g., "Revenue ($)", "Number of Users").
 * @property catGridLine - Optional grid line styling for category axis.
 *   Controls whether and how grid lines appear along the category axis.
 * @property valGridLine - Optional grid line styling for value axis.
 *   Controls whether and how grid lines appear along the value axis.
 * @property chartColors - Optional array of hex color strings defining the
 *   color scheme for the chart. If not provided, uses default PowerPoint
 *   color scheme.
 * @property barGapWidthPct - Optional gap width percentage between bar groups
 *   in bar charts. Value between 0-100. Larger values create more space
 *   between groups of bars.
 * @property barDir - Bar direction for bar charts. "bar" creates horizontal
 *   bars, "col" (column) creates vertical bars. Defaults to "col" if not
 *   specified.
 * @property lineSmooth - Whether line charts should use smooth curves instead
 *   of straight segments between points. Creates a curved line appearance.
 * @property lineDataSymbol - Symbol style for data points in line charts.
 *   "none" (no symbols), "circle", "square", "diamond". Symbols mark each
 *   data point on the line.
 * @property fill - Optional fill color or gradient for area charts. Defines
 *   the color of the filled area under the line. Can be a solid color (hex
 *   string) or gradient definition.
 */
export interface PptxChartOptions {
  title?: string;
  titleFontSize?: number;
  titleColor?: string;
  showLegend?: boolean;
  legendPos?: "b" | "t" | "l" | "r" | "tr";
  showDataLabels?: boolean;
  dataLabelPosition?: "outEnd" | "inEnd" | "ctr" | "inBase";
  showValue?: boolean;
  showPercent?: boolean;
  showCatAxisTitle?: boolean;
  catAxisTitle?: string;
  showValAxisTitle?: boolean;
  valAxisTitle?: string;
  catGridLine?: { style?: "none" | "solid" | "dash"; color?: string };
  valGridLine?: { style?: "none" | "solid" | "dash"; color?: string };
  chartColors?: string[];
  barGapWidthPct?: number;
  barDir?: "bar" | "col"; // 'bar' for horizontal, 'col' for vertical (default)
  lineSmooth?: boolean;
  lineDataSymbol?: "none" | "circle" | "square" | "diamond";
  fill?: string; // For area charts - gradient or solid fill
}

/**
 * Chart shape model for PowerPoint.
 *
 * Represents a chart/graph element on a slide. Charts visualize numerical
 * data in various formats (bar charts, line charts, pie charts, etc.).
 * PowerPoint supports native chart rendering with full editing capabilities.
 *
 * @property shape_type - Must be the literal string "chart". Identifies this
 *   as a chart shape type.
 * @property chartType - Required chart type from PptxChartType enum. Determines
 *   the visual style and data structure of the chart (bar, line, pie, etc.).
 * @property position - Required position and size model. Defines where the
 *   chart is located on the slide and its dimensions.
 * @property data - Required array of chart series. Contains all the data to
 *   be displayed in the chart. Each series represents one set of related
 *   data points (e.g., one year's sales data).
 * @property options - Optional chart configuration options. Controls titles,
 *   legends, axes, colors, and other chart appearance settings. If not
 *   provided, uses default PowerPoint chart styling.
 */
export interface PptxChartModel extends PptxShapeModel {
  shape_type: "chart";
  chartType: PptxChartType;
  position: PptxPositionModel;
  data: PptxChartSeries[];
  options?: PptxChartOptions;
}

/**
 * Individual cell model for PowerPoint tables.
 *
 * Represents a single cell within a table. Cells can contain text with
 * formatting and can span multiple rows or columns.
 *
 * @property text - Text content of the cell. Can be plain text or formatted
 *   text. Required field.
 * @property font - Optional partial font model. Allows individual cells to
 *   have different font styling than the table default. Only specified
 *   properties override the default.
 * @property fill - Optional background fill for the cell. Colors the cell
 *   background, useful for header rows or highlighting specific cells.
 * @property align - Optional horizontal text alignment within the cell.
 *   "left", "center", or "right". Defaults to left if not specified.
 * @property valign - Optional vertical text alignment within the cell.
 *   "top", "middle", or "bottom". Defaults to middle if not specified.
 * @property colspan - Optional number of columns this cell spans. Defaults
 *   to 1. Used to create merged cells that span multiple columns.
 * @property rowspan - Optional number of rows this cell spans. Defaults to
 *   1. Used to create merged cells that span multiple rows.
 */
export interface PptxTableCell {
  text: string;
  font?: Partial<PptxFontModel>;
  fill?: PptxFillModel;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  colspan?: number;
  rowspan?: number;
}

/**
 * Table row model for PowerPoint tables.
 *
 * Represents a single row within a table. Rows contain cells and can have
 * a custom height.
 *
 * @property cells - Required array of table cells. Each cell represents one
 *   column in the row. All rows should have the same number of cells (or
 *   account for colspan) to maintain table structure.
 * @property height - Optional row height in points. If not specified, the
 *   row height is automatically calculated based on content or uses default
 *   height.
 */
export interface PptxTableRow {
  cells: PptxTableCell[];
  height?: number;
}

/**
 * Table styling options for PowerPoint tables.
 *
 * Defines default styling that applies to all cells in the table unless
 * overridden by individual cell properties. Provides a way to set consistent
 * styling across the entire table.
 *
 * @property colWidths - Optional array of column widths in points. Each
 *   value corresponds to one column. If not specified, columns are evenly
 *   distributed across the table width.
 * @property rowHeights - Optional array of row heights in points. Each
 *   value corresponds to one row. If not specified, rows use automatic
 *   height based on content.
 * @property border - Optional border styling for all table cells. Defines
 *   border thickness in points and color. Applied uniformly to all cell
 *   borders.
 * @property fill - Optional default background fill color for table cells.
 *   Hex color string. Can be overridden by individual cell fill properties.
 * @property fontFace - Optional default font family for table text. Applied
 *   to all cells unless overridden by cell-specific font properties.
 * @property fontSize - Optional default font size in points for table text.
 *   Applied to all cells unless overridden by cell-specific font properties.
 * @property color - Optional default text color for table cells. Hex color
 *   string. Applied to all cells unless overridden by cell-specific font
 *   properties.
 * @property align - Optional default horizontal text alignment for all cells.
 *   "left", "center", or "right". Can be overridden by individual cell
 *   alignment properties.
 * @property valign - Optional default vertical text alignment for all cells.
 *   "top", "middle", or "bottom". Can be overridden by individual cell
 *   alignment properties.
 */
export interface PptxTableOptions {
  colWidths?: number[];
  rowHeights?: number[];
  border?: { pt?: number; color?: string };
  fill?: string;
  fontFace?: string;
  fontSize?: number;
  color?: string;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
}

/**
 * Table shape model for PowerPoint.
 *
 * Represents a table element on a slide. Tables display data in a grid
 * format with rows and columns. Useful for presenting structured data,
 * comparisons, or organized information.
 *
 * @property shape_type - Must be the literal string "table". Identifies this
 *   as a table shape type.
 * @property position - Required position and size model. Defines where the
 *   table is located on the slide and its overall dimensions.
 * @property rows - Required array of table rows. Each row contains cells
 *   that make up the table structure. The table is built row by row.
 * @property options - Optional table styling options. Defines default styling
 *   for all cells, column widths, row heights, and borders. Individual cells
 *   can override these defaults.
 *
 * @example
 * ```typescript
 * const table: PptxTableModel = {
 *   shape_type: "table",
 *   position: { left: 100, top: 100, width: 500, height: 200 },
 *   rows: [
 *     { cells: [
 *       { text: "Product", fill: { color: "#333", opacity: 1 } },
 *       { text: "Sales", fill: { color: "#333", opacity: 1 } }
 *     ]},
 *     { cells: [
 *       { text: "Widget A" },
 *       { text: "$10,000" }
 *     ]}
 *   ],
 *   options: {
 *     colWidths: [250, 250],
 *     border: { pt: 1, color: "#000" }
 *   }
 * };
 * ```
 */
export interface PptxTableModel extends PptxShapeModel {
  shape_type: "table";
  position: PptxPositionModel;
  rows: PptxTableRow[];
  options?: PptxTableOptions;
}

/**
 * Complete slide model for PowerPoint.
 *
 * Represents a single slide in a PowerPoint presentation. Contains all
 * shapes, text, images, charts, and other elements that appear on the slide,
 * along with slide-level properties like background and speaker notes.
 *
 * @property background - Optional background fill for the slide. Defines a
 *   solid color background. If both background and backgroundImage are provided,
 *   backgroundImage takes precedence.
 * @property backgroundImage - Optional background image URL or path. Sets an
 *   image as the slide background. The image is stretched to fill the entire
 *   slide. Takes precedence over background fill if both are provided.
 * @property shapes - Required array of all shapes on the slide. Can contain
 *   any combination of text boxes, auto-shapes, connectors, picture boxes,
 *   charts, and tables. Shapes are rendered in array order (later shapes
 *   appear on top of earlier ones).
 * @property note - Optional speaker notes text. Contains additional information,
 *   talking points, or reminders for the presenter. Not displayed on the slide
 *   itself but visible in presenter mode and PowerPoint's notes view.
 */
export interface PptxSlideModel {
  background?: PptxFillModel;
  backgroundImage?: string;
  shapes: (
    | PptxTextBoxModel
    | PptxAutoShapeBoxModel
    | PptxConnectorModel
    | PptxPictureBoxModel
    | PptxChartModel
    | PptxTableModel
  )[];
  note?: string;
}

/**
 * Complete presentation model for PowerPoint export.
 *
 * Top-level structure representing an entire PowerPoint presentation. Contains
 * metadata about the presentation and an array of all slides. This is the
 * structure used when exporting slides to PPTX format.
 *
 * @property name - Optional presentation name/title. Used as the file name or
 *   document title when exporting. If not provided, a default name is used.
 * @property shapes - Optional array of shapes that appear on all slides
 *   (master slide shapes). These are typically logos, headers, footers, or
 *   other elements that should appear on every slide. If not provided, only
 *   slide-specific shapes are included.
 * @property slides - Required array of slide models. Contains all slides in
 *   the presentation in order. The order of slides in this array determines
 *   the presentation order.
 */
export interface PptxPresentationModel {
  name?: string;
  shapes?: PptxShapeModel[];
  slides: PptxSlideModel[];
}

/**
 * Creates a spacing model with equal spacing on all sides.
 *
 * Utility function to quickly create a PptxSpacingModel where all four sides
 * (top, bottom, left, right) have the same spacing value. Useful for creating
 * uniform margins or padding.
 *
 * @param num - Spacing value in points to apply to all four sides.
 * @returns A PptxSpacingModel object with all sides set to the specified value.
 *
 * @example
 * ```typescript
 * const margin = createPptxSpacingAll(10);
 * // Returns: { top: 10, bottom: 10, left: 10, right: 10 }
 * ```
 */
export const createPptxSpacingAll = (num: number): PptxSpacingModel => ({
  top: num,
  left: num,
  bottom: num,
  right: num,
});

/**
 * Creates a position model for a text box with default height.
 *
 * Utility function to create a PptxPositionModel specifically for text boxes.
 * Sets a default height of 100 points, which is a common default for text
 * boxes. The height can be adjusted later if needed.
 *
 * @param left - Horizontal position in points from the left edge of the slide.
 * @param top - Vertical position in points from the top edge of the slide.
 * @param width - Width of the text box in points.
 * @returns A PptxPositionModel with the specified position and width, and a
 *   default height of 100 points.
 *
 * @example
 * ```typescript
 * const textBoxPos = createPptxPositionForTextbox(100, 50, 400);
 * // Returns: { left: 100, top: 50, width: 400, height: 100 }
 * ```
 */
export const createPptxPositionForTextbox = (
  left: number,
  top: number,
  width: number,
): PptxPositionModel => ({
  left,
  top,
  width,
  height: 100,
});

/**
 * Converts a position model to an array of point values.
 *
 * Utility function that extracts position and size values into a simple
 * array format [left, top, width, height]. Useful when passing position
 * data to functions that expect an array format.
 *
 * @param position - Position model to convert.
 * @returns Array of four numbers: [left, top, width, height] in points.
 *
 * @example
 * ```typescript
 * const pos = { left: 100, top: 50, width: 400, height: 200 };
 * const arr = positionToPtList(pos);
 * // Returns: [100, 50, 400, 200]
 * ```
 */
export const positionToPtList = (position: PptxPositionModel): number[] => {
  return [position.left, position.top, position.width, position.height];
};

/**
 * Converts a position model to an array of corner coordinates.
 *
 * Utility function that converts position and size into corner coordinates
 * in the format [left, top, right, bottom]. The right and bottom values are
 * calculated by adding width and height to the left and top positions.
 * Useful for calculations involving bounding boxes or collision detection.
 *
 * @param position - Position model to convert.
 * @returns Array of four numbers: [left, top, right, bottom] in points,
 *   where right = left + width and bottom = top + height.
 *
 * @example
 * ```typescript
 * const pos = { left: 100, top: 50, width: 400, height: 200 };
 * const corners = positionToPtXyxy(pos);
 * // Returns: [100, 50, 500, 250]
 * //          (left, top, right, bottom)
 * ```
 */
export const positionToPtXyxy = (position: PptxPositionModel): number[] => {
  const left = position.left;
  const top = position.top;
  const width = position.width;
  const height = position.height;

  return [left, top, left + width, top + height];
};
