/**
 * Vision bold market size slide template component.
 *
 * A presentation slide template for market sizing slides with a bold design
 * featuring large TAM values and gradient accents. Designed for impactful presentations.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "vision-bold-market";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Market Size";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Bold market slide with large TAM and gradient values.";

/**
 * Schema definition for market slide data.
 */
const marketSchema = t({
  title: t("3<=string<=60")
    .describe("Market title")
    .default("Massive market opportunity"),
  summary: t("20<=string<=160")
    .describe("Market summary")
    .default(
      "Enterprise AI platform spending is accelerating as companies race to operationalize AI.",
    ),
  segments: t({
    label: t("2<=string<=12"),
    value: t("2<=string<=12"),
    note: t("4<=string<=40"),
  })
    .array()
    .and(t("3<=unknown[]<=3"))
    .describe("Market segments")
    .default(() => [
      { label: "TAM", value: "$280B", note: "Enterprise AI" },
      { label: "SAM", value: "$68B", note: "MLOps & platforms" },
      { label: "SOM", value: "$4.2B", note: "Mid-market focus" },
    ]),
  methodology: t("4<=string<=60")
    .describe("Methodology")
    .default("Gartner, IDC 2025"),
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
 * Vision bold market size slide component.
 *
 * Renders a bold market size slide with large TAM values and gradient accents.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete market size slide.
 */
const MarketSlide: React.FC<MarketSlideProps> = ({ data }) => {
  const colors = {
    bg: "#fafafa",
    heading: "#0a0a0a",
    body: "#525252",
    muted: "#a3a3a3",
    gradient: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
  };

  const segments = data?.segments ?? [];

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
            {data?.title || "Massive market opportunity"}
          </h2>
          <p
            className="text-xl leading-relaxed max-w-2xl"
            style={{ color: colors.body }}
          >
            {data?.summary ||
              "Enterprise AI platform spending is accelerating as companies race to operationalize AI."}
          </p>
        </div>

        {/* Market segments */}
        <div className="flex-1 grid grid-cols-3 gap-8 items-center">
          {segments.map((segment, index) => (
            <div key={`${segment.label}-${index}`} className="text-center">
              <p
                className="text-sm font-medium mb-2"
                style={{ color: colors.muted }}
              >
                {segment.label}
              </p>
              <p
                className="text-7xl font-bold mb-2"
                style={
                  index === 0
                    ? {
                        background: colors.gradient,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        color: "transparent",
                      }
                    : {
                        color: colors.heading,
                      }
                }
              >
                {segment.value}
              </p>
              <p className="text-base" style={{ color: colors.body }}>
                {segment.note}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-sm" style={{ color: colors.muted }}>
          {data?.methodology || "Gartner, IDC 2025"}
        </p>
      </div>
    </div>
  );
};

export default MarketSlide;
