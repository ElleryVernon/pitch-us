/**
 * Vision bold solution slide template component.
 *
 * A presentation slide template for solution slides with a bold design featuring
 * numbered pillars and gradient accents. Designed for impactful presentations.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "vision-bold-solution";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Solution";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Bold solution slide with numbered pillars and gradient accents.";

/**
 * Schema definition for solution slide data.
 */
const solutionSchema = t({
  title: t("3<=string<=60")
    .describe("Solution title")
    .default("End-to-end AI platform"),
  solutionStatement: t("20<=string<=200")
    .describe("Solution summary")
    .default(
      "One unified platform that takes AI from prototype to production at enterprise scale.",
    ),
  pillars: t({
    title: t("3<=string<=30"),
    description: t("10<=string<=100"),
  })
    .array()
    .and(t("3<=unknown[]<=3"))
    .describe("Solution pillars")
    .default(() => [
      {
        title: "Develop",
        description: "Collaborative ML environment with built-in governance",
      },
      {
        title: "Deploy",
        description: "One-click deployment to any cloud or on-premise",
      },
      {
        title: "Monitor",
        description: "Real-time performance tracking and drift detection",
      },
    ]),
});

/**
 * Exported schema for use in slide generation and validation.
 */
export const Schema = solutionSchema;

/**
 * TypeScript type inferred from the solution schema.
 */
export type SolutionSlideData = typeof solutionSchema.infer;

/**
 * Props for the SolutionSlide component.
 *
 * @property data - Optional partial slide data. All fields have defaults.
 */
interface SolutionSlideProps {
  data?: Partial<SolutionSlideData>;
}

/**
 * Vision bold solution slide component.
 *
 * Renders a bold solution slide with numbered pillars and gradient accents.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete solution slide.
 */
const SolutionSlide: React.FC<SolutionSlideProps> = ({ data }) => {
  const colors = {
    bg: "#fafafa",
    heading: "#0a0a0a",
    body: "#525252",
    muted: "#a3a3a3",
    gradient: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
    surface: "#ffffff",
  };

  const pillars = data?.pillars ?? [];

  return (
    <div
      className="w-full max-w-[1280px] max-h-[720px] aspect-video mx-auto overflow-hidden"
      style={{ background: colors.bg }}
    >
      <div className="h-full px-16 py-14 flex flex-col">
        {/* Header */}
        <div className="space-y-4 mb-12">
          <p className="text-sm font-medium" style={{ color: colors.muted }}>
            Solution
          </p>
          <h2
            className="text-5xl font-bold leading-tight"
            style={{ color: colors.heading }}
          >
            {data?.title || "End-to-end AI platform"}
          </h2>
          <p
            className="text-xl leading-relaxed max-w-3xl"
            style={{ color: colors.body }}
          >
            {data?.solutionStatement ||
              "One unified platform that takes AI from prototype to production at enterprise scale."}
          </p>
        </div>

        {/* Pillars */}
        <div className="flex-1 grid grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <div
              key={`${pillar.title}-${index}`}
              className="rounded-2xl p-8 flex flex-col"
              style={{ background: colors.surface }}
            >
              <p
                className="text-5xl font-bold mb-4"
                style={{
                  background: colors.gradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </p>
              <p
                className="text-2xl font-bold mb-3"
                style={{ color: colors.heading }}
              >
                {pillar.title}
              </p>
              <p
                className="text-base leading-relaxed"
                style={{ color: colors.body }}
              >
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SolutionSlide;
