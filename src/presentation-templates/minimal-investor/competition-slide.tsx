/**
 * Minimal investor competition slide template component.
 *
 * A presentation slide template for competition slides with an ultra-minimal
 * design featuring clean comparisons. Designed for investor pitch decks.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "minimal-investor-competition";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Competition";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Ultra-minimal competition slide with clean comparison.";

/**
 * Schema definition for competition slide data.
 */
const competitionSchema = t({
  title: t("3<=string<=60")
    .describe("Competition title")
    .default("Competitive Edge"),
  positioning: t("10<=string<=120")
    .describe("Positioning statement")
    .default(
      "We combine the automation of modern tools with enterprise-grade governance.",
    ),
  competitors: t({
    name: t("2<=string<=30"),
    strength: t("6<=string<=40"),
    gap: t("6<=string<=40"),
  })
    .array()
    .and(t("3<=unknown[]<=4"))
    .describe("Competitor comparison")
    .default(() => [
      { name: "Legacy ERP", strength: "Broad coverage", gap: "Slow to deploy" },
      { name: "Point Tools", strength: "Easy setup", gap: "Limited insights" },
      {
        name: "Spreadsheets",
        strength: "Flexible",
        gap: "Manual and error-prone",
      },
    ]),
  edges: t("6<=string<=60")
    .array()
    .and(t("3<=unknown[]<=4"))
    .describe("Our advantages")
    .default(() => [
      "Real-time commitment tracking",
      "Automated policy enforcement",
      "Board-ready reporting in minutes",
    ]),
});

/**
 * Exported schema for use in slide generation and validation.
 */
export const Schema = competitionSchema;

/**
 * TypeScript type inferred from the competition schema.
 */
export type CompetitionSlideData = typeof competitionSchema.infer;

/**
 * Props for the CompetitionSlide component.
 *
 * @property data - Optional partial slide data. All fields have defaults.
 */
interface CompetitionSlideProps {
  data?: Partial<CompetitionSlideData>;
}

/**
 * Minimal investor competition slide component.
 *
 * Renders an ultra-minimal competition slide with clean comparisons.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete competition slide.
 */
const CompetitionSlide: React.FC<CompetitionSlideProps> = ({ data }) => {
  const colors = {
    bg: "#ffffff",
    heading: "#171717",
    body: "#525252",
    muted: "#a3a3a3",
    accent: "#2563eb",
    gradient: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
    surface: "#fafafa",
  };

  const competitors = data?.competitors ?? [];
  const edges = data?.edges ?? [];

  return (
    <div
      className="w-full max-w-[1280px] max-h-[720px] aspect-video mx-auto overflow-hidden"
      style={{ background: colors.bg }}
    >
      <div className="h-full px-16 py-14 flex flex-col">
        {/* Header */}
        <div className="space-y-4 mb-10">
          <p className="text-sm font-medium" style={{ color: colors.muted }}>
            Competition
          </p>
          <h2
            className="text-5xl font-bold leading-tight"
            style={{ color: colors.heading }}
          >
            {data?.title || "Competitive Edge"}
          </h2>
          <p
            className="text-xl leading-relaxed max-w-3xl"
            style={{ color: colors.body }}
          >
            {data?.positioning ||
              "We combine the automation of modern tools with enterprise-grade governance."}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-[1.2fr_0.8fr] gap-12">
          {/* Competitor table */}
          <div>
            <div
              className="grid grid-cols-3 text-sm font-medium pb-4"
              style={{ color: colors.muted }}
            >
              <span>Player</span>
              <span>Strength</span>
              <span>Opportunity</span>
            </div>
            <div>
              {competitors.map((competitor, index) => (
                <div
                  key={`${competitor.name}-${index}`}
                  className="grid grid-cols-3 gap-4 py-4"
                  style={{ borderTop: `1px solid ${colors.surface}` }}
                >
                  <span
                    className="text-lg font-medium"
                    style={{ color: colors.heading }}
                  >
                    {competitor.name}
                  </span>
                  <span className="text-base" style={{ color: colors.body }}>
                    {competitor.strength}
                  </span>
                  <span className="text-base" style={{ color: colors.muted }}>
                    {competitor.gap}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Our edge */}
          <div
            className="rounded-2xl p-8"
            style={{ background: colors.surface }}
          >
            <p
              className="text-sm font-medium mb-6"
              style={{
                background: colors.gradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent",
                width: "fit-content",
              }}
            >
              Our Edge
            </p>
            <div className="space-y-4">
              {edges.map((edge, index) => (
                <p
                  key={`${edge}-${index}`}
                  className="text-lg leading-relaxed"
                  style={{ color: colors.heading }}
                >
                  {edge}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionSlide;
