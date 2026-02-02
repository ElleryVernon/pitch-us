/**
 * Minimal investor market size slide template component.
 *
 * A presentation slide template for market sizing slides with an ultra-minimal
 * design featuring large values. Designed for investor pitch decks.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "minimal-investor-market";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Market Size";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Ultra-minimal market sizing with large values.";

/**
 * Schema definition for market slide data.
 */
const marketSchema = t({
  title: t("3<=string<=60")
    .describe("Market size title")
    .default("Market Size"),
  summary: t("20<=string<=160")
    .describe("Market sizing summary")
    .default(
      "We focus on mid-market SaaS and fintech teams where finance automation is under-penetrated.",
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
      { label: "TAM", value: "$48B", note: "Global spend stack" },
      { label: "SAM", value: "$12B", note: "Cloud-native finance" },
      { label: "SOM", value: "$1.2B", note: "Initial ICP focus" },
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
 * Minimal investor market size slide component.
 *
 * Renders an ultra-minimal market size slide with large values.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete market size slide.
 */
const MarketSlide: React.FC<MarketSlideProps> = ({ data }) => {
  const colors = {
    bg: "#ffffff",
    heading: "#171717",
    body: "#525252",
    muted: "#a3a3a3",
    accent: "#2563eb",
    gradient: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
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
          <p
            className="text-sm font-medium"
            style={{
              background: colors.gradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
              width: "fit-content",
            }}
          >
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
              "We focus on mid-market SaaS and fintech teams where finance automation is under-penetrated."}
          </p>
        </div>

        {/* Market segments */}
        <div className="flex-1 grid grid-cols-3 gap-8 items-center">
          {segments.map((segment, index) => (
            <div key={`${segment.label}-${index}`} className="text-center">
              <p
                className="text-sm font-medium mb-2"
                style={{
                  background: colors.gradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                  width: "fit-content",
                  margin: "0 auto 0.5rem auto",
                }}
              >
                {segment.label}
              </p>
              <p
                className="text-7xl font-bold mb-2"
                style={{ color: colors.heading }}
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
          {data?.methodology || "Bottom-up by seat + workflow"}
        </p>
      </div>
    </div>
  );
};

export default MarketSlide;
