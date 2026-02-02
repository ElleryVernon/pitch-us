/**
 * Minimal investor business model slide template component.
 *
 * A presentation slide template for business model slides with an ultra-minimal
 * design featuring revenue streams and unit economics. Designed for investor pitch decks.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "minimal-investor-business-model";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Business Model";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Ultra-minimal business model with revenue and economics.";

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
      { name: "Platform", price: "$15/seat", notes: "Core workspace" },
      { name: "Automation", price: "0.3%", notes: "Transaction fees" },
      { name: "Insights", price: "$5/seat", notes: "Forecasting add-on" },
    ]),
  unitEconomics: t({
    ltv: t("2<=string<=12").default("$85K"),
    cac: t("2<=string<=12").default("$12K"),
    margin: t("2<=string<=12").default("78%"),
  })
    .describe("Unit economics")
    .default(() => ({
      ltv: "$85K",
      cac: "$12K",
      margin: "78%",
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
 * Minimal investor business model slide component.
 *
 * Renders an ultra-minimal business model slide with revenue streams and unit economics.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete business model slide.
 */
const BusinessModelSlide: React.FC<BusinessModelSlideProps> = ({ data }) => {
  const colors = {
    bg: "#ffffff",
    heading: "#171717",
    body: "#525252",
    muted: "#a3a3a3",
    accent: "#2563eb",
    gradient: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
    surface: "#fafafa",
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
        <div className="flex-1 grid grid-cols-2 gap-16 items-stretch">
          {/* Revenue streams */}
          <div className="flex flex-col justify-center space-y-8">
            {revenueStreams.map((stream, index) => (
              <div
                key={`${stream.name}-${index}`}
                className="flex items-center justify-between py-5"
                style={{
                  borderBottom:
                    index < revenueStreams.length - 1
                      ? `1px solid ${colors.surface}`
                      : undefined,
                }}
              >
                <div>
                  <p
                    className="text-xl font-semibold mb-1"
                    style={{ color: colors.heading }}
                  >
                    {stream.name}
                  </p>
                  <p className="text-sm" style={{ color: colors.muted }}>
                    {stream.notes}
                  </p>
                </div>
                <p
                  className="text-3xl font-bold"
                  style={{ color: colors.heading }}
                >
                  {stream.price}
                </p>
              </div>
            ))}
          </div>

          {/* Unit economics */}
          <div
            className="rounded-2xl p-10 flex flex-col justify-center h-full"
            style={{ background: colors.surface }}
          >
            <p
              className="text-sm font-medium mb-10"
              style={{ color: colors.muted }}
            >
              Unit Economics
            </p>
            <div className="space-y-10">
              <div>
                <p className="text-sm mb-2" style={{ color: colors.muted }}>
                  LTV
                </p>
                <p
                  className="text-6xl font-bold tracking-tight"
                  style={{
                    background: colors.gradient,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    color: "transparent",
                    width: "fit-content",
                  }}
                >
                  {data?.unitEconomics?.ltv || "$85K"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-sm mb-2" style={{ color: colors.muted }}>
                    CAC
                  </p>
                  <p
                    className="text-4xl font-bold"
                    style={{ color: colors.heading }}
                  >
                    {data?.unitEconomics?.cac || "$12K"}
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-2" style={{ color: colors.muted }}>
                    Gross Margin
                  </p>
                  <p
                    className="text-4xl font-bold"
                    style={{ color: colors.heading }}
                  >
                    {data?.unitEconomics?.margin || "78%"}
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
