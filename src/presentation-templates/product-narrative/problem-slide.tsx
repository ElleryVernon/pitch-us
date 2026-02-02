/**
 * Product narrative problem slide template component.
 *
 * A presentation slide template for problem slides with a dark, cinematic design
 * featuring emotional storytelling. Designed for product narrative presentations.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "product-narrative-problem";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Problem";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Dark problem slide with emotional storytelling.";

/**
 * Schema definition for problem slide data.
 */
const problemSchema = t({
  title: t("3<=string<=60")
    .describe("Problem title")
    .default("The wellness paradox"),
  problemStatement: t("20<=string<=220")
    .describe("Problem statement")
    .default(
      "Despite having more health data than ever, people feel more lost about their wellness journey. Information overload creates paralysis, not progress.",
    ),
  painPoints: t("8<=string<=80")
    .array()
    .and(t("3<=unknown[]<=4"))
    .describe("Pain points")
    .default(() => [
      "87% of health apps are abandoned within 30 days",
      "Average person tracks 4+ different wellness metrics",
      "Less than 10% feel they understand their own data",
    ]),
  source: t("4<=string<=60")
    .describe("Source")
    .default("Healthcare Consumer Survey 2025"),
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
 * Product narrative problem slide component.
 *
 * Renders a dark problem slide with emotional storytelling and pain points.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete problem slide.
 */
const ProblemSlide: React.FC<ProblemSlideProps> = ({ data }) => {
  const colors = {
    bg: "#0a0a0a",
    heading: "#fafafa",
    body: "#a3a3a3",
    muted: "#737373",
    accent: "#f59e0b",
  };

  const painPoints = data?.painPoints ?? [];

  return (
    <div
      className="w-full max-w-[1280px] max-h-[720px] aspect-video mx-auto overflow-hidden"
      style={{ background: colors.bg }}
    >
      <div className="h-full px-16 py-14 flex flex-col">
        {/* Header */}
        <div className="space-y-6 mb-12">
          <p className="text-sm font-medium" style={{ color: colors.muted }}>
            Problem
          </p>
          <h2
            className="text-5xl font-bold leading-tight max-w-2xl"
            style={{ color: colors.heading }}
          >
            {data?.title || "The wellness paradox"}
          </h2>
          <p
            className="text-xl leading-relaxed max-w-3xl"
            style={{ color: colors.body }}
          >
            {data?.problemStatement ||
              "Despite having more health data than ever, people feel more lost about their wellness journey."}
          </p>
        </div>

        {/* Pain points */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="space-y-6">
            {painPoints.map((point, index) => (
              <div
                key={`${point}-${index}`}
                className="flex items-center gap-4"
              >
                <div
                  className="w-1 h-12 rounded-full"
                  style={{ background: colors.accent }}
                />
                <p
                  className="text-xl leading-relaxed"
                  style={{ color: colors.heading }}
                >
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Source */}
        <p className="text-sm" style={{ color: colors.muted }}>
          {data?.source || "Healthcare Consumer Survey 2025"}
        </p>
      </div>
    </div>
  );
};

export default ProblemSlide;
