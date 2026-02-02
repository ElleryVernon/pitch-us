/**
 * Data-driven team slide template component.
 *
 * A presentation slide template for team slides featuring team members and
 * advisors in a clean grid layout. Designed to showcase the founding team
 * and key advisors.
 */

import React from "react";
import { type as t } from "arktype";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "data-driven-team";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Team";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription = "Team slide with clean grid layout.";

/**
 * Schema definition for team slide data.
 *
 * Defines the structure for team slide content, including core team members
 * (name, role, background) and advisors list.
 */
const teamSchema = t({
  title: t("3<=string<=60").describe("Team slide title").default("Team"),
  members: t({
    name: t("2<=string<=40"),
    role: t("2<=string<=40"),
    background: t("6<=string<=90"),
  })
    .array()
    .and(t("3<=unknown[]<=4"))
    .describe("Core team members")
    .default(() => [
      {
        name: "Jordan Lee",
        role: "CEO",
        background: "Ex-Stripe FP&A, built spend stack at Scale",
      },
      {
        name: "Alex Chen",
        role: "CTO",
        background: "Ex-Plaid, led infra for 200+ enterprise customers",
      },
      {
        name: "Maya Brooks",
        role: "Head of GTM",
        background: "Scaled Ramp sales to $80M ARR",
      },
    ]),
  advisors: t("4<=string<=40")
    .array()
    .and(t("2<=unknown[]<=3"))
    .describe("Advisors list")
    .default(() => ["Former CFO, Snowflake", "VP Finance, Brex"]),
});

/**
 * Exported schema for use in slide generation and validation.
 */
export const Schema = teamSchema;

/**
 * TypeScript type inferred from the team schema.
 */
export type TeamSlideData = typeof teamSchema.infer;

/**
 * Props for the TeamSlide component.
 *
 * @property data - Optional partial slide data. All fields have defaults.
 */
interface TeamSlideProps {
  data?: Partial<TeamSlideData>;
}

/**
 * Data-driven team slide component.
 *
 * Renders a team slide with:
 * - Title
 * - Grid of team members (name, role, background)
 * - Advisors list
 *
 * Team members are displayed in a grid layout. The slide maintains a 16:9
 * aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete team slide with members and advisors.
 */
const TeamSlide: React.FC<TeamSlideProps> = ({ data }) => {
  const colors = {
    bg: "#ffffff",
    heading: "#0a0a0a",
    body: "#525252",
    muted: "#a3a3a3",
    surface: "#fafafa",
  };

  const members = data?.members ?? [];
  const advisors = data?.advisors ?? [];

  return (
    <div
      className="w-full max-w-[1280px] max-h-[720px] aspect-video mx-auto overflow-hidden"
      style={{ background: colors.bg }}
    >
      <div className="h-full px-16 py-14 flex flex-col">
        {/* Header */}
        <div className="space-y-4 mb-10">
          <p className="text-sm font-medium" style={{ color: colors.muted }}>
            Team
          </p>
          <h2
            className="text-5xl font-bold leading-tight"
            style={{ color: colors.heading }}
          >
            {data?.title || "Team"}
          </h2>
        </div>

        {/* Team members */}
        <div className="flex-1 grid grid-cols-3 gap-12">
          {members.map((member, index) => (
            <div key={`${member.name}-${index}`} className="flex flex-col">
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold mb-4"
                style={{ backgroundColor: colors.heading, color: colors.bg }}
              >
                {member.name
                  .split(" ")
                  .map((part) => part.charAt(0).toUpperCase())
                  .join("")}
              </div>
              <p
                className="text-2xl font-bold mb-1"
                style={{ color: colors.heading }}
              >
                {member.name}
              </p>
              <p
                className="text-base font-medium mb-3"
                style={{ color: colors.muted }}
              >
                {member.role}
              </p>
              <p
                className="text-base leading-relaxed"
                style={{ color: colors.body }}
              >
                {member.background}
              </p>
            </div>
          ))}
        </div>

        {/* Advisors */}
        <div
          className="rounded-2xl px-8 py-5 flex items-center gap-8 mt-6"
          style={{ background: colors.surface }}
        >
          <p className="text-sm font-medium" style={{ color: colors.muted }}>
            Advisors
          </p>
          <div className="flex gap-6">
            {advisors.map((advisor, index) => (
              <span
                key={`${advisor}-${index}`}
                className="text-base"
                style={{ color: colors.heading }}
              >
                {advisor}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamSlide;
