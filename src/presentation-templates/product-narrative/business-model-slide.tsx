/**
 * Product narrative business model slide template component.
 *
 * A presentation slide template for business model slides with a dark, cinematic
 * design featuring clean layout. Designed for product narrative presentations.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "product-narrative-business-model";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Business Model";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription = "Dark business model with clean layout.";

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
      { name: "Premium", price: "$12/mo", notes: "Advanced AI guidance" },
      { name: "Family", price: "$29/mo", notes: "Up to 5 members" },
      { name: "Enterprise", price: "Custom", notes: "Employee wellness" },
    ]),
  unitEconomics: t({
    ltv: t("2<=string<=12").default("$240"),
    cac: t("2<=string<=12").default("$28"),
    margin: t("2<=string<=12").default("78%"),
  })
    .describe("Unit economics")
    .default(() => ({
      ltv: "$240",
      cac: "$28",
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
 * Product narrative business model slide component.
 *
 * Renders a dark business model slide with clean layout.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete business model slide.
 */
const BusinessModelSlide: React.FC<BusinessModelSlideProps> = ({ data }) => {
  const colors = {
    bg: "#0a0a0a",
    heading: "#fafafa",
    body: "#a3a3a3",
    muted: "#737373",
    surface: "#171717",
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
                      ? `1px solid ${colors.surface}`
                      : undefined,
                }}
              >
                <div>
                  <p
                    className="text-xl font-bold mb-1"
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

          {/* Unit Economics */}
          <div
            className="rounded-3xl p-10 flex flex-col justify-center h-full border border-[#262626]"
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
                  className="text-6xl font-bold"
                  style={{ color: colors.heading }}
                >
                  {data?.unitEconomics?.ltv || "$240"}
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
                    {data?.unitEconomics?.cac || "$28"}
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
