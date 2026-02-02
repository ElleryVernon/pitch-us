/**
 * Type definitions for slide content, structure, and visual elements.
 *
 * This module defines the core data structures used to represent slides and
 * their content throughout the application. These types are used for:
 * - Storing slide data in the database
 * - Rendering slides in the UI
 * - Converting slides to PowerPoint format
 * - Managing slide content editing
 */

/**
 * Text style classification for slide content.
 *
 * Defines the semantic level of text elements within a slide. Used to apply
 * consistent typography styling and determine text hierarchy. The values
 * correspond to standard presentation text styles.
 *
 * @example
 * ```typescript
 * const titleStyle: TextType = "title";
 * const bodyStyle: TextType = "normal text";
 * ```
 */
export type TextType =
  | "title"
  | "heading 1"
  | "heading 2"
  | "heading 3"
  | "heading 4"
  | "normal text";

/**
 * Typography properties for text rendering.
 *
 * Defines the visual appearance of text elements. Used by the rendering
 * engine to apply consistent typography across slides and ensure proper
 * text layout and readability.
 *
 * @property fontSize - Font size in pixels. Typical values range from 12px
 *   for body text to 48px+ for titles.
 * @property lineHeight - Line height as a unitless multiplier (e.g., 1.5)
 *   or pixel value. Controls vertical spacing between lines of text.
 * @property fontWeight - CSS font-weight value as a string (e.g., "400",
 *   "600", "bold"). Controls the thickness/boldness of the text.
 */
export interface TextSize {
  fontSize: number;
  lineHeight: number;
  fontWeight: string;
}

/**
 * Data point structure for charts and graphs.
 *
 * Represents a single data point in a chart visualization. Used to store
 * numerical data with labels for display in various chart types.
 *
 * @property label - Text label displayed for this data point (e.g., "Q1 2024",
 *   "Product A"). Shown on the chart axis or in tooltips.
 * @property value - Numerical value for this data point. The actual number
 *   that will be plotted on the chart.
 * @property color - Optional hex color code (e.g., "#FF5733") for this specific
 *   data point. If not provided, the chart will use default color schemes.
 */
export interface GraphDataPoint {
  label: string;
  value: number;
  color?: string;
}

/**
 * Complete chart/graph data structure for slide visualizations.
 *
 * Defines the structure for displaying charts and graphs within slides.
 * Supports multiple chart types including bar charts, line charts, pie charts,
 * area charts, and scatter plots. This data is used by the chart rendering
 * components to generate visual data representations.
 *
 * @property type - Chart type identifier. Determines how the data will be
 *   visualized. Supported types: "bar", "line", "pie", "area", "scatter".
 *   Can also accept custom string values for extended chart types.
 * @property title - Optional title text displayed above the chart. Provides
 *   context about what the chart represents.
 * @property data - Array of GraphDataPoint objects containing the actual data
 *   to be plotted. Each point represents one value in the chart.
 * @property xAxis - Optional label for the X-axis. Describes what the horizontal
 *   axis represents (e.g., "Quarter", "Product Category").
 * @property yAxis - Optional label for the Y-axis. Describes what the vertical
 *   axis represents (e.g., "Revenue ($)", "Number of Users").
 *
 * @example
 * ```typescript
 * const revenueChart: GraphData = {
 *   type: "bar",
 *   title: "Quarterly Revenue",
 *   data: [
 *     { label: "Q1", value: 100000 },
 *     { label: "Q2", value: 150000 },
 *     { label: "Q3", value: 180000 }
 *   ],
 *   xAxis: "Quarter",
 *   yAxis: "Revenue ($)"
 * };
 * ```
 */
export interface GraphData {
  type: "bar" | "line" | "pie" | "area" | "scatter" | string;
  title?: string;
  data: GraphDataPoint[];
  xAxis?: string;
  yAxis?: string;
}

/**
 * Node structure for diagram visualizations.
 *
 * Represents a single node (element) in a diagram. Nodes are the building
 * blocks of flowcharts, mind maps, organizational charts, and other diagram
 * types. Each node has a unique identifier and a label for display.
 *
 * @property id - Unique identifier string for this node. Used to reference
 *   the node when creating edges/connections between nodes.
 * @property label - Text label displayed inside or next to the node. The
 *   primary text content that describes what this node represents.
 * @property type - Optional node type identifier. Can specify different
 *   visual styles or behaviors for different node types (e.g., "decision",
 *   "process", "start", "end" in flowcharts).
 */
export interface DiagramNode {
  id: string;
  label: string;
  type?: string;
}

/**
 * Edge structure for connecting diagram nodes.
 *
 * Represents a connection or relationship between two nodes in a diagram.
 * Used to create flowcharts, organizational charts, and other connected
 * diagram types. Edges define the visual lines/arrows between nodes.
 *
 * @property from - ID of the source node where the edge originates. Must
 *   match the `id` property of an existing DiagramNode.
 * @property to - ID of the target node where the edge terminates. Must match
 *   the `id` property of an existing DiagramNode.
 * @property label - Optional text label displayed along the edge. Used to
 *   describe the relationship or connection between nodes (e.g., "yes", "no",
 *   "leads to").
 */
export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

/**
 * Complete diagram data structure for slide visualizations.
 *
 * Defines the structure for displaying various types of diagrams within slides,
 * including flowcharts, tree diagrams, mind maps, and timelines. Diagrams can
 * be represented either as node-edge graphs or as simple item lists depending
 * on the diagram type.
 *
 * @property type - Diagram type identifier. Determines the visual layout and
 *   rendering style. Supported types: "flowchart", "tree", "mindmap", "timeline".
 *   Can also accept custom string values for extended diagram types.
 * @property nodes - Optional array of DiagramNode objects. Used for graph-based
 *   diagrams (flowcharts, trees) where nodes are connected by edges. Each node
 *   represents an element in the diagram.
 * @property edges - Optional array of DiagramEdge objects. Used together with
 *   nodes to define connections between diagram elements. Only relevant for
 *   graph-based diagram types.
 * @property items - Optional array of simple item objects. Used for list-based
 *   diagrams (timelines, simple hierarchies) where items don't need complex
 *   node-edge relationships. Each item has a label and optional description.
 *
 * @example
 * ```typescript
 * // Flowchart example
 * const flowchart: DiagramData = {
 *   type: "flowchart",
 *   nodes: [
 *     { id: "start", label: "Start", type: "start" },
 *     { id: "process", label: "Process Data", type: "process" }
 *   ],
 *   edges: [
 *     { from: "start", to: "process", label: "begin" }
 *   ]
 * };
 *
 * // Timeline example
 * const timeline: DiagramData = {
 *   type: "timeline",
 *   items: [
 *     { label: "2024 Q1", description: "Product Launch" },
 *     { label: "2024 Q2", description: "Market Expansion" }
 *   ]
 * };
 * ```
 */
export interface DiagramData {
  type: "flowchart" | "tree" | "mindmap" | "timeline" | string;
  nodes?: DiagramNode[];
  edges?: DiagramEdge[];
  items?: Array<{ label: string; description?: string }>;
}

/**
 * Individual item structure for infographic visualizations.
 *
 * Represents a single element in an infographic display. Infographics are
 * used to present information in a visually engaging way, often combining
 * icons, numbers, and text to convey key metrics or concepts.
 *
 * @property title - Optional heading text for this infographic item. Provides
 *   a brief label or category name.
 * @property value - Optional primary value to display. Can be a string (e.g.,
 *   "$1M", "95%") or a number that will be formatted for display. This is
 *   typically the most prominent element in the infographic item.
 * @property description - Optional explanatory text providing context or
 *   additional details about the value or title.
 * @property icon - Optional icon identifier or URL. Used to display a visual
 *   icon alongside the text content. Can be an icon name from an icon library
 *   or a URL to an image file.
 */
export interface InfographicItem {
  title?: string;
  value?: string | number;
  description?: string;
  icon?: string;
}

/**
 * Complete infographic data structure for slide visualizations.
 *
 * Defines the structure for displaying infographics within slides. Infographics
 * are visual representations of information that combine icons, numbers, and
 * text to present data in an engaging and easy-to-understand format. Supports
 * various infographic types including statistics displays, process flows,
 * comparisons, and simple lists.
 *
 * @property type - Infographic type identifier. Determines the layout and
 *   visual style of the infographic. Supported types: "stats" (statistics
 *   cards), "process" (step-by-step process), "comparison" (side-by-side
 *   comparison), "list" (simple item list). Can also accept custom string
 *   values for extended infographic types.
 * @property items - Array of InfographicItem objects. Contains all the data
 *   points to be displayed in the infographic. Each item represents one
 *   element (statistic, step, comparison point, etc.) in the visualization.
 *
 * @example
 * ```typescript
 * const statsInfographic: InfographicsData = {
 *   type: "stats",
 *   items: [
 *     { title: "Users", value: "10K", description: "Active monthly users" },
 *     { title: "Revenue", value: "$1M", description: "Annual recurring revenue" }
 *   ]
 * };
 * ```
 */
export interface InfographicsData {
  type: "stats" | "process" | "comparison" | "list" | string;
  items: InfographicItem[];
}

/**
 * Focus point coordinates for image cropping and positioning.
 *
 * Represents a point within an image that should be kept in focus when the
 * image is cropped or resized. Used with object-fit "cover" mode to ensure
 * important parts of images remain visible after cropping.
 *
 * Coordinates are typically normalized (0.0 to 1.0) where (0, 0) is the
 * top-left corner and (1, 1) is the bottom-right corner, or in pixel coordinates
 * depending on the context.
 *
 * @property x - Horizontal position of the focus point. In normalized coordinates,
 *   ranges from 0.0 (left edge) to 1.0 (right edge).
 * @property y - Vertical position of the focus point. In normalized coordinates,
 *   ranges from 0.0 (top edge) to 1.0 (bottom edge).
 */
export interface FocusPoint {
  x: number;
  y: number;
}

/**
 * Visual properties for image positioning, sizing, and transformation.
 *
 * Defines how images are displayed and positioned within slides. Used by the
 * slide editor to store user adjustments to image placement, size, rotation,
 * and cropping behavior. These properties are persisted with slide data and
 * applied during rendering.
 *
 * @property x - Horizontal position offset in pixels. Defines how far the image
 *   is shifted from its default position. Positive values move right, negative
 *   values move left.
 * @property y - Vertical position offset in pixels. Defines how far the image
 *   is shifted from its default position. Positive values move down, negative
 *   values move up.
 * @property width - Display width of the image in pixels. If not specified,
 *   the image uses its natural width or container width.
 * @property height - Display height of the image in pixels. If not specified,
 *   the image uses its natural height or container height.
 * @property scale - Uniform scaling factor. Multiplies both width and height
 *   proportionally. Values > 1.0 enlarge the image, values < 1.0 shrink it.
 *   Applied after width/height if both are specified.
 * @property rotation - Rotation angle in degrees. Positive values rotate clockwise,
 *   negative values rotate counter-clockwise. Range is typically -360 to 360.
 * @property objectFit - CSS object-fit behavior for the image. Controls how the
 *   image is resized to fit its container: "cover" (fills container, may crop),
 *   "contain" (fits entirely within container), "fill" (stretches to fill),
 *   "none" (uses natural size).
 * @property initialObjectFit - Original object-fit value before user modifications.
 *   Stored to allow resetting to the original state. Used by the editor's reset
 *   functionality.
 * @property initialFocusPoint - Original focus point coordinates before user
 *   modifications. Stored to allow resetting cropping behavior. Used when the
 *   user wants to revert image positioning changes.
 */
export interface ImageProperties {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scale?: number;
  rotation?: number;
  objectFit?: "cover" | "contain" | "fill" | "none";
  initialObjectFit?: string;
  initialFocusPoint?: FocusPoint;
}

/**
 * Mapping of image properties by item index within a slide.
 *
 * Stores image positioning and styling properties for multiple images within
 * a single slide. The key is the zero-based index of the image item in the
 * slide's image array, and the value contains all the visual properties for
 * that specific image.
 *
 * This structure allows each image in a slide to have independent positioning
 * and styling while keeping all properties organized in a single object.
 *
 * @example
 * ```typescript
 * const slideProps: SlideProperties = {
 *   0: { x: 10, y: 20, width: 300, objectFit: "cover" }, // First image
 *   1: { x: 50, y: 100, rotation: 45, scale: 1.2 }      // Second image
 * };
 * ```
 */
export type SlideProperties = Record<number, ImageProperties>;

/**
 * Content structure for a slide's main content area.
 *
 * Defines all the content elements that can appear within a slide, including
 * text, visualizations, images, and icons. This structure is flexible and
 * supports various slide types with different content combinations. The content
 * is generated by the LLM based on slide outlines and can be edited by users.
 *
 * @property title - Main heading text for the slide. Typically displayed
 *   prominently at the top. Required field that provides the slide's primary
 *   message or topic.
 * @property body - Main body content of the slide. Can be either:
 *   - A string: Plain text or markdown-formatted content
 *   - An array of objects: Structured content with headings and descriptions,
 *     useful for lists, feature descriptions, or step-by-step content
 * @property description - Optional subtitle or additional explanatory text.
 *   Provides context or elaboration on the title. Often displayed below the
 *   title or as introductory text.
 * @property graph - Optional chart or graph data. When present, renders a
 *   data visualization (bar chart, line chart, pie chart, etc.) on the slide.
 *   Used for displaying numerical data in a visual format.
 * @property diagram - Optional diagram data. When present, renders a diagram
 *   visualization (flowchart, mind map, timeline, etc.) on the slide. Used for
 *   showing relationships, processes, or hierarchical information.
 * @property infographics - Optional infographic data. When present, renders
 *   an infographic display (statistics cards, process steps, comparisons, etc.)
 *   on the slide. Used for presenting information in a visually engaging format.
 * @property image_prompts - Optional array of image generation prompts. Each
 *   string is a text prompt that will be used to generate or fetch an image
 *   for the slide. The LLM generates these prompts based on the slide content.
 * @property icon_queries - Optional array of icon search queries. Each object
 *   contains an array of query strings used to search for and select icons
 *   relevant to the slide content. Used to add visual icons to the slide.
 * @property [key: string] - Index signature allowing additional dynamic
 *   content fields. This flexibility allows for slide-type-specific content
 *   fields that may not be defined in the base interface. Used by custom
 *   slide layouts and future content types.
 */
export interface SlideContent {
  title: string;
  body: string | Array<{ heading: string; description: string }>;
  description?: string;
  graph?: GraphData;
  diagram?: DiagramData;
  infographics?: InfographicsData;
  image_prompts?: string[];
  icon_queries?: Array<{ queries: string[] }>;
  [key: string]: unknown; // Allow additional dynamic content fields
}

/**
 * Complete slide data structure representing a single slide in a presentation.
 *
 * This is the core data structure for slides throughout the application. It
 * contains both metadata about the slide (ID, position, type) and the actual
 * content to be displayed. Slides are stored in the database, rendered in the
 * UI, and converted to PowerPoint format for export.
 *
 * @property id - Unique identifier for the slide. Generated by the database
 *   when the slide is first created. Can be null for newly created slides
 *   that haven't been saved yet. Used to reference the slide in API calls
 *   and database operations.
 * @property index - Zero-based position of this slide within the presentation.
 *   Determines the order in which slides appear. Used for navigation and
 *   slide ordering operations.
 * @property type - Numeric identifier for the slide's content type or category.
 *   Maps to specific slide templates or layouts (e.g., intro slide, problem
 *   slide, solution slide). Used by the rendering engine to select the
 *   appropriate template.
 * @property design_index - Optional index specifying which design variant
 *   to use for this slide type. Allows multiple visual designs for the same
 *   content type. Null indicates the default design should be used.
 * @property images - Optional array of image URLs or file paths. Contains
 *   references to all images displayed on this slide. Images are typically
 *   generated or uploaded based on image_prompts in the content.
 * @property properties - Optional mapping of image properties by index.
 *   Stores positioning, sizing, and styling information for each image in
 *   the images array. Used by the slide editor to persist user adjustments.
 * @property icons - Optional array of icon identifiers or URLs. Contains
 *   references to all icons displayed on this slide. Icons are selected
 *   based on icon_queries in the content.
 * @property graph_id - Optional identifier for a chart/graph associated with
 *   this slide. Used to link the slide to a specific graph visualization
 *   stored separately. May be used for complex graphs that need separate
 *   management.
 * @property presentation - Optional reference to the parent presentation ID.
 *   Used to establish the relationship between slides and presentations in
 *   the data model. May be omitted if the relationship is maintained elsewhere.
 * @property speaker_note - Optional speaker notes text. Contains additional
 *   information, talking points, or reminders for the presenter. Not displayed
 *   on the slide itself but available in presenter mode and PowerPoint exports.
 * @property layout - Optional layout identifier string. Specifies which custom
 *   layout template should be used to render this slide. Allows for custom
 *   slide designs beyond the standard templates.
 * @property layout_group - Optional layout group identifier. Used to group
 *   slides that share the same custom layout, allowing for consistent styling
 *   across multiple slides.
 * @property content - SlideContent object containing all the actual content
 *   to be displayed on the slide (text, charts, diagrams, etc.). This is the
 *   primary data that users edit and that gets rendered.
 *
 * @example
 * ```typescript
 * const slide: Slide = {
 *   id: "slide-123",
 *   index: 0,
 *   type: 1,
 *   design_index: 0,
 *   images: ["https://example.com/image.jpg"],
 *   properties: { 0: { x: 10, y: 20, objectFit: "cover" } },
 *   icons: ["icon-check"],
 *   graph_id: null,
 *   speaker_note: "Emphasize the market opportunity",
 *   content: {
 *     title: "Market Opportunity",
 *     body: "The market is worth $48B and growing...",
 *     graph: { type: "bar", data: [...] }
 *   }
 * };
 * ```
 */
export interface Slide {
  id: string | null;
  index: number;
  type: number;
  design_index: number | null;
  images: string[] | null;
  properties: SlideProperties | null;
  icons: string[] | null;
  graph_id: string | null;
  presentation?: string;
  speaker_note?: string;
  layout?: string;
  layout_group?: string;

  content: SlideContent;
}
