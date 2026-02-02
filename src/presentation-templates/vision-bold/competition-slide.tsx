/**
 * Vision bold competition slide template component.
 *
 * A presentation slide template for competition slides with a bold design
 * featuring gradient accents. Designed for impactful presentations.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "vision-bold-competition";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Competition";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Bold competition slide with gradient accents.";

/**
 * Schema definition for competition slide data.
 */
const competitionSchema = t({
  title: t("3<=string<=60")
    .describe("Competition title")
    .default("Competitive Edge"),
  positioning: t("10<=string<=120")
    .describe("Positioning statement")
    .default("The only platform built for enterprise-grade AI from day one."),
  competitors: t({
    name: t("2<=string<=30"),
    strength: t("6<=string<=40"),
    gap: t("6<=string<=40"),
  })
    .array()
    .and(t("3<=unknown[]<=4"))
    .describe("Competitor comparison")
    .default(() => [
      { name: "Cloud MLOps", strength: "Massive scale", gap: "Vendor lock-in" },
      {
        name: "Open Source",
        strength: "Flexibility",
        gap: "No enterprise support",
      },
      {
        name: "Point Solutions",
        strength: "Specialized",
        gap: "Integration pain",
      },
    ]),
  edges: t("6<=string<=60")
    .array()
    .and(t("3<=unknown[]<=4"))
    .describe("Our advantages")
    .default(() => [
      "Enterprise-grade security & compliance",
      "Cloud-agnostic deployment",
      "Unified platform experience",
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
 * Vision bold competition slide component.
 *
 * Renders a bold competition slide with gradient accents.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete competition slide.
 */
const CompetitionSlide: React.FC<CompetitionSlideProps> = ({ data }) => {
  const colors = {
    bg: "#fafafa",
    heading: "#0a0a0a",
    body: "#525252",
    muted: "#a3a3a3",
    gradient: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
    surface: "#ffffff",
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
              "The only platform built for enterprise-grade AI from day one."}
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
                  style={{ borderTop: `1px solid #e5e5e5` }}
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
