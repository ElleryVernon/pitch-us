/**
 * Global type declarations for the application.
 *
 * This file contains type definitions that extend the global scope. These
 * types are available throughout the application without explicit imports.
 * Used for types that need to be globally accessible or for extending
 * third-party library types.
 */

/**
 * Properties structure for shape elements in custom slide layouts.
 *
 * Defines the structure for shape elements that can be used in dynamically
 * compiled slide layouts. Used by the layout compilation system to provide
 * type-safe access to shape properties within custom layout code.
 *
 * This interface is available globally for use in custom layout templates
 * without explicit imports.
 *
 * @property id - Unique identifier string for the shape. Used to reference
 *   and manipulate the shape within the layout.
 * @property type - Shape type identifier. Determines the geometric form of
 *   the shape: "rectangle" (rectangular shape), "circle" (circular shape),
 *   or "line" (line connector).
 * @property position - Position coordinates object. Defines where the shape
 *   is located on the slide.
 * @property position.x - Horizontal position in pixels from the left edge.
 * @property position.y - Vertical position in pixels from the top edge.
 * @property size - Size dimensions object. Defines the shape's dimensions.
 * @property size.width - Width of the shape in pixels.
 * @property size.height - Height of the shape in pixels.
 *
 * @remarks
 * Additional properties may be added as needed for extended shape functionality.
 * This is a base interface that can be extended for specific shape types.
 */
interface ShapeProps {
  id: string;
  type: "rectangle" | "circle" | "line";
  position: { x: number; y: number };
  size: { width: number; height: number };
  // Add other properties as needed
}

/**
 * Properties structure for text frame elements in custom slide layouts.
 *
 * Defines the structure for text frame elements that can be used in dynamically
 * compiled slide layouts. Used by the layout compilation system to provide
 * type-safe access to text frame properties within custom layout code.
 *
 * This interface is available globally for use in custom layout templates
 * without explicit imports.
 *
 * @property id - Unique identifier string for the text frame. Used to reference
 *   and manipulate the text frame within the layout.
 * @property content - Text content to be displayed in the frame. Can be plain
 *   text or formatted content depending on the layout implementation.
 * @property position - Position coordinates object. Defines where the text
 *   frame is located on the slide.
 * @property position.x - Horizontal position in pixels from the left edge.
 * @property position.y - Vertical position in pixels from the top edge.
 *
 * @remarks
 * Additional properties may be added as needed for extended text frame
 * functionality. This is a base interface that can be extended for specific
 * text frame types.
 */
interface TextFrameProps {
  id: string;
  content: string;
  position: { x: number; y: number };
  // Add other properties as needed
}
