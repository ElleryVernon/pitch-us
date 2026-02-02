/**
 * Product narrative intro slide template component.
 *
 * A presentation slide template for introduction slides with a dark, cinematic
 * design featuring large hero images and minimal text. Designed for product
 * storytelling and narrative-driven presentations.
 */

import React from "react";
import { type as t } from "arktype";
import { ImageSchema } from "@/presentation-templates/default-schemes";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "product-narrative-intro";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Intro";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Dark cinematic intro with large image and minimal text.";

/**
 * Schema definition for intro slide data.
 *
 * Defines the structure for product narrative intro slide content, including
 * title, subtitle, presenter info, and hero image.
 */
const introSchema = t({
  title: t("3<=string<=80")
    .describe("Main headline")
    .default("Transforming scattered data into actionable guidance"),
  subtitle: t("3<=string<=60")
    .describe("Subtitle or tagline")
    .default("Making wellness finally achievable"),
  presenterName: t("2<=string<=50")
    .describe("Presenter name")
    .default("Sarah Kim"),
  company: t("2<=string<=60").describe("Company name").default("HealthSync"),
  date: t("2<=string<=40").describe("Date").default("Jan 2026"),
  heroImage: ImageSchema.describe("Hero image").default(() => ({
    __image_url__:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
    __image_prompt__: "Silhouette of person at sunset, warm tones",
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
 * Product narrative intro slide component.
 *
 * Renders a dark, cinematic intro slide with large hero image and minimal text.
 * Features a dramatic, storytelling-focused design. The slide maintains a 16:9
 * aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete product narrative intro slide.
 */
const IntroSlide: React.FC<IntroSlideProps> = ({ data }) => {
  const colors = {
    bg: "#0a0a0a",
    heading: "#fafafa",
    body: "#a3a3a3",
    muted: "#737373",
  };

  return (
    <div
      className="w-full max-w-[1280px] max-h-[720px] aspect-video mx-auto overflow-hidden relative"
      style={{ background: colors.bg }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={
            data?.heroImage?.__image_url__ ||
            "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80"
          }
          alt={data?.heroImage?.__image_prompt__ || "Hero"}
          className="w-full h-full object-cover opacity-60"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(10,10,10,0.95) 40%, rgba(10,10,10,0.3) 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative h-full px-16 py-14 flex flex-col justify-between">
        <div className="max-w-xl space-y-6">
          <h1
            className="text-5xl font-bold leading-tight"
            style={{ color: colors.heading }}
          >
            {data?.title ||
              "Transforming scattered data into actionable guidance"}
          </h1>
          <p className="text-xl" style={{ color: colors.body }}>
            {data?.subtitle || "Making wellness finally achievable"}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3">
          <p className="text-sm" style={{ color: colors.heading }}>
            {data?.presenterName || "Sarah Kim"}
          </p>
          <span style={{ color: colors.muted }}>·</span>
          <p className="text-sm" style={{ color: colors.body }}>
            {data?.company || "HealthSync"}
          </p>
          <span style={{ color: colors.muted }}>·</span>
          <p className="text-sm" style={{ color: colors.muted }}>
            {data?.date || "Jan 2026"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntroSlide;
