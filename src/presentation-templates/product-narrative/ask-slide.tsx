/**
 * Product narrative ask slide template component.
 *
 * A presentation slide template for fundraising ask slides with a dark, cinematic
 * design featuring prominent amount. Designed for product narrative presentations.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "product-narrative-ask";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Ask";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription = "Dark fundraising ask with prominent amount.";

/**
 * Schema definition for ask slide data.
 */
const askSchema = t({
  title: t("3<=string<=50").describe("Ask slide title").default("The Ask"),
  amount: t("2<=string<=20").describe("Fundraising amount").default("$4M Seed"),
  runway: t("3<=string<=30").describe("Runway").default("24mo runway"),
  useOfFunds: t("6<=string<=60")
    .array()
    .and(t("3<=unknown[]<=4"))
    .describe("Use of funds")
    .default(() => [
      "Engineering & AI development",
      "User acquisition & growth",
      "Clinical validation studies",
    ]),
  milestones: t({
    title: t("4<=string<=40"),
    date: t("3<=string<=20"),
  })
    .array()
    .and(t("2<=unknown[]<=3"))
    .describe("Post-raise milestones")
    .default(() => [
      { title: "500K users", date: "Q4 2026" },
      { title: "$2M ARR", date: "Q2 2027" },
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
 * Product narrative ask slide component.
 *
 * Renders a dark fundraising ask slide with prominent amount.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete ask slide.
 */
const AskSlide: React.FC<AskSlideProps> = ({ data }) => {
  const colors = {
    bg: "#0a0a0a",
    heading: "#fafafa",
    body: "#a3a3a3",
    muted: "#737373",
    surface: "#171717",
    accent: "#f59e0b",
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
            style={{ color: colors.accent }}
          >
            {data?.amount || "$4M Seed"}
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
                  style={{ color: colors.accent }}
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
