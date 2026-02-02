/**
 * Minimal investor solution slide template component.
 *
 * A presentation slide template for solution slides with an ultra-minimal design
 * featuring numbered pillars. Designed for investor pitch decks.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "minimal-investor-solution";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Solution";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Ultra-minimal solution slide with numbered pillars.";

/**
 * Schema definition for solution slide data.
 */
const solutionSchema = t({
  title: t("3<=string<=60")
    .describe("Solution title")
    .default("The Finance Stack"),
  solutionStatement: t("20<=string<=200")
    .describe("Primary solution statement")
    .default(
      "A unified platform that connects your financial data, automates workflows, and delivers real-time insights.",
    ),
  pillars: t({
    title: t("3<=string<=30"),
    description: t("10<=string<=100"),
  })
    .array()
    .and(t("3<=unknown[]<=4"))
    .describe("Solution pillars")
    .default(() => [
      {
        title: "Connect",
        description: "Integrate banks, ERP, and payroll in minutes",
      },
      {
        title: "Automate",
        description: "Policy-driven approvals and spend controls",
      },
      {
        title: "Forecast",
        description: "Real-time scenario planning for leadership",
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
 * Minimal investor solution slide component.
 *
 * Renders an ultra-minimal solution slide with numbered pillars.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete solution slide.
 */
const SolutionSlide: React.FC<SolutionSlideProps> = ({ data }) => {
  const colors = {
    bg: "#ffffff",
    heading: "#171717",
    body: "#525252",
    muted: "#a3a3a3",
    accent: "#2563eb",
    gradient: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
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
            Solution
          </p>
          <h2
            className="text-5xl font-bold leading-tight"
            style={{ color: colors.heading }}
          >
            {data?.title || "The Finance Stack"}
          </h2>
          <p
            className="text-xl leading-relaxed max-w-3xl"
            style={{ color: colors.body }}
          >
            {data?.solutionStatement ||
              "A unified platform that connects your financial data, automates workflows, and delivers real-time insights."}
          </p>
        </div>

        {/* Pillars */}
        <div className="flex-1 grid grid-cols-3 gap-12">
          {pillars.map((pillar, index) => (
            <div key={`${pillar.title}-${index}`} className="flex flex-col">
              <p
                className="text-6xl font-bold mb-4"
                style={{
                  background: colors.gradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                  width: "fit-content",
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
