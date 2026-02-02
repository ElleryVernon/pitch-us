/**
 * Data-driven ask slide template component.
 *
 * A presentation slide template for fundraising ask slides featuring the
 * fundraising amount, use of funds, runway, and post-raise milestones.
 * Designed for investor pitch decks.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "data-driven-ask";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Ask";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription = "Fundraising ask with prominent amount.";

/**
 * Schema definition for ask slide data.
 *
 * Defines the structure for ask slide content, including fundraising amount,
 * runway statement, use of funds items, and post-raise milestones.
 */
const askSchema = t({
  title: t("3<=string<=50").describe("Ask slide title").default("The Ask"),
  amount: t("2<=string<=20").describe("Fundraising amount").default("$8M Seed"),
  runway: t("3<=string<=30")
    .describe("Runway statement")
    .default("24mo runway"),
  useOfFunds: t("6<=string<=60")
    .array()
    .and(t("3<=unknown[]<=4"))
    .describe("Use of funds items")
    .default(() => [
      "Scale go-to-market & sales",
      "Expand automation workflows",
      "ERP + payroll integrations",
    ]),
  milestones: t({
    title: t("4<=string<=40"),
    date: t("3<=string<=20"),
  })
    .array()
    .and(t("2<=unknown[]<=3"))
    .describe("Post-raise milestones")
    .default(() => [
      { title: "$6M ARR", date: "Q4 2026" },
      { title: "120 customers", date: "Q1 2027" },
    ]),
});

/**
 * Exported schema for use in slide generation and validation.
 */
export const Schema = askSchema;

/**
 * TypeScript type inferred from the ask schema.
 */
export type AskSlideData = typeof askSchema.infer;

/**
 * Props for the AskSlide component.
 *
 * @property data - Optional partial slide data. All fields have defaults.
 */
interface AskSlideProps {
  data?: Partial<AskSlideData>;
}

/**
 * Data-driven ask slide component.
 *
 * Renders an ask slide with:
 * - Title
 * - Prominent fundraising amount and runway statement
 * - Use of funds list
 * - Post-raise milestones
 *
 * The fundraising amount is displayed prominently. The slide maintains a 16:9
 * aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete ask slide with fundraising details.
 */
const AskSlide: React.FC<AskSlideProps> = ({ data }) => {
  const colors = {
    bg: "#ffffff",
    heading: "#0a0a0a",
    body: "#525252",
    muted: "#a3a3a3",
    surface: "#fafafa",
  };

  const useOfFunds = data?.useOfFunds ?? [];
  const milestones = data?.milestones ?? [];

  return (
    <div
      className="w-full max-w-[1280px] max-h-[720px] aspect-video mx-auto overflow-hidden"
      style={{ background: colors.bg }}
    >
      <div className="h-full px-16 py-14 grid grid-cols-2 gap-12">
        {/* Left - The Ask */}
        <div className="flex flex-col justify-center">
          <p
            className="text-sm font-medium mb-4"
            style={{ color: colors.muted }}
          >
            Fundraise
          </p>
          <h2
            className="text-5xl font-bold leading-tight mb-8"
            style={{ color: colors.heading }}
          >
            {data?.title || "The Ask"}
          </h2>

          {/* Amount */}
          <p
            className="text-8xl font-bold mb-2"
            style={{ color: colors.heading }}
          >
            {data?.amount || "$8M Seed"}
          </p>
          <p className="text-xl mb-12" style={{ color: colors.muted }}>
            {data?.runway || "24mo runway"}
          </p>

          {/* Milestones */}
          <p
            className="text-sm font-medium mb-4"
            style={{ color: colors.muted }}
          >
            Post-raise Milestones
          </p>
          <div className="flex gap-8">
            {milestones.map((milestone, index) => (
              <div key={`${milestone.title}-${index}`}>
                <p
                  className="text-2xl font-bold"
                  style={{ color: colors.heading }}
                >
                  {milestone.title}
                </p>
                <p className="text-base" style={{ color: colors.muted }}>
                  {milestone.date}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Use of Funds */}
        <div
          className="rounded-2xl p-10 flex flex-col justify-center"
          style={{ background: colors.surface }}
        >
          <p
            className="text-sm font-medium mb-8"
            style={{ color: colors.muted }}
          >
            Use of Funds
          </p>
          <div className="space-y-6">
            {useOfFunds.map((item, index) => (
              <div key={`${item}-${index}`} className="flex items-center gap-4">
                <span
                  className="text-2xl font-bold"
                  style={{ color: colors.heading }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p
                  className="text-xl leading-relaxed"
                  style={{ color: colors.heading }}
                >
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AskSlide;
