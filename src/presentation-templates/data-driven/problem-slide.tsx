/**
 * Data-driven problem slide template component.
 *
 * A presentation slide template for problem slides with emphasis on data
 * and statistics. Features large stat displays and clean typography for
 * presenting market problems and pain points.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "data-driven-problem";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Problem";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Problem slide with large stats and clean data presentation.";

/**
 * Schema definition for problem slide data.
 *
 * Defines the structure and validation rules for problem slide content,
 * including title, narrative, statistics, and source attribution.
 */
const problemSchema = t({
  title: t("3<=string<=60")
    .describe("Problem title")
    .default("Data Gaps in Finance Ops"),
  narrative: t("20<=string<=180")
    .describe("Problem narrative")
    .default(
      "Most finance teams cannot quantify commitments in real time, leaving leadership to make decisions on stale data.",
    ),
  stats: t({
    label: t("4<=string<=30"),
    value: t("2<=string<=12"),
    note: t("4<=string<=40"),
  })
    .array()
    .and(t("3<=unknown[]<=4"))
    .describe("Data points")
    .default(() => [
      { label: "Manual entries", value: "62%", note: "of finance hours" },
      { label: "Reporting lag", value: "18 days", note: "avg. close time" },
      { label: "Budget variance", value: "24%", note: "missed forecasts" },
    ]),
  source: t("4<=string<=60").describe("Source note").default("CFO Pulse 2025"),
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
 * Data-driven problem slide component.
 *
 * Renders a problem slide with:
 * - Header section with label, title, and narrative text
 * - Three-column stats grid displaying key problem metrics
 * - Source attribution at the bottom
 *
 * Stats are displayed with large, bold numbers for visual impact. The layout
 * emphasizes data-driven problem presentation. The slide maintains a 16:9
 * aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete problem slide with stats and narrative.
 */
const ProblemSlide: React.FC<ProblemSlideProps> = ({ data }) => {
  const colors = {
    bg: "#ffffff",
    heading: "#0a0a0a",
    body: "#525252",
    muted: "#a3a3a3",
    surface: "#fafafa",
  };

  const stats = data?.stats ?? [];

  return (
    <div
      className="w-full max-w-[1280px] max-h-[720px] aspect-video mx-auto overflow-hidden"
      style={{ background: colors.bg }}
    >
      <div className="h-full px-16 py-14 flex flex-col">
        {/* Header */}
        <div className="space-y-4 mb-12">
          <p className="text-sm font-medium" style={{ color: colors.muted }}>
            Problem
          </p>
          <h2
            className="text-5xl font-bold leading-tight"
            style={{ color: colors.heading }}
          >
            {data?.title || "Data Gaps in Finance Ops"}
          </h2>
          <p
            className="text-xl leading-relaxed max-w-3xl"
            style={{ color: colors.body }}
          >
            {data?.narrative ||
              "Most finance teams cannot quantify commitments in real time, leaving leadership to make decisions on stale data."}
          </p>
        </div>

        {/* Stats grid */}
        <div className="flex-1 grid grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div
              key={`${stat.label}-${index}`}
              className="flex flex-col justify-center"
            >
              <p
                className="text-7xl font-bold tracking-tight"
                style={{ color: colors.heading }}
              >
                {stat.value}
              </p>
              <p
                className="text-lg font-medium mt-2"
                style={{ color: colors.heading }}
              >
                {stat.label}
              </p>
              <p className="text-sm mt-1" style={{ color: colors.muted }}>
                {stat.note}
              </p>
            </div>
          ))}
        </div>

        {/* Source */}
        <p className="text-sm" style={{ color: colors.muted }}>
          {data?.source || "CFO Pulse 2025"}
        </p>
      </div>
    </div>
  );
};

export default ProblemSlide;
