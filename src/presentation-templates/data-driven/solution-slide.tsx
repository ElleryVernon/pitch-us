/**
 * Data-driven solution slide template component.
 *
 * A presentation slide template for solution slides featuring numbered pillars
 * and a clean layout. Designed to present product solutions and key features
 * in a structured, easy-to-scan format.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "data-driven-solution";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Solution";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Solution slide with numbered pillars and clean layout.";

/**
 * Schema definition for solution slide data.
 *
 * Defines the structure for solution slide content, including title, solution
 * statement, and numbered pillars (key features or benefits).
 */
const solutionSchema = t({
  title: t("3<=string<=60")
    .describe("Solution title")
    .default("Unified Finance Stack"),
  solutionStatement: t("20<=string<=200")
    .describe("Solution summary")
    .default(
      "One platform that connects your cash, commitments, and forecasts in real time.",
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
        title: "Connect",
        description: "Integrate ERP, banks, and payroll in one click.",
      },
      {
        title: "Automate",
        description: "Policy-driven approvals and spend controls.",
      },
      {
        title: "Forecast",
        description: "Real-time scenario planning and board reports.",
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
 * Data-driven solution slide component.
 *
 * Renders a solution slide with:
 * - Title and solution statement
 * - Three numbered pillars (key features/benefits) displayed in a grid
 *
 * Pillars are displayed with numbers (1, 2, 3) and include title and description.
 * The layout emphasizes clarity and structure. The slide maintains a 16:9
 * aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete solution slide with pillars.
 */
const SolutionSlide: React.FC<SolutionSlideProps> = ({ data }) => {
  const colors = {
    bg: "#ffffff",
    heading: "#0a0a0a",
    body: "#525252",
    muted: "#a3a3a3",
    surface: "#fafafa",
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
            {data?.title || "Unified Finance Stack"}
          </h2>
          <p
            className="text-xl leading-relaxed max-w-3xl"
            style={{ color: colors.body }}
          >
            {data?.solutionStatement ||
              "One platform that connects your cash, commitments, and forecasts in real time."}
          </p>
        </div>

        {/* Pillars */}
        <div className="flex-1 grid grid-cols-3 gap-12">
          {pillars.map((pillar, index) => (
            <div key={`${pillar.title}-${index}`} className="flex flex-col">
              <p
                className="text-6xl font-bold mb-4"
                style={{ color: colors.heading }}
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
