/**
 * Data-driven business model slide template component.
 *
 * A presentation slide template for business model slides featuring revenue
 * streams and unit economics. Designed to present pricing strategy and
 * financial metrics clearly.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "data-driven-business-model";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Business Model";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Business model with revenue streams and unit economics.";

/**
 * Schema definition for business model slide data.
 *
 * Defines the structure for business model slide content, including revenue
 * streams (pricing tiers) and unit economics (LTV, CAC, margin).
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
      {
        name: "Platform",
        price: "$18/seat",
        notes: "Tiered by finance complexity",
      },
      {
        name: "Automation",
        price: "0.4%",
        notes: "Workflow and policy engine",
      },
      {
        name: "Insights",
        price: "$6/seat",
        notes: "Benchmarking & forecasting",
      },
    ]),
  unitEconomics: t({
    ltv: t("2<=string<=12").default("$160K"),
    cac: t("2<=string<=12").default("$18K"),
    margin: t("2<=string<=12").default("82%"),
  })
    .describe("Unit economics")
    .default(() => ({
      ltv: "$160K",
      cac: "$18K",
      margin: "82%",
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
 * Data-driven business model slide component.
 *
 * Renders a business model slide with:
 * - Title
 * - Revenue streams table showing pricing tiers and notes
 * - Unit economics display (LTV, CAC, margin)
 *
 * Revenue streams are displayed in a structured table. Unit economics are
 * shown prominently. The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete business model slide with revenue streams and unit economics.
 */
const BusinessModelSlide: React.FC<BusinessModelSlideProps> = ({ data }) => {
  const colors = {
    bg: "#ffffff",
    heading: "#0a0a0a",
    body: "#525252",
    muted: "#a3a3a3",
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
                  className="text-5xl font-bold"
                  style={{ color: colors.heading }}
                >
                  {data?.unitEconomics?.ltv || "$160K"}
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
                    {data?.unitEconomics?.cac || "$18K"}
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
                    {data?.unitEconomics?.margin || "82%"}
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
