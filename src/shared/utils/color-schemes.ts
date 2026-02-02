/**
 * Color scheme management utilities for presentation themes.
 *
 * This module defines color scheme types and provides utilities for managing
 * color themes used throughout presentations. Color schemes define a cohesive
 * set of colors for headings, body text, accents, borders, and backgrounds
 * that create a consistent visual identity for slides.
 */

/**
 * Color token structure defining semantic color roles.
 *
 * Represents the set of colors used throughout a presentation theme. Each
 * token has a specific semantic meaning and is used consistently across
 * different slide types and components. Colors are specified as hex strings
 * (e.g., "#FFFFFF").
 *
 * @property heading - Color for heading text (titles, main headings).
 *   Typically high contrast for readability. Often white on dark themes or
 *   dark on light themes.
 * @property body - Color for body text (paragraphs, descriptions).
 *   Slightly lower contrast than headings but still highly readable. Usually
 *   a light gray on dark themes or dark gray on light themes.
 * @property muted - Color for muted/secondary text (captions, metadata,
 *   less important information). Lower contrast, used for de-emphasized
 *   content. Typically a medium gray.
 * @property accent - Primary accent color used for highlights, call-to-action
 *   elements, and visual emphasis. Usually a vibrant color that stands out
 *   against the background (e.g., orange, blue, green).
 * @property border - Color for borders and dividers. Used to separate
 *   sections and create visual structure. Usually subtle, matching the overall
 *   theme tone.
 * @property card - Background color for card/container elements. Used for
 *   content containers, slide backgrounds, and panel backgrounds. Provides
 *   contrast against the main surface.
 * @property surface - Optional background color for the main slide surface.
 *   If not provided, uses a default based on the theme. Used as the base
 *   background color for slides.
 */
export type ColorTokens = {
  heading: string;
  body: string;
  muted: string;
  accent: string;
  border: string;
  card: string;
  surface?: string;
};

/**
 * Complete color scheme definition for presentations.
 *
 * Represents a named color theme with a full set of color tokens. Color
 * schemes are used to apply consistent styling across all slides in a
 * presentation, ensuring visual coherence and brand consistency.
 *
 * @property id - Unique identifier for the color scheme. Used to reference
 *   and select the scheme. Should be URL-friendly (lowercase, hyphens).
 * @property name - Human-readable display name for the color scheme.
 *   Shown in UI when users select themes (e.g., "Noir Orange", "Emerald Night").
 * @property description - Optional descriptive text explaining the theme's
 *   visual style or use case. Helps users understand when to use this scheme.
 * @property colors - Complete set of color tokens defining all colors used
 *   in this scheme. Contains all semantic color roles needed for presentation
 *   styling.
 */
export type ColorScheme = {
  id: string;
  name: string;
  description?: string;
  colors: ColorTokens;
};

/**
 * Default color scheme identifier used when no scheme is specified.
 *
 * This is the fallback color scheme that will be used if a presentation
 * doesn't have a specific color scheme assigned or if an invalid scheme ID
 * is provided. The default scheme is "noir-orange", which provides a dark
 * theme with orange accents suitable for professional presentations.
 */
export const DEFAULT_COLOR_SCHEME_ID = "noir-orange";

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: "noir-orange",
    name: "Noir Orange",
    description: "Black canvas with orange accents",
    colors: {
      heading: "#ffffff",
      body: "#e5e7eb",
      muted: "#9aa0a6",
      accent: "#ff4d2d",
      border: "#1f1f1f",
      card: "#0b0b0b",
      surface: "#141414",
    },
  },
  {
    id: "emerald-dark",
    name: "Emerald Night",
    description: "Dark slate with emerald accents",
    colors: {
      heading: "#f8fafc",
      body: "#e2e8f0",
      muted: "#94a3b8",
      accent: "#10b981",
      border: "#334155",
      card: "#0f172a",
      surface: "#1e293b",
    },
  },
  {
    id: "sky-light",
    name: "Sky Light",
    description: "Bright canvas with sky accents",
    colors: {
      heading: "#0f172a",
      body: "#334155",
      muted: "#64748b",
      accent: "#0ea5e9",
      border: "#e2e8f0",
      card: "#ffffff",
      surface: "#f8fafc",
    },
  },
  {
    id: "amber-warm",
    name: "Amber Warm",
    description: "Warm neutrals with amber accents",
    colors: {
      heading: "#292524",
      body: "#44403c",
      muted: "#78716c",
      accent: "#f97316",
      border: "#e7e5e4",
      card: "#fefbf6",
      surface: "#fef7ed",
    },
  },
  {
    id: "indigo-bold",
    name: "Indigo Bold",
    description: "Deep navy with indigo highlights",
    colors: {
      heading: "#ffffff",
      body: "#e5e7eb",
      muted: "#9ca3af",
      accent: "#3b82f6",
      border: "#1f2937",
      card: "#030712",
      surface: "#111827",
    },
  },
  {
    id: "brand-gray",
    name: "Brand Gray",
    description: "Modern grayscale with brand accent",
    colors: {
      heading: "#0f172a",
      body: "#1f2937",
      muted: "#6b7280",
      accent: "#ff4d2d",
      border: "#e5e7eb",
      card: "#ffffff",
      surface: "#f3f4f6",
    },
  },
];

/**
 * Retrieves a color scheme by its identifier.
 *
 * Looks up a color scheme from the available schemes using its unique ID.
 * If the ID is not provided or null, returns the first available scheme
 * (typically the default). If the ID doesn't match any scheme, also
 * returns the first scheme as a fallback.
 *
 * @param id - Optional color scheme identifier to look up. If null, undefined,
 *   or empty string, returns the first available scheme.
 * @returns The matching ColorScheme object, or the first available scheme if
 *   no match is found or ID is not provided. Returns null only if no schemes
 *   are available at all (should not happen in normal operation).
 *
 * @example
 * ```typescript
 * const scheme = getColorSchemeById("noir-orange");
 * // Returns: { id: "noir-orange", name: "Noir Orange", ... }
 *
 * const defaultScheme = getColorSchemeById();
 * // Returns: First scheme in COLOR_SCHEMES array
 * ```
 */
export const getColorSchemeById = (id?: string | null): ColorScheme | null => {
  if (!id) {
    return COLOR_SCHEMES[0] ?? null;
  }
  return COLOR_SCHEMES.find((scheme) => scheme.id === id) ?? COLOR_SCHEMES[0];
};

/**
 * Converts a color scheme to CSS custom properties (CSS variables).
 *
 * Transforms a ColorScheme object into a map of CSS variable names and values
 * that can be applied to DOM elements via inline styles. This allows the color
 * scheme to be dynamically applied to slides and components using CSS variables,
 * enabling theme switching without re-rendering.
 *
 * The CSS variables follow a naming convention where semantic color roles are
 * mapped to CSS custom properties prefixed with "--". These variables can then
 * be referenced in CSS/SCSS files throughout the application.
 *
 * @param scheme - Optional ColorScheme to convert. If null or undefined,
 *   returns an empty object (no CSS variables).
 * @returns A record mapping CSS variable names to hex color values. The keys
 *   are CSS custom property names (e.g., "--text-heading-color") and values
 *   are hex color strings (e.g., "#FFFFFF"). Returns an empty object if no
 *   scheme is provided.
 *
 * @example
 * ```typescript
 * const scheme = getColorSchemeById("noir-orange");
 * const cssVars = colorSchemeToCssVars(scheme);
 * // Returns: {
 * //   "--text-heading-color": "#ffffff",
 * //   "--text-body-color": "#e5e7eb",
 * //   "--primary-accent-color": "#ff4d2d",
 * //   ...
 * // }
 *
 * // Usage in React:
 * <div style={colorSchemeToCssVars(scheme)}>
 *   {"Content with themed colors"}
 * </div>
 * ```
 */
export const colorSchemeToCssVars = (
  scheme?: ColorScheme | null,
): Record<string, string> => {
  if (!scheme) return {};
  const { colors } = scheme;
  const vars: Record<string, string> = {
    "--text-heading-color": colors.heading,
    "--text-body-color": colors.body,
    "--text-muted-color": colors.muted,
    "--primary-accent-color": colors.accent,
    "--border-color": colors.border,
    "--card-background-color": colors.card,
  };
  if (colors.surface) {
    vars["--surface-color"] = colors.surface;
  }
  return vars;
};
