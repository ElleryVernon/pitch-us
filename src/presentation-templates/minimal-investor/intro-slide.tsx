/**
 * Minimal investor intro slide template component.
 *
 * A presentation slide template for introduction slides with an ultra-minimal
 * design featuring large typography and subtle accents. Designed for investor
 * pitch decks with a clean, professional aesthetic.
 */

import React from "react";
import { type as t } from "arktype";
import { ImageSchema } from "@/presentation-templates/default-schemes";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "minimal-investor-intro";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Intro";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Ultra-minimal intro with large typography and subtle accent.";

/**
 * Schema definition for intro slide data.
 *
 * Defines the structure for minimal investor intro slide content, including
 * title, subtitle, summary, presenter info, and hero image.
 */
const introSchema = t({
  title: t("3<=string<=50")
    .describe("Main slide title")
    .default("Finance OS for Modern Startups"),
  subtitle: t("3<=string<=80")
    .describe("Subtitle or deck context")
    .default("Seed Round"),
  summary: t("20<=string<=200")
    .describe("Short company summary")
    .default(
      "We unify spend controls, forecasting, and vendor intelligence into a single workspace for finance leaders.",
    ),
  presenterName: t("2<=string<=50")
    .describe("Presenter name")
    .default("Avery Chen"),
  company: t("2<=string<=60")
    .describe("Company name")
    .default("Northwind Labs"),
  date: t("2<=string<=40").describe("Presentation date").default("Jan 2026"),
  heroImage: ImageSchema.describe("Supporting product or team image").default(
    () => ({
      __image_url__:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
      __image_prompt__: "Minimal workspace with laptop and financial charts",
    }),
  ),
});

/**
 * Exported schema for use in slide generation and validation.
 */
export const Schema = introSchema;

/**
 * TypeScript type inferred from the intro schema.
 */
export type IntroSlideData = typeof introSchema.infer;

/**
 * Props for the IntroSlide component.
 *
 * @property data - Optional partial slide data. All fields have defaults.
 */
interface IntroSlideProps {
  data?: Partial<IntroSlideData>;
}

/**
 * Minimal investor intro slide component.
 *
 * Renders an ultra-minimal intro slide with large typography and subtle accents.
 * Features a clean, professional design optimized for investor presentations.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete minimal intro slide.
 */
const IntroSlide: React.FC<IntroSlideProps> = ({ data }) => {
  const colors = {
    bg: "#ffffff",
    heading: "#171717",
    body: "#525252",
    muted: "#a3a3a3",
    accent: "#2563eb",
    gradient: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
  };

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
              {data?.subtitle || "Seed Round"}
            </p>
            <h1
              className="text-5xl font-bold leading-tight"
              style={{ color: colors.heading }}
            >
              {data?.title || "Finance OS for Modern Startups"}
            </h1>
            <p
              className="text-lg leading-relaxed"
              style={{ color: colors.body }}
            >
              {data?.summary ||
                "We unify spend controls, forecasting, and vendor intelligence into a single workspace for finance leaders."}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3">
            <p
              className="text-sm font-medium"
              style={{ color: colors.heading }}
            >
              {data?.presenterName || "Avery Chen"}
            </p>
            <span style={{ color: colors.muted }}>·</span>
            <p className="text-sm" style={{ color: colors.body }}>
              {data?.company || "Northwind Labs"}
            </p>
            <span style={{ color: colors.muted }}>·</span>
            <p className="text-sm" style={{ color: colors.muted }}>
              {data?.date || "Jan 2026"}
            </p>
          </div>
        </div>

        {/* Right image */}
        <div className="flex items-center justify-center p-10">
          <div className="w-full h-full rounded-2xl overflow-hidden">
            <img
              src={
                data?.heroImage?.__image_url__ ||
                "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80"
              }
              alt={
                data?.heroImage?.__image_prompt__ ||
                data?.title ||
                "Presentation cover"
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
