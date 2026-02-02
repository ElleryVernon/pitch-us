/**
 * Data-driven market size slide template component.
 *
 * A presentation slide template for market sizing slides featuring prominent
 * TAM (Total Addressable Market), SAM (Serviceable Addressable Market), and
 * SOM (Serviceable Obtainable Market) values with visual bar representations.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "data-driven-market";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Market Size";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Market sizing with prominent TAM/SAM/SOM values.";

/**
 * Schema definition for market slide data.
 *
 * Defines the structure for market slide content, including title, summary,
 * market segments (TAM/SAM/SOM), and methodology attribution.
 */
const marketSchema = t({
  title: t("3<=string<=60")
    .describe("Market slide title")
    .default("Market Size"),
  summary: t("20<=string<=160")
    .describe("Market summary")
    .default(
      "We serve finance teams across SaaS, fintech, and vertical software.",
    ),
  segments: t({
    label: t("2<=string<=12"),
    value: t("2<=string<=12"),
    percent: t("5<=number<=100"),
  })
    .array()
    .and(t("3<=unknown[]<=3"))
    .describe("Market segments")
    .default(() => [
      { label: "TAM", value: "$52B", percent: 100 },
      { label: "SAM", value: "$14B", percent: 58 },
      { label: "SOM", value: "$1.6B", percent: 22 },
    ]),
  methodology: t("4<=string<=60")
    .describe("Methodology")
    .default("Bottom-up by seat + workflow"),
});

/**
 * Exported schema for use in slide generation and validation.
 */
export const Schema = marketSchema;

/**
 * TypeScript type inferred from the market schema.
 */
export type MarketSlideData = typeof marketSchema.infer;

/**
 * Props for the MarketSlide component.
 *
 * @property data - Optional partial slide data. All fields have defaults.
 */
interface MarketSlideProps {
  data?: Partial<MarketSlideData>;
}

/**
 * Data-driven market size slide component.
 *
 * Renders a market slide with:
 * - Title and market summary
 * - Three market segments (TAM/SAM/SOM) displayed with values and percentage bars
 * - Methodology attribution at the bottom
 *
 * Market segments are displayed with horizontal bars showing relative sizes.
 * The layout emphasizes data visualization. The slide maintains a 16:9
 * aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete market size slide with segments and bars.
 */
const MarketSlide: React.FC<MarketSlideProps> = ({ data }) => {
  const colors = {
    bg: "#ffffff",
    heading: "#0a0a0a",
    body: "#525252",
    muted: "#a3a3a3",
    bar: "#e5e5e5",
    barFill: "#0a0a0a",
  };

  const segments = data?.segments ?? [
    { label: "TAM", value: "$52B", percent: 100 },
    { label: "SAM", value: "$14B", percent: 58 },
    { label: "SOM", value: "$1.6B", percent: 22 },
  ];

  return (
    <div
      className="w-full max-w-[1280px] max-h-[720px] aspect-video mx-auto overflow-hidden"
      style={{ background: colors.bg }}
    >
      <div className="h-full px-16 py-14 flex flex-col">
        {/* Header */}
        <div className="space-y-4 mb-12">
          <p className="text-sm font-medium" style={{ color: colors.muted }}>
            Market
          </p>
          <h2
            className="text-5xl font-bold leading-tight"
            style={{ color: colors.heading }}
          >
            {data?.title || "Market Size"}
          </h2>
          <p
            className="text-xl leading-relaxed max-w-2xl"
            style={{ color: colors.body }}
          >
            {data?.summary ||
              "We serve finance teams across SaaS, fintech, and vertical software."}
          </p>
        </div>

        {/* Market bars */}
        <div className="flex-1 flex flex-col justify-center gap-8">
          {segments.map((segment, index) => (
            <div key={`${segment.label}-${index}`} className="space-y-3">
              <div className="flex items-baseline gap-4">
                <p
                  className="text-sm font-medium w-12"
                  style={{ color: colors.muted }}
                >
                  {segment.label}
                </p>
                <p
                  className="text-4xl font-bold"
                  style={{ color: colors.heading }}
                >
                  {segment.value}
                </p>
              </div>
              <div
                className="h-3 rounded-full"
                style={{ background: colors.bar }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${segment.percent}%`,
                    background: colors.barFill,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-sm" style={{ color: colors.muted }}>
          {data?.methodology || "Bottom-up by seat + workflow"}
        </p>
      </div>
    </div>
  );
};

export default MarketSlide;
