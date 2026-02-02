/**
 * Vision bold problem slide template component.
 *
 * A presentation slide template for problem slides with a bold design featuring
 * large statistics and gradient accents. Designed for impactful presentations.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "vision-bold-problem";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Problem";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Bold problem slide with large stat and gradient accent.";

/**
 * Schema definition for problem slide data.
 */
const problemSchema = t({
  title: t("3<=string<=60")
    .describe("Problem title")
    .default("The enterprise AI gap"),
  problemStatement: t("20<=string<=220")
    .describe("Problem statement")
    .default(
      "Despite billions spent on AI initiatives, most enterprises struggle to move beyond pilots to production-scale deployment.",
    ),
  highlightStat: t({
    value: t("2<=string<=12").default("87%"),
    label: t("4<=string<=60").default("of AI projects never reach production"),
  })
    .describe("Highlight stat")
    .default(() => ({
      value: "87%",
      label: "of AI projects never reach production",
    })),
  painPoints: t("8<=string<=80")
    .array()
    .and(t("3<=unknown[]<=4"))
    .describe("Pain points")
    .default(() => [
      "Fragmented tooling across teams",
      "Skills gap in ML operations",
      "Compliance and governance challenges",
    ]),
  source: t("4<=string<=60")
    .describe("Source")
    .default("McKinsey AI Report 2025"),
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
 * Vision bold problem slide component.
 *
 * Renders a bold problem slide with large statistic and gradient accents.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete problem slide.
 */
const ProblemSlide: React.FC<ProblemSlideProps> = ({ data }) => {
  const colors = {
    bg: "#fafafa",
    heading: "#0a0a0a",
    body: "#525252",
    muted: "#a3a3a3",
    gradient: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
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
            <p className="text-sm font-medium" style={{ color: colors.muted }}>
              Problem
            </p>
            <h2
              className="text-5xl font-bold leading-tight"
              style={{ color: colors.heading }}
            >
              {data?.title || "The enterprise AI gap"}
            </h2>
            <p
              className="text-xl leading-relaxed"
              style={{ color: colors.body }}
            >
              {data?.problemStatement ||
                "Despite billions spent on AI initiatives, most enterprises struggle to move beyond pilots to production-scale deployment."}
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
            {data?.source || "McKinsey AI Report 2025"}
          </p>
        </div>

        {/* Right - Big stat */}
        <div className="flex flex-col justify-center items-center">
          <p
            className="text-[140px] font-bold leading-none"
            style={{
              background: colors.gradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {data?.highlightStat?.value || "87%"}
          </p>
          <p
            className="text-xl text-center mt-4 max-w-sm"
            style={{ color: colors.body }}
          >
            {data?.highlightStat?.label ||
              "of AI projects never reach production"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProblemSlide;
