/**
 * Data-driven intro slide template component.
 *
 * A presentation slide template for introduction slides with a data-forward
 * design. Features prominent metrics display, hero image, and clean typography.
 * Designed for startup pitch decks and investor presentations.
 */

import React from "react";
import { type as t } from "arktype";
import { ImageSchema } from "@/presentation-templates/default-schemes";

/**
 * Unique identifier for this layout template.
 * Used for template selection and referencing in the presentation system.
 */
export const layoutId = "data-driven-intro";

/**
 * Human-readable name for this layout template.
 * Displayed in template selection UI.
 */
export const layoutName = "Intro";

/**
 * Description of this layout template's purpose and design.
 * Helps users understand when to use this template.
 */
export const layoutDescription =
  "Clean data-forward intro with prominent metrics.";

/**
 * Schema definition for intro slide data.
 *
 * Defines the structure and validation rules for data used to populate this
 * slide. Uses ArkType for runtime validation and type inference. Includes
 * default values for all fields to ensure the slide renders even with partial data.
 */
const introSchema = t({
  title: t("3<=string<=60")
    .describe("Intro title")
    .default("Realtime Finance Intelligence"),
  subtitle: t("3<=string<=80").describe("Subtitle text").default("Series A"),
  summary: t("20<=string<=200")
    .describe("Short summary")
    .default(
      "We turn fragmented spend data into automated controls and forecasting for CFOs.",
    ),
  metrics: t({
    label: t("2<=string<=20"),
    value: t("1<=string<=12"),
  })
    .array()
    .and(t("3<=unknown[]<=4"))
    .describe("KPI strip")
    .default(() => [
      { label: "ARR", value: "$4.2M" },
      { label: "Net Retention", value: "138%" },
      { label: "Payback", value: "5 mo" },
    ]),
  presenterName: t("2<=string<=50")
    .describe("Presenter name")
    .default("Jordan Lee"),
  company: t("2<=string<=60").describe("Company name").default("SignalBridge"),
  date: t("2<=string<=40").describe("Presentation date").default("Jan 2026"),
  heroImage: ImageSchema.describe("Dashboard image").default(() => ({
    __image_url__:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    __image_prompt__: "Analytics dashboard with charts and metrics",
  })),
});

/**
 * Exported schema for use in slide generation and validation.
 * Used by the LLM generation system to ensure correct data structure.
 */
export const Schema = introSchema;

/**
 * TypeScript type inferred from the intro schema.
 * Provides type safety when working with intro slide data in TypeScript.
 */
export type IntroSlideData = typeof introSchema.infer;

/**
 * Props for the IntroSlide component.
 *
 * @property data - Optional partial slide data. All fields have defaults,
 *   so the slide will render even if data is empty or incomplete.
 */
interface IntroSlideProps {
  data?: Partial<IntroSlideData>;
}

/**
 * Data-driven intro slide component.
 *
 * Renders a two-column layout with:
 * - Left column: Subtitle, title, summary text, metrics row, and footer
 * - Right column: Hero image
 *
 * Uses a clean, professional color scheme optimized for readability and
 * data presentation. Metrics are displayed prominently in a horizontal row.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete intro slide with all content sections rendered.
 */
const IntroSlide: React.FC<IntroSlideProps> = ({ data }) => {
  const colors = {
    bg: "#ffffff",
    heading: "#0a0a0a",
    body: "#525252",
    muted: "#a3a3a3",
    accent: "#0a0a0a",
  };

  const metrics = data?.metrics ?? [];

  return (
    <div
      className="w-full max-w-[1280px] max-h-[720px] aspect-video mx-auto overflow-hidden"
      style={{ background: colors.bg }}
    >
      <div className="h-full grid grid-cols-2">
        {/* Left content */}
        <div className="px-16 py-14 flex flex-col justify-between">
          <div className="space-y-8">
            <p
              className="text-sm font-medium tracking-wide"
              style={{ color: colors.muted }}
            >
              {data?.subtitle || "Series A"}
            </p>
            <h1
              className="text-5xl font-bold leading-tight"
              style={{ color: colors.heading }}
            >
              {data?.title || "Realtime Finance Intelligence"}
            </h1>
            <p
              className="text-lg leading-relaxed"
              style={{ color: colors.body }}
            >
              {data?.summary ||
                "We turn fragmented spend data into automated controls and forecasting for CFOs."}
            </p>
          </div>

          {/* Metrics row */}
          <div className="space-y-6">
            <div className="flex gap-12">
              {metrics.map((metric, index) => (
                <div key={`${metric.label}-${index}`}>
                  <p
                    className="text-4xl font-bold"
                    style={{ color: colors.heading }}
                  >
                    {metric.value}
                  </p>
                  <p className="text-sm mt-1" style={{ color: colors.muted }}>
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 pt-4">
              <p className="text-sm" style={{ color: colors.heading }}>
                {data?.presenterName || "Jordan Lee"}
              </p>
              <span style={{ color: colors.muted }}>·</span>
              <p className="text-sm" style={{ color: colors.body }}>
                {data?.company || "SignalBridge"}
              </p>
              <span style={{ color: colors.muted }}>·</span>
              <p className="text-sm" style={{ color: colors.muted }}>
                {data?.date || "Jan 2026"}
              </p>
            </div>
          </div>
        </div>

        {/* Right image */}
        <div className="flex items-center justify-center p-10">
          <div className="w-full h-full rounded-2xl overflow-hidden">
            <img
              src={
                data?.heroImage?.__image_url__ ||
                "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
              }
              alt={
                data?.heroImage?.__image_prompt__ || data?.title || "Dashboard"
              }
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroSlide;
