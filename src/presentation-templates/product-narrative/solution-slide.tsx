/**
 * Product narrative solution slide template component.
 *
 * A presentation slide template for solution slides with a dark, cinematic design
 * featuring visual product showcases. Designed for product narrative presentations.
 */

import React from "react";
import { type as t } from "arktype";
import { ImageSchema } from "@/presentation-templates/default-schemes";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "product-narrative-solution";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Solution";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Dark solution slide with visual product showcase.";

/**
 * Schema definition for solution slide data.
 */
const solutionSchema = t({
  title: t("3<=string<=60").describe("Solution title").default("How it works"),
  pillars: t({
    title: t("3<=string<=30"),
    description: t("10<=string<=100"),
    image: ImageSchema,
  })
    .array()
    .and(t("3<=unknown[]<=4"))
    .describe("Solution pillars with images")
    .default(() => [
      {
        title: "Connect & collect",
        description:
          "Seamlessly integrate your existing devices and health data",
        image: {
          __image_url__:
            "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=400&q=80",
          __image_prompt__: "Smart devices and health tracking",
        },
      },
      {
        title: "Analyze & learn",
        description:
          "Our AI identifies patterns unique to your body and lifestyle",
        image: {
          __image_url__:
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80",
          __image_prompt__: "Data analysis visualization",
        },
      },
      {
        title: "Guide & adapt",
        description: "Receive daily micro-adjustments that fit your schedule",
        image: {
          __image_url__:
            "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80",
          __image_prompt__: "Person achieving wellness goals",
        },
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
 * Product narrative solution slide component.
 *
 * Renders a dark solution slide with visual product showcases and pillars.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete solution slide.
 */
const SolutionSlide: React.FC<SolutionSlideProps> = ({ data }) => {
  const colors = {
    bg: "#0a0a0a",
    heading: "#fafafa",
    body: "#a3a3a3",
    muted: "#737373",
  };

  const pillars = data?.pillars ?? [];

  return (
    <div
      className="w-full max-w-[1280px] max-h-[720px] aspect-video mx-auto overflow-hidden"
      style={{ background: colors.bg }}
    >
      <div className="h-full px-16 py-14 flex flex-col">
        {/* Header */}
        <div className="mb-10">
          <p
            className="text-sm font-medium mb-4"
            style={{ color: colors.muted }}
          >
            Solution
          </p>
          <h2
            className="text-5xl font-bold leading-tight"
            style={{ color: colors.heading }}
          >
            {data?.title || "How it works"}
          </h2>
        </div>

        {/* Pillars with images */}
        <div className="flex-1 grid grid-cols-4 gap-6">
          {pillars.map((pillar, index) => (
            <div key={`${pillar.title}-${index}`} className="flex flex-col">
              {/* Image */}
              <div className="aspect-[4/5] rounded-xl overflow-hidden mb-4">
                <img
                  src={pillar.image?.__image_url__ || ""}
                  alt={pillar.image?.__image_prompt__ || pillar.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Text */}
              <p
                className="text-xs font-medium mb-2"
                style={{ color: colors.muted }}
              >
                {String(index + 1).padStart(2, "0")} / {pillar.title}
              </p>
              <p
                className="text-sm leading-relaxed"
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
