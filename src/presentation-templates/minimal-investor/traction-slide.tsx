/**
 * Minimal investor traction slide template component.
 *
 * A presentation slide template for traction slides with an ultra-minimal design
 * featuring metrics and MRR chart. Uses Recharts for data visualization.
 * Designed for investor pitch decks.
 */

import React from "react";
import { type as t } from "arktype";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

/**
 * Unique identifier for this layout template.
 */
export const layoutId = "minimal-investor-traction";

/**
 * Human-readable name for this layout template.
 */
export const layoutName = "Traction";

/**
 * Description of this layout template's purpose and design.
 */
export const layoutDescription =
  "Ultra-minimal traction slide with metrics and chart.";

/**
 * Schema definition for traction slide data.
 */
const tractionSchema = t({
  title: t("3<=string<=60")
    .describe("Traction title")
    .default("Early Traction"),
  metrics: t({
    label: t("2<=string<=30"),
    value: t("1<=string<=12"),
    change: t("2<=string<=12"),
  })
    .array()
    .and(t("3<=unknown[]<=4"))
    .describe("Key metrics")
    .default(() => [
      { label: "ARR", value: "$1.2M", change: "+18% MoM" },
      { label: "Customers", value: "42", change: "+8 QoQ" },
      { label: "Net Retention", value: "128%", change: "+12 pts" },
    ]),
  chartData: t({
    month: t("2<=string<=6"),
    mrr: t("number"),
  })
    .array()
    .and(t("4<=unknown[]<=8"))
    .describe("Monthly MRR data")
    .default(() => [
      { month: "Jul", mrr: 60 },
      { month: "Aug", mrr: 72 },
      { month: "Sep", mrr: 85 },
      { month: "Oct", mrr: 95 },
      { month: "Nov", mrr: 108 },
      { month: "Dec", mrr: 120 },
    ]),
});

/**
 * Exported schema for use in slide generation and validation.
 */
export const Schema = tractionSchema;

/**
 * TypeScript type inferred from the traction schema.
 */
export type TractionSlideData = typeof tractionSchema.infer;

/**
 * Props for the TractionSlide component.
 *
 * @property data - Optional partial slide data. All fields have defaults.
 */
interface TractionSlideProps {
  data?: Partial<TractionSlideData>;
}

/**
 * Minimal investor traction slide component.
 *
 * Renders an ultra-minimal traction slide with metrics and MRR chart.
 * The slide maintains a 16:9 aspect ratio (1280x720px max).
 *
 * @param data - Optional slide data. Falls back to schema defaults if not provided.
 * @returns A complete traction slide.
 */
const TractionSlide: React.FC<TractionSlideProps> = ({ data }) => {
  const colors = {
    bg: "#ffffff",
    heading: "#171717",
    body: "#525252",
    muted: "#a3a3a3",
    accent: "#2563eb",
    gradient: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
  };

  const metrics = data?.metrics ?? [];
  const chartData = data?.chartData ?? [];

  return (
    <div
      className="w-full max-w-[1280px] max-h-[720px] aspect-video mx-auto overflow-hidden"
      style={{ background: colors.bg }}
    >
      <div className="h-full px-16 py-14 flex flex-col">
        {/* Header */}
        <div className="space-y-4 mb-8">
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
            Traction
          </p>
          <h2
            className="text-5xl font-bold leading-tight"
            style={{ color: colors.heading }}
          >
            {data?.title || "Early Traction"}
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-2 gap-12">
          {/* Metrics */}
          <div className="flex flex-col justify-center gap-8">
            {metrics.map((metric, index) => (
              <div key={`${metric.label}-${index}`}>
                <div className="flex items-baseline gap-4">
                  <p
                    className="text-5xl font-bold"
                    style={{ color: colors.heading }}
                  >
                    {metric.value}
                  </p>
                  <p
                    className="text-lg font-medium"
                    style={{
                      background: colors.gradient,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {metric.change}
                  </p>
                </div>
                <p className="text-sm mt-1" style={{ color: colors.muted }}>
                  {metric.label}
                </p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div
            className="flex flex-col"
            data-chart-type="area"
            data-chart-title="MRR ($K)"
            data-chart-data={JSON.stringify(chartData)}
            data-chart-label-key="month"
            data-chart-value-key="mrr"
            data-chart-color={colors.accent}
          >
            <p
              className="text-sm font-medium mb-4"
              style={{ color: colors.muted }}
            >
              MRR ($K)
            </p>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorMrrMinimal"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={colors.accent}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={colors.accent}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: colors.muted, fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: colors.muted, fontSize: 12 }}
                    tickFormatter={(value) => `$${value}K`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div
                            style={{
                              background: "#ffffff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              padding: "8px 12px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            }}
                          >
                            <p
                              style={{
                                color: colors.accent,
                                fontWeight: 600,
                                fontSize: "14px",
                              }}
                            >
                              ${payload[0].value}K
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mrr"
                    stroke={colors.accent}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMrrMinimal)"
                    dot={{
                      r: 4,
                      fill: colors.accent,
                      strokeWidth: 2,
                      stroke: "#ffffff",
                    }}
                    activeDot={{
                      r: 6,
                      fill: colors.accent,
                      strokeWidth: 2,
                      stroke: "#ffffff",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TractionSlide;
