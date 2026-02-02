/**
 * SVG chart components for data visualization in presentation slides.
 *
 * Provides lightweight, scalable SVG chart components for rendering data
 * visualizations directly in presentation slides. These components use SVG
 * for crisp rendering at any size and are optimized for presentation use
 * cases. All charts use a 0-100 coordinate system for easy scaling.
 */

import React from "react";

/**
 * 2D point coordinate structure.
 *
 * Represents a point in 2D space with x and y coordinates, typically
 * normalized to a 0-100 range for chart rendering.
 */
type Point = { x: number; y: number };

/**
 * Clamps a value between minimum and maximum bounds.
 *
 * Ensures a numeric value stays within specified bounds. Used for preventing
 * chart values from exceeding the viewport or causing rendering issues.
 *
 * @param value - The value to clamp.
 * @param min - Minimum allowed value.
 * @param max - Maximum allowed value.
 * @returns The clamped value, guaranteed to be between min and max.
 */
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Builds point coordinates for line/area charts from data values.
 *
 * Normalizes an array of numeric values to point coordinates within a 0-100
 * coordinate system. Automatically scales values to fit the available space
 * while maintaining relative proportions. Adds padding to prevent points from
 * touching chart edges.
 *
 * @param values - Array of numeric values to convert to points. Values are
 *   normalized relative to the min/max in the array.
 * @param padding - Padding in percentage units (0-100) to add around the
 *   chart area. Defaults to 8.
 * @returns Array of Point objects with x,y coordinates in 0-100 range.
 */
const buildLinePoints = (values: number[], padding = 8): Point[] => {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step =
    values.length > 1 ? (100 - padding * 2) / (values.length - 1) : 0;
  return values.map((value, index) => ({
    x: padding + step * index,
    y: 100 - padding - ((value - min) / range) * (100 - padding * 2),
  }));
};

/**
 * Converts an array of points to an SVG polyline points string.
 *
 * Formats Point objects into the string format required by SVG polyline
 * and polygon elements: "x1,y1 x2,y2 x3,y3 ..."
 *
 * @param points - Array of Point objects to convert.
 * @returns Space-separated string of "x,y" coordinate pairs.
 */
const pointsToString = (points: Point[]) =>
  points.map((p) => `${p.x},${p.y}`).join(" ");

/**
 * Props for the SvgLineChart component.
 *
 * @property values - Array of numeric values to plot. Values are normalized
 *   and displayed as a connected line.
 * @property stroke - CSS color string for the line stroke.
 * @property strokeWidth - Width of the line in SVG units. Defaults to 2.
 * @property gridColor - Color for optional grid lines. Set to "transparent"
 *   to hide grid. Defaults to "transparent".
 */
export const SvgLineChart: React.FC<{
  values: number[];
  stroke: string;
  strokeWidth?: number;
  gridColor?: string;
}> = ({ values, stroke, strokeWidth = 2, gridColor = "transparent" }) => {
  /**
   * SVG line chart component.
   *
   * Renders a simple line chart connecting data points with a smooth line.
   * Values are automatically normalized to fit the chart area. Includes
   * optional grid lines for reference. The chart scales responsively to
   * fill its container.
   *
   * @param values - Array of numeric values to plot.
   * @param stroke - Color for the line.
   * @param strokeWidth - Line width. Defaults to 2.
   * @param gridColor - Grid line color. Defaults to transparent (hidden).
   * @returns An SVG element with a polyline chart, or null if no values.
   */
  const points = buildLinePoints(values);
  if (points.length === 0) return null;
  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
    >
      {[25, 50, 75].map((y) => (
        <line
          key={`grid-${y}`}
          x1="6"
          x2="94"
          y1={y}
          y2={y}
          stroke={gridColor}
          strokeWidth="0.6"
        />
      ))}
      <polyline
        points={pointsToString(points)}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * Props for the SvgAreaChart component.
 *
 * @property values - Array of numeric values to plot. Values are normalized
 *   and displayed as a filled area under the line.
 * @property stroke - CSS color string for the line stroke.
 * @property fill - CSS color string for the area fill.
 * @property strokeWidth - Width of the line in SVG units. Defaults to 2.
 * @property gridColor - Color for optional grid lines. Defaults to "transparent".
 * @property fillOpacity - Opacity of the filled area (0-1). Defaults to 0.25.
 */
export const SvgAreaChart: React.FC<{
  values: number[];
  stroke: string;
  fill: string;
  strokeWidth?: number;
  gridColor?: string;
  fillOpacity?: number;
}> = ({
  values,
  stroke,
  fill,
  strokeWidth = 2,
  gridColor = "transparent",
  fillOpacity = 0.25,
}) => {
  /**
   * SVG area chart component.
   *
   * Renders an area chart with a filled region under the line. Similar to
   * SvgLineChart but includes a filled area below the line for visual emphasis.
   * Values are automatically normalized and the area extends to the bottom
   * of the chart.
   *
   * @param values - Array of numeric values to plot.
   * @param stroke - Color for the line.
   * @param fill - Color for the filled area.
   * @param strokeWidth - Line width. Defaults to 2.
   * @param gridColor - Grid line color. Defaults to transparent.
   * @param fillOpacity - Opacity of the fill (0-1). Defaults to 0.25.
   * @returns An SVG element with an area chart, or null if no values.
   */
  const points = buildLinePoints(values);
  if (points.length === 0) return null;
  const bottom = 94;
  const path = [
    `M ${points[0].x} ${points[0].y}`,
    ...points.slice(1).map((p) => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${bottom}`,
    `L ${points[0].x} ${bottom}`,
    "Z",
  ].join(" ");
  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
    >
      {[25, 50, 75].map((y) => (
        <line
          key={`grid-${y}`}
          x1="6"
          x2="94"
          y1={y}
          y2={y}
          stroke={gridColor}
          strokeWidth="0.6"
        />
      ))}
      <path d={path} fill={fill} opacity={fillOpacity} />
      <polyline
        points={pointsToString(points)}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * Props for the SvgBarChart component.
 *
 * @property values - Array of numeric values to plot. Each value becomes
 *   a horizontal bar.
 * @property colors - Array of CSS color strings for bar colors. Colors
 *   cycle if there are more bars than colors.
 * @property maxValue - Optional maximum value for scaling. If not provided,
 *   uses the maximum value in the values array. Useful for consistent scaling
 *   across multiple charts.
 */
export const SvgBarChart: React.FC<{
  values: number[];
  colors: string[];
  maxValue?: number;
}> = ({ values, colors, maxValue }) => {
  /**
   * SVG horizontal bar chart component.
   *
   * Renders a horizontal bar chart where each value becomes a bar. Bars are
   * stacked vertically with consistent spacing. Bar widths are proportional
   * to values, scaled relative to the maximum value (either provided or
   * calculated from the data).
   *
   * @param values - Array of numeric values to plot as bars.
   * @param colors - Array of colors for bars. Colors cycle if needed.
   * @param maxValue - Optional maximum for scaling. Defaults to max of values.
   * @returns An SVG element with horizontal bars, or null if no values.
   */
  if (!values.length) return null;
  const padding = 8;
  const barGap = 6;
  const totalHeight = 100 - padding * 2;
  const barHeight =
    (totalHeight - barGap * (values.length - 1)) / values.length;
  const max = maxValue ?? Math.max(...values, 1);
  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
    >
      {values.map((value, index) => {
        const width = (value / max) * (100 - padding * 2) || 0;
        const y = padding + index * (barHeight + barGap);
        return (
          <rect
            key={`bar-${index}`}
            x={padding}
            y={y}
            width={clamp(width, 0, 100)}
            height={barHeight}
            rx={2}
            fill={colors[index % colors.length]}
          />
        );
      })}
    </svg>
  );
};

/**
 * Converts polar coordinates to Cartesian coordinates.
 *
 * Converts an angle (in degrees) and radius to x,y coordinates, accounting
 * for SVG's coordinate system where 0° points up (north) rather than right.
 * Used for drawing circular/arc-based charts like donut charts.
 *
 * @param cx - Center x coordinate.
 * @param cy - Center y coordinate.
 * @param radius - Distance from center.
 * @param angleInDegrees - Angle in degrees (0-360), where 0° is up (north).
 * @returns Object with x and y Cartesian coordinates.
 */
const polarToCartesian = (
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number,
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
};

/**
 * Generates an SVG path string for a donut chart segment.
 *
 * Creates an SVG path for a single segment of a donut chart (arc between
 * inner and outer radii). The path forms a closed shape suitable for filling.
 * Handles angles greater than 180° correctly using the large arc flag.
 *
 * @param cx - Center x coordinate.
 * @param cy - Center y coordinate.
 * @param outerRadius - Outer radius of the donut segment.
 * @param innerRadius - Inner radius of the donut segment (hole size).
 * @param startAngle - Starting angle in degrees (0-360).
 * @param endAngle - Ending angle in degrees (0-360).
 * @returns SVG path string for the donut segment.
 */
const describeArc = (
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) => {
  const startOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
  const endOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
  const startInner = polarToCartesian(cx, cy, innerRadius, startAngle);
  const endInner = polarToCartesian(cx, cy, innerRadius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    startOuter.x,
    startOuter.y,
    "A",
    outerRadius,
    outerRadius,
    0,
    largeArcFlag,
    0,
    endOuter.x,
    endOuter.y,
    "L",
    startInner.x,
    startInner.y,
    "A",
    innerRadius,
    innerRadius,
    0,
    largeArcFlag,
    1,
    endInner.x,
    endInner.y,
    "Z",
  ].join(" ");
};

/**
 * Props for the SvgDonutChart component.
 *
 * @property values - Array of numeric values representing segment sizes.
 *   Values are normalized to percentages of the total.
 * @property colors - Array of CSS color strings for segment colors. Colors
 *   cycle if there are more segments than colors.
 */
export const SvgDonutChart: React.FC<{
  values: number[];
  colors: string[];
}> = ({ values, colors }) => {
  /**
   * SVG donut chart component.
   *
   * Renders a donut (ring) chart where each value becomes a segment of the ring.
   * Segments are sized proportionally to their value relative to the total.
   * The chart has a fixed inner radius creating the "donut hole" effect.
   *
   * @param values - Array of numeric values for each segment.
   * @param colors - Array of colors for segments. Colors cycle if needed.
   * @returns An SVG element with donut chart segments, or null if total is 0.
   */
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total) return null;
  let startAngle = 0;
  const cx = 50;
  const cy = 50;
  const outerRadius = 44;
  const innerRadius = 26;
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      {values.map((value, index) => {
        const angle = (value / total) * 360;
        const endAngle = startAngle + angle;
        const path = describeArc(
          cx,
          cy,
          outerRadius,
          innerRadius,
          startAngle,
          endAngle,
        );
        const fill = colors[index % colors.length];
        startAngle = endAngle;
        return <path key={`slice-${index}`} d={path} fill={fill} />;
      })}
    </svg>
  );
};

/**
 * Props for the SvgScatterChart component.
 *
 * @property points - Array of point objects with x, y coordinates (0-100 range)
 *   and optional isPrimary flag. Primary points are rendered larger and with
 *   accent color.
 * @property accent - CSS color string for primary points.
 * @property gridColor - Color for grid lines. Defaults to "#334155".
 * @property mutedColor - Color for non-primary points. Defaults to "#64748b".
 */
export const SvgScatterChart: React.FC<{
  points: Array<{ x: number; y: number; isPrimary?: boolean }>;
  accent: string;
  gridColor?: string;
  mutedColor?: string;
}> = ({ points, accent, gridColor = "#334155", mutedColor = "#64748b" }) => {
  /**
   * SVG scatter plot chart component.
   *
   * Renders a scatter plot with optional grid lines and support for primary
   * (highlighted) points. Points are rendered as circles at their x,y coordinates.
   * Includes horizontal and vertical grid lines at 25%, 50%, and 75% positions,
   * plus dashed center lines. Primary points are larger and use the accent color.
   *
   * @param points - Array of points to plot. Coordinates should be in 0-100 range.
   * @param accent - Color for primary points.
   * @param gridColor - Color for grid lines. Defaults to "#334155".
   * @param mutedColor - Color for non-primary points. Defaults to "#64748b".
   * @returns An SVG element with scatter plot points and grid.
   */
  const padding = 10;
  const mapX = (value: number) =>
    padding + (clamp(value, 0, 100) / 100) * (100 - padding * 2);
  const mapY = (value: number) =>
    100 - padding - (clamp(value, 0, 100) / 100) * (100 - padding * 2);
  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
    >
      {[25, 50, 75].map((pos) => (
        <line
          key={`grid-x-${pos}`}
          x1={mapX(pos)}
          x2={mapX(pos)}
          y1={padding}
          y2={100 - padding}
          stroke={gridColor}
          strokeWidth="0.6"
          opacity="0.6"
        />
      ))}
      {[25, 50, 75].map((pos) => (
        <line
          key={`grid-y-${pos}`}
          x1={padding}
          x2={100 - padding}
          y1={mapY(pos)}
          y2={mapY(pos)}
          stroke={gridColor}
          strokeWidth="0.6"
          opacity="0.6"
        />
      ))}
      <line
        x1={mapX(50)}
        x2={mapX(50)}
        y1={padding}
        y2={100 - padding}
        stroke={gridColor}
        strokeDasharray="3 3"
      />
      <line
        x1={padding}
        x2={100 - padding}
        y1={mapY(50)}
        y2={mapY(50)}
        stroke={gridColor}
        strokeDasharray="3 3"
      />
      {points.map((point, index) => (
        <circle
          key={`point-${index}`}
          cx={mapX(point.x)}
          cy={mapY(point.y)}
          r={point.isPrimary ? 4.6 : 3.2}
          fill={point.isPrimary ? accent : mutedColor}
        />
      ))}
    </svg>
  );
};
