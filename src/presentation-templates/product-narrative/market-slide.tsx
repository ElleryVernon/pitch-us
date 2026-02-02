/**
 * Product narrative market size slide template component.
 *
 * A presentation slide template for market sizing slides with a dark, cinematic
 * design featuring visual and text balance. Designed for product narrative presentations.
 */

import React from "react";
import { type as t } from "arktype";
import { ImageSchema } from "@/presentation-templates/default-schemes";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "product-narrative-market";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Market Size";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Dark market slide with visual and text balance.";

/**
 * Schema definition for market slide data.
 */
const marketSchema = t({
  title: t("3<=string<=60")
    .describe("Market title")
    .default("The perfect convergence"),
  summary: t("20<=string<=200")
    .describe("Market summary")
    .default(
      "Advances in AI and widespread wearable adoption now enable truly personalized health guidance at exactly the moment when chronic disease rates are reaching crisis levels.",
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
      { label: "TAM", value: "$180B", note: "Digital health" },
      { label: "SAM", value: "$42B", note: "Personalized wellness" },
      { label: "SOM", value: "$2.1B", note: "AI health coaches" },
    ]),
  heroImage: ImageSchema.describe("Market visual").default(() => ({
    __image_url__:
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80",
    __image_prompt__: "Athletic person representing health market",
  })),
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
 * Product narrative market size slide component.
 *
 * Renders a dark market size slide with visual and text balance.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete market size slide.
 */
const MarketSlide: React.FC<MarketSlideProps> = ({ data }) => {
  const colors = {
    bg: "#0a0a0a",
    heading: "#fafafa",
    body: "#a3a3a3",
    muted: "#737373",
  };

  const segments = data?.segments ?? [];

  return (
    <div
      className="w-full max-w-[1280px] max-h-[720px] aspect-video mx-auto overflow-hidden"
      style={{ background: colors.bg }}
    >
      <div className="h-full grid grid-cols-2">
        {/* Left content */}
        <div className="px-16 py-14 flex flex-col justify-between">
          <div className="space-y-6">
            <p className="text-sm font-medium" style={{ color: colors.muted }}>
              Market
            </p>
            <h2
              className="text-4xl font-bold leading-tight"
              style={{ color: colors.heading }}
            >
              {data?.title || "The perfect convergence"}
            </h2>
          </div>

          {/* Segments */}
          <div className="space-y-6">
            {segments.map((segment, index) => (
              <div key={`${segment.label}-${index}`}>
                <p className="text-sm" style={{ color: colors.muted }}>
                  {segment.label}
                </p>
                <p
                  className="text-4xl font-bold"
                  style={{ color: colors.heading }}
                >
                  {segment.value}
                </p>
                <p className="text-sm" style={{ color: colors.body }}>
                  {segment.note}
                </p>
              </div>
            ))}
          </div>

          <p
            className="text-base leading-relaxed"
            style={{ color: colors.body }}
          >
            {data?.summary ||
              "Advances in AI and widespread wearable adoption now enable truly personalized health guidance."}
          </p>
        </div>

        {/* Right image */}
        <div className="relative">
          <img
            src={
              data?.heroImage?.__image_url__ ||
              "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80"
            }
            alt={data?.heroImage?.__image_prompt__ || "Market"}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to left, transparent 60%, rgba(10,10,10,1) 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MarketSlide;
