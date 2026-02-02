/**
 * Minimal investor problem slide template component.
 *
 * A presentation slide template for problem slides with an ultra-minimal design
 * featuring a prominent statistic. Designed for investor pitch decks.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "minimal-investor-problem";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Problem";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Ultra-minimal problem slide with prominent stat.";

/**
 * Schema definition for problem slide data.
 */
const problemSchema = t({
  title: t("3<=string<=60")
    .describe("Problem slide title")
    .default("The Finance Blind Spot"),
  problemStatement: t("20<=string<=220")
    .describe("Primary problem statement")
    .default(
      "Fast-growing startups lack a real-time view of cash and commitments, forcing leaders to operate with delayed, fragmented data.",
    ),
  painPoints: t("8<=string<=80")
    .array()
    .and(t("3<=unknown[]<=5"))
    .describe("Key pain points")
    .default(() => [
      "Spreadsheets updated weekly, not daily",
      "Commitments hidden across tools",
      "40% of time spent reconciling data",
    ]),
  highlightStat: t({
    value: t("2<=string<=10").default("18 days"),
    label: t("4<=string<=40").default("avg. reporting lag"),
  })
    .describe("Highlight stat")
    .default(() => ({
      value: "18 days",
      label: "avg. reporting lag",
    })),
  source: t("4<=string<=60").describe("Source").default("CFO Pulse 2025"),
});

/**
 * Exported schema for use in slide generation and validation.
 */
export const Schema = problemSchema;

/**
 * TypeScript type inferred from the problem schema.
 */
export type ProblemSlideData = typeof problemSchema.infer;

/**
 * Props for the ProblemSlide component.
 *
 * @property data - Optional partial slide data. All fields have defaults.
 */
interface ProblemSlideProps {
  data?: Partial<ProblemSlideData>;
}

/**
 * Minimal investor problem slide component.
 *
 * Renders an ultra-minimal problem slide with prominent statistic and pain points.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete problem slide.
 */
const ProblemSlide: React.FC<ProblemSlideProps> = ({ data }) => {
  const colors = {
    bg: "#ffffff",
    heading: "#171717",
    body: "#525252",
    muted: "#a3a3a3",
    accent: "#2563eb",
    gradient: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
  };

  const painPoints = data?.painPoints ?? [];

  return (
    <div
      className="w-full max-w-[1280px] max-h-[720px] aspect-video mx-auto overflow-hidden"
      style={{ background: colors.bg }}
    >
      <div className="h-full px-16 py-14 grid grid-cols-2 gap-12">
        {/* Left content */}
        <div className="flex flex-col justify-between">
          <div className="space-y-6">
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
              Problem
            </p>
            <h2
              className="text-5xl font-bold leading-tight"
              style={{ color: colors.heading }}
            >
              {data?.title || "The Finance Blind Spot"}
            </h2>
            <p
              className="text-xl leading-relaxed"
              style={{ color: colors.body }}
            >
              {data?.problemStatement ||
                "Fast-growing startups lack a real-time view of cash and commitments."}
            </p>
          </div>

          {/* Pain points */}
          <div className="space-y-4">
            {painPoints.map((point, index) => (
              <p
                key={`${point}-${index}`}
                className="text-lg"
                style={{ color: colors.heading }}
              >
                {point}
              </p>
            ))}
          </div>

          <p className="text-sm" style={{ color: colors.muted }}>
            {data?.source || "CFO Pulse 2025"}
          </p>
        </div>

        {/* Right - Big stat */}
        <div className="flex flex-col justify-center items-center">
          <p
            className="text-[120px] font-bold leading-none"
            style={{
              background: colors.gradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {data?.highlightStat?.value || "18 days"}
          </p>
          <p className="text-xl mt-4" style={{ color: colors.body }}>
            {data?.highlightStat?.label || "avg. reporting lag"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProblemSlide;
