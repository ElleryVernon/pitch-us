/**
 * Vision bold intro slide template component.
 *
 * A presentation slide template for introduction slides with a bold design
 * featuring gradient accents and large typography. Designed for impactful,
 * attention-grabbing presentations.
 */

import React from "react";
import { type as t } from "arktype";
import { ImageSchema } from "@/presentation-templates/default-schemes";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "vision-bold-intro";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Intro";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Bold intro with gradient accent and large typography.";

/**
 * Schema definition for intro slide data.
 *
 * Defines the structure for vision bold intro slide content, including
 * title, subtitle, tagline, presenter info, and hero image.
 */
const introSchema = t({
  title: t("3<=string<=60")
    .describe("Main headline")
    .default("AI transformation partner"),
  subtitle: t("3<=string<=60").describe("Subtitle").default("For enterprise"),
  tagline: t("3<=string<=40").describe("Short tagline").default("Series B"),
  presenterName: t("2<=string<=50")
    .describe("Presenter")
    .default("Michael Park"),
  company: t("2<=string<=60").describe("Company").default("NexaAI"),
  date: t("2<=string<=40").describe("Date").default("Jan 2026"),
  heroImage: ImageSchema.describe("Hero image").default(() => ({
    __image_url__:
      "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=800&q=80",
    __image_prompt__: "Professional speaker at conference",
  })),
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
 * Vision bold intro slide component.
 *
 * Renders a bold intro slide with gradient accents and large typography.
 * Features an impactful, attention-grabbing design. The slide maintains a
 * 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete vision bold intro slide.
 */
const IntroSlide: React.FC<IntroSlideProps> = ({ data }) => {
  const colors = {
    bg: "#fafafa",
    heading: "#0a0a0a",
    body: "#525252",
    muted: "#a3a3a3",
    gradient: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
  };

  return (
    <div
      className="w-full max-w-[1280px] max-h-[720px] aspect-video mx-auto overflow-hidden"
      style={{ background: colors.bg }}
    >
      <div className="h-full grid grid-cols-2">
        {/* Left content */}
        <div className="px-16 py-14 flex flex-col justify-between">
          <div>
            <p
              className="text-sm font-medium mb-6"
              style={{ color: colors.muted }}
            >
              {data?.tagline || "Series B"}
            </p>
            <h1
              className="text-6xl font-bold leading-[1.1] mb-4"
              style={{ color: colors.heading }}
            >
              {data?.subtitle || "For enterprise"}
            </h1>
            <h1
              className="text-6xl font-bold leading-[1.1]"
              style={{
                background: colors.gradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {data?.title || "AI transformation partner"}
            </h1>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3">
            <p
              className="text-sm font-medium"
              style={{ color: colors.heading }}
            >
              {data?.presenterName || "Michael Park"}
            </p>
            <span style={{ color: colors.muted }}>·</span>
            <p className="text-sm" style={{ color: colors.body }}>
              {data?.company || "NexaAI"}
            </p>
            <span style={{ color: colors.muted }}>·</span>
            <p className="text-sm" style={{ color: colors.muted }}>
              {data?.date || "Jan 2026"}
            </p>
          </div>
        </div>

        {/* Right image */}
        <div className="relative flex items-center justify-center p-10">
          <div className="w-full h-full rounded-3xl overflow-hidden">
            <img
              src={
                data?.heroImage?.__image_url__ ||
                "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=800&q=80"
              }
              alt={data?.heroImage?.__image_prompt__ || "Hero"}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroSlide;
