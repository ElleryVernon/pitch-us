/**
 * Vision bold business model slide template component.
 *
 * A presentation slide template for business model slides with a bold design
 * featuring gradient accents. Designed for impactful presentations.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "vision-bold-business-model";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Business Model";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription = "Bold business model with gradient accents.";

/**
 * Schema definition for business model slide data.
 */
const businessModelSchema = t({
  title: t("3<=string<=60")
    .describe("Business model title")
    .default("Business Model"),
  revenueStreams: t({
    name: t("2<=string<=30"),
    price: t("2<=string<=20"),
    notes: t("6<=string<=60"),
  })
    .array()
    .and(t("3<=unknown[]<=4"))
    .describe("Revenue streams")
    .default(() => [
      { name: "Platform", price: "$50K/yr", notes: "Base platform access" },
      { name: "Compute", price: "Usage", notes: "Pay-per-inference pricing" },
      { name: "Enterprise", price: "$500K+", notes: "Custom deployment" },
    ]),
  unitEconomics: t({
    ltv: t("2<=string<=12").default("$420K"),
    cac: t("2<=string<=12").default("$48K"),
    margin: t("2<=string<=12").default("85%"),
  })
    .describe("Unit economics")
    .default(() => ({
      ltv: "$420K",
      cac: "$48K",
      margin: "85%",
    })),
});

/**
 * Exported schema for use in slide generation and validation.
 */
export const Schema = businessModelSchema;

/**
 * TypeScript type inferred from the business model schema.
 */
export type BusinessModelSlideData = typeof businessModelSchema.infer;

/**
 * Props for the BusinessModelSlide component.
 *
 * @property data - Optional partial slide data. All fields have defaults.
 */
interface BusinessModelSlideProps {
  data?: Partial<BusinessModelSlideData>;
}

/**
 * Vision bold business model slide component.
 *
 * Renders a bold business model slide with gradient accents.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete business model slide.
 */
const BusinessModelSlide: React.FC<BusinessModelSlideProps> = ({ data }) => {
  const colors = {
    bg: "#fafafa",
    heading: "#0a0a0a",
    body: "#525252",
    muted: "#a3a3a3",
    gradient: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
    surface: "#ffffff",
  };

  const revenueStreams = data?.revenueStreams ?? [];

  return (
    <div
      className="w-full max-w-[1280px] max-h-[720px] aspect-video mx-auto overflow-hidden"
      style={{ background: colors.bg }}
    >
      <div className="h-full px-16 py-14 flex flex-col">
        {/* Header */}
        <div className="space-y-4 mb-10">
          <p className="text-sm font-medium" style={{ color: colors.muted }}>
            Business Model
          </p>
          <h2
            className="text-5xl font-bold leading-tight"
            style={{ color: colors.heading }}
          >
            {data?.title || "Business Model"}
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-2 gap-12 items-stretch">
          {/* Revenue streams */}
          <div className="flex flex-col justify-center space-y-8">
            {revenueStreams.map((stream, index) => (
              <div
                key={`${stream.name}-${index}`}
                className="flex items-center justify-between py-6"
                style={{
                  borderBottom:
                    index < revenueStreams.length - 1
                      ? `1px solid #e5e5e5`
                      : undefined,
                }}
              >
                <div>
                  <p
                    className="text-2xl font-bold mb-2"
                    style={{ color: colors.heading }}
                  >
                    {stream.name}
                  </p>
                  <p className="text-base" style={{ color: colors.muted }}>
                    {stream.notes}
                  </p>
                </div>
                <p
                  className="text-4xl font-bold"
                  style={{ color: colors.heading }}
                >
                  {stream.price}
                </p>
              </div>
            ))}
          </div>

          {/* Unit Economics */}
          <div
            className="rounded-3xl p-12 flex flex-col justify-between h-full"
            style={{ background: colors.surface }}
          >
            <p className="text-lg font-medium" style={{ color: colors.muted }}>
              Unit Economics
            </p>
            <div className="space-y-10">
              <div>
                <p className="text-base mb-2" style={{ color: colors.muted }}>
                  LTV
                </p>
                <p
                  className="text-6xl font-bold"
                  style={{
                    background: colors.gradient,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {data?.unitEconomics?.ltv || "$420K"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-base mb-2" style={{ color: colors.muted }}>
                    CAC
                  </p>
                  <p
                    className="text-4xl font-bold"
                    style={{ color: colors.heading }}
                  >
                    {data?.unitEconomics?.cac || "$48K"}
                  </p>
                </div>
                <div>
                  <p className="text-base mb-2" style={{ color: colors.muted }}>
                    Gross Margin
                  </p>
                  <p
                    className="text-4xl font-bold"
                    style={{ color: colors.heading }}
                  >
                    {data?.unitEconomics?.margin || "85%"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessModelSlide;
