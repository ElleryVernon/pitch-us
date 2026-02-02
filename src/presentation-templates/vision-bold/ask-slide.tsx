/**
 * Vision bold ask slide template component.
 *
 * A presentation slide template for fundraising ask slides with a bold design
 * featuring gradient amount. Designed for impactful presentations.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "vision-bold-ask";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Ask";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription = "Bold fundraising ask with gradient amount.";

/**
 * Schema definition for ask slide data.
 */
const askSchema = t({
  title: t("3<=string<=50").describe("Ask slide title").default("The Ask"),
  amount: t("2<=string<=20")
    .describe("Fundraising amount")
    .default("$40M Series B"),
  runway: t("3<=string<=30").describe("Runway").default("30mo runway"),
  useOfFunds: t("6<=string<=60")
    .array()
    .and(t("3<=unknown[]<=4"))
    .describe("Use of funds")
    .default(() => [
      "Scale enterprise sales team",
      "R&D and platform expansion",
      "International go-to-market",
    ]),
  milestones: t({
    title: t("4<=string<=40"),
    date: t("3<=string<=20"),
  })
    .array()
    .and(t("2<=unknown[]<=3"))
    .describe("Post-raise milestones")
    .default(() => [
      { title: "$50M ARR", date: "Q4 2026" },
      { title: "500 customers", date: "Q2 2027" },
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
 * Vision bold ask slide component.
 *
 * Renders a bold fundraising ask slide with gradient amount.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete ask slide.
 */
const AskSlide: React.FC<AskSlideProps> = ({ data }) => {
  const colors = {
    bg: "#fafafa",
    heading: "#0a0a0a",
    body: "#525252",
    muted: "#a3a3a3",
    gradient: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
    surface: "#ffffff",
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
            className="text-7xl font-bold mb-2"
            style={{
              background: colors.gradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {data?.amount || "$40M Series B"}
          </p>
          <p className="text-xl mb-12" style={{ color: colors.muted }}>
            {data?.runway || "30mo runway"}
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
                  style={{
                    background: colors.gradient,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
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
