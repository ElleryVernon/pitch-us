/**
 * Product narrative roadmap slide template component.
 *
 * A presentation slide template for roadmap slides with a dark, cinematic design
 * featuring timeline phases. Designed for product narrative presentations.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "product-narrative-roadmap";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Roadmap";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription = "Dark roadmap with timeline phases.";

/**
 * Schema definition for roadmap slide data.
 */
const roadmapSchema = t({
  title: t("3<=string<=60").describe("Roadmap title").default("Roadmap"),
  phases: t({
    phase: t("2<=string<=20"),
    timeline: t("3<=string<=20"),
    goals: t("6<=string<=60").array().and(t("2<=unknown[]<=3")),
  })
    .array()
    .and(t("3<=unknown[]<=3"))
    .describe("Roadmap phases")
    .default(() => [
      {
        phase: "Now",
        timeline: "H1 2026",
        goals: ["iOS app launch", "Core AI engine"],
      },
      {
        phase: "Next",
        timeline: "H2 2026",
        goals: ["Android + wearables", "B2B pilot"],
      },
      {
        phase: "Later",
        timeline: "2027",
        goals: ["International expansion", "Enterprise tier"],
      },
    ]),
});

/**
 * Exported schema for use in slide generation and validation.
 */
export const Schema = roadmapSchema;

/**
 * TypeScript type inferred from the roadmap schema.
 */
export type RoadmapSlideData = typeof roadmapSchema.infer;

/**
 * Props for the RoadmapSlide component.
 *
 * @property data - Optional partial slide data. All fields have defaults.
 */
interface RoadmapSlideProps {
  data?: Partial<RoadmapSlideData>;
}

/**
 * Product narrative roadmap slide component.
 *
 * Renders a dark roadmap slide with timeline phases.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete roadmap slide.
 */
const RoadmapSlide: React.FC<RoadmapSlideProps> = ({ data }) => {
  const colors = {
    bg: "#0a0a0a",
    heading: "#fafafa",
    body: "#a3a3a3",
    muted: "#737373",
    surface: "#171717",
    accent: "#f59e0b",
  };

  const phases = data?.phases ?? [];

  return (
    <div
      className="w-full max-w-[1280px] max-h-[720px] aspect-video mx-auto overflow-hidden"
      style={{ background: colors.bg }}
    >
      <div className="h-full px-16 py-14 flex flex-col">
        {/* Header */}
        <div className="space-y-4 mb-10">
          <p className="text-sm font-medium" style={{ color: colors.muted }}>
            Roadmap
          </p>
          <h2
            className="text-5xl font-bold leading-tight"
            style={{ color: colors.heading }}
          >
            {data?.title || "Roadmap"}
          </h2>
        </div>

        {/* Timeline */}
        <div className="flex-1 grid grid-cols-3 gap-8">
          {phases.map((phase, index) => (
            <div
              key={`${phase.phase}-${index}`}
              className="rounded-2xl p-8 flex flex-col"
              style={{ background: colors.surface }}
            >
              <div className="flex items-baseline justify-between mb-6">
                <p
                  className="text-3xl font-bold"
                  style={{ color: colors.accent }}
                >
                  {phase.phase}
                </p>
                <p className="text-base" style={{ color: colors.muted }}>
                  {phase.timeline}
                </p>
              </div>
              <div className="space-y-3">
                {phase.goals.map((goal, goalIndex) => (
                  <p
                    key={`${goal}-${goalIndex}`}
                    className="text-lg leading-relaxed"
                    style={{ color: colors.heading }}
                  >
                    {goal}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoadmapSlide;
