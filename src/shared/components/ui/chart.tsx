/**
 * Chart component system built on Recharts.
 *
 * Provides a wrapper around Recharts for creating data visualizations with
 * consistent styling, theming, and tooltip/legend components. Supports both
 * light and dark themes with automatic color management via CSS variables.
 */

"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

/**
 * Theme selector mapping for CSS variable injection.
 *
 * Maps theme names to CSS selectors used for injecting chart color variables.
 * Light theme uses root selector, dark theme uses .dark class selector.
 */
const THEMES = { light: "", dark: ".dark" } as const;

/**
 * Chart configuration type for defining chart data series styling.
 *
 * Maps data keys to configuration objects that define how each series should
 * be displayed. Supports both static colors and theme-aware colors (different
 * colors for light/dark themes). Can include labels and icons for tooltips
 * and legends.
 *
 * @property [key] - Data key name (e.g., "sales", "revenue", "users").
 * @property [key].label - Optional display label for this data series.
 *   Shown in tooltips and legends.
 * @property [key].icon - Optional React component to display as an icon
 *   for this series in tooltips/legends.
 * @property [key].color - Optional static color (hex string) for this series.
 *   Used when theme is not specified.
 * @property [key].theme - Optional theme-aware colors object. Maps theme names
 *   (light/dark) to color values. Takes precedence over static color.
 */
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

/**
 * Chart context type for sharing chart configuration.
 *
 * Contains the chart configuration object that is shared with child components
 * (tooltips, legends) via React context.
 */
type ChartContextProps = {
  config: ChartConfig;
};

/**
 * React context for sharing chart configuration.
 *
 * Provides chart configuration to child components (ChartTooltipContent,
 * ChartLegendContent) so they can access labels, icons, and colors for
 * data series.
 */
const ChartContext = React.createContext<ChartContextProps | null>(null);

/**
 * Hook to access chart configuration from context.
 *
 * Retrieves the chart configuration from the nearest ChartContainer ancestor.
 * Must be used within a ChartContainer component.
 *
 * @returns ChartContextProps object containing the chart configuration.
 * @throws {Error} Throws an error if used outside of a ChartContainer component.
 */
function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

/**
 * Chart container component that wraps Recharts visualizations.
 *
 * Provides a responsive container for Recharts charts with theme-aware styling
 * and configuration management. Injects CSS variables for chart colors based
 * on the provided configuration and current theme. Wraps charts in a responsive
 * container that adapts to available space.
 *
 * The component:
 * 1. Creates a unique ID for CSS variable injection
 * 2. Provides chart configuration via React context
 * 3. Injects theme-aware CSS variables via ChartStyle
 * 4. Wraps children in ResponsiveContainer for automatic sizing
 *
 * @param id - Optional unique identifier for the chart. If not provided,
 *   a unique ID is generated automatically.
 * @param className - Optional additional CSS classes.
 * @param config - Chart configuration object defining data series colors,
 *   labels, and icons.
 * @param children - Recharts chart components (LineChart, BarChart, etc.)
 *   to render inside the container.
 * @param props - Standard div HTML attributes.
 * @param ref - Forwarded ref to the container div element.
 * @returns A div element containing the chart with theme-aware styling.
 *
 * @example
 * ```tsx
 * <ChartContainer config={{
 *   sales: { label: "Sales", color: "#4CAF50" },
 *   revenue: { label: "Revenue", color: "#2196F3" }
 * }}>
 *   <LineChart data={chartData}>
 *     <Line dataKey="sales" />
 *     <Line dataKey="revenue" />
 *   </LineChart>
 * </ChartContainer>
 * ```
 */
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color,
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`,
          )
          .join("\n"),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

// recharts 3.x: using TooltipContentProps type
interface ChartTooltipContentProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    dataKey?: string | number;
    value?: number | string;
    color?: string;
    payload?: Record<string, unknown>;
    fill?: string;
  }>;
  label?: string | number;
  labelFormatter?: (
    label: string | number | undefined,
    payload: Array<unknown>,
  ) => React.ReactNode;
  labelClassName?: string;
  formatter?: (
    value: number | string,
    name: string,
    item: unknown,
    index: number,
    payload: unknown,
  ) => React.ReactNode;
  color?: string;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  nameKey?: string;
  labelKey?: string;
  className?: string;
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref,
  ) => {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label;

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value as string | number | undefined, payload)}
          </div>
        );
      }

      if (!value) {
        return null;
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>;
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ]);

    if (!active || !payload?.length) {
      return null;
    }

    const nestLabel = payload.length === 1 && indicator !== "dot";

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className,
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const indicatorColor =
              color ||
              (item.payload as Record<string, string>)?.fill ||
              item.color;

            return (
              <div
                key={String(item.dataKey ?? index)}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center",
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            },
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center",
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {typeof item.value === "number"
                            ? item.value.toLocaleString()
                            : item.value}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = "ChartTooltip";

const ChartLegend = RechartsPrimitive.Legend;

// recharts 3.x: Legend content props type
interface ChartLegendContentProps {
  payload?: Array<{
    value?: string;
    dataKey?: string | number;
    color?: string;
    type?: string;
  }>;
  verticalAlign?: "top" | "bottom" | "middle";
  hideIcon?: boolean;
  nameKey?: string;
  className?: string;
}

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref,
  ) => {
    const { config } = useChart();

    if (!payload?.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className,
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground",
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
      </div>
    );
  },
);
ChartLegendContent.displayName = "ChartLegend";

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string,
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string;
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config];
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
