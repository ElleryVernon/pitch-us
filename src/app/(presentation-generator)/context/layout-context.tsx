/**
 * Layout context provider for managing presentation template layouts.
 *
 * Provides a React context for loading, caching, and accessing presentation
 * template layouts dynamically. Handles fetching layout metadata from the
 * server, compiling layout components from source code using Babel, and
 * managing a cache of compiled components. Supports multiple templates
 * and provides utilities for accessing layouts by template ID or layout ID.
 */

"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { usePresentationUIStore } from "@/stores";

import * as Babel from "@babel/standalone";
import * as Recharts from "recharts";

import { getHeader } from "../services/api/header";

/**
 * JSON schema structure for layout data validation.
 *
 * Defines the structure of JSON schemas used to validate data passed to
 * layout components. Supports nested objects, arrays, and required fields.
 *
 * @property type - Schema type (e.g., "object", "array", "string").
 * @property properties - Properties for object types (nested schemas).
 * @property items - Schema for array item types.
 * @property required - Array of required property names.
 * @property description - Human-readable description of the schema.
 */
export interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  description?: string;
}

/**
 * Layout metadata structure.
 *
 * Contains information about a single presentation layout, including its
 * identifier, name, description, JSON schema, and associated template.
 *
 * @property id - Unique layout identifier.
 * @property name - Optional human-readable layout name.
 * @property description - Optional layout description.
 * @property json_schema - JSON schema for validating layout data.
 * @property templateID - Template identifier this layout belongs to.
 * @property templateName - Optional template name.
 */
export interface LayoutInfo {
  id: string;
  name?: string;
  description?: string;
  json_schema: JsonSchema;
  templateID: string;
  templateName?: string;
}

/**
 * Complete layout data structure.
 *
 * Contains a compiled layout component along with its metadata, schema,
 * sample data, and file information. Used for rendering layouts dynamically.
 *
 * @property name - Layout name.
 * @property component - Compiled React component for rendering the layout.
 * @property schema - JSON schema for layout data validation.
 * @property sampleData - Sample data for preview/testing purposes.
 * @property fileName - Source file name for this layout.
 * @property templateID - Template identifier.
 * @property layoutId - Unique layout identifier.
 */
export interface FullDataInfo {
  name: string;
  component: React.ComponentType<{ data: Record<string, unknown> }>;
  schema: JsonSchema;
  sampleData: Record<string, unknown>;
  fileName: string;
  templateID: string;
  layoutId: string;
}

/**
 * Template settings structure.
 *
 * Configuration for a presentation template, including description, ordering,
 * and default selection status.
 *
 * @property description - Template description.
 * @property ordered - Whether layouts should be displayed in a specific order.
 * @property default - Whether this template is the default selection.
 */
export interface TemplateSetting {
  description: string;
  ordered: boolean;
  default?: boolean;
}

/**
 * Template response structure from API.
 *
 * Represents template metadata returned from the server, including its
 * identifier, name, layout files, and settings.
 *
 * @property templateID - Unique template identifier.
 * @property templateName - Optional template name.
 * @property files - Array of layout file names belonging to this template.
 * @property settings - Template settings, or null if not configured.
 */
export interface TemplateResponse {
  templateID: string;
  templateName?: string;
  files: string[];
  settings: TemplateSetting | null;
}

/**
 * Complete layout data structure for internal use.
 *
 * Organizes all layout information in efficient data structures (Maps) for
 * fast lookups by ID, template ID, or file name.
 *
 * @property layoutsById - Map of layout ID to layout info.
 * @property layoutsByTemplateID - Map of template ID to set of layout IDs.
 * @property templateSettings - Map of template ID to template settings.
 * @property fileMap - Map of layout ID to file metadata.
 * @property templateLayouts - Map of template ID to ordered layout array.
 * @property layoutSchema - Array of all layout info objects.
 * @property fullDataByTemplateID - Map of template ID to full layout data.
 */
export interface LayoutData {
  layoutsById: Map<string, LayoutInfo>;
  layoutsByTemplateID: Map<string, Set<string>>;
  templateSettings: Map<string, TemplateSetting>;
  fileMap: Map<string, { fileName: string; templateID: string }>;
  templateLayouts: Map<string, LayoutInfo[]>;
  layoutSchema: LayoutInfo[];
  fullDataByTemplateID: Map<string, FullDataInfo[]>;
}

/**
 * Type alias for layout component.
 * Layout components receive data as a record of unknown values.
 */
type LayoutComponent = React.ComponentType<{ data: Record<string, unknown> }>;

/**
 * Layout context interface.
 *
 * Defines the API provided by the LayoutContext, including methods for
 * accessing layouts, templates, and managing the layout cache.
 *
 * @property getLayoutById - Get layout info by layout ID.
 * @property getLayoutsByTemplateID - Get all layouts for a template.
 * @property getTemplateSetting - Get template settings by template ID.
 * @property getAllTemplateIDs - Get all available template IDs.
 * @property getAllLayouts - Get all layout info objects.
 * @property getFullDataByTemplateID - Get compiled layouts for a template.
 * @property loading - Whether layouts are currently being loaded.
 * @property error - Error message if loading failed, null otherwise.
 * @property getLayout - Get compiled layout component by layout ID.
 * @property isPreloading - Whether layouts are being preloaded.
 * @property cacheSize - Number of layouts currently cached.
 * @property refetch - Manually trigger a refetch of layout data.
 * @property getCustomTemplateFonts - Get custom fonts for a presentation.
 */
export interface LayoutContextType {
  getLayoutById: (layoutId: string) => LayoutInfo | null;

  getLayoutsByTemplateID: (templateID: string) => LayoutInfo[];
  getTemplateSetting: (templateID: string) => TemplateSetting | null;
  getAllTemplateIDs: () => string[];
  getAllLayouts: () => LayoutInfo[];
  getFullDataByTemplateID: (templateID: string) => FullDataInfo[];
  loading: boolean;
  error: string | null;
  getLayout: (layoutId: string) => LayoutComponent | null;
  isPreloading: boolean;
  cacheSize: number;
  refetch: () => Promise<void>;
  getCustomTemplateFonts: (presentationId: string) => string[] | null;
}

/**
 * React context for layout management.
 * Provides layout data and utilities to child components.
 */
const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

/**
 * Cache for compiled layout components.
 * Maps cache keys (templateID/fileName) to compiled React components.
 */
const layoutCache = new Map<string, LayoutComponent>();

/**
 * Creates a cache key for layout components.
 *
 * @param templateID - Template identifier.
 * @param fileName - Layout file name.
 * @returns Cache key string in format "templateID/fileName".
 */
const createCacheKey = (templateID: string, fileName: string): string =>
  `${templateID}/${fileName}`;

/**
 * Compiles custom layout code into a React component.
 *
 * Transforms TypeScript/JSX layout code using Babel, removes import statements,
 * and executes it in a sandboxed environment with React, ArkType, and Recharts
 * available. Dynamically imports arktype to prevent HMR (Hot Module Replacement)
 * issues during development.
 *
 * @param layoutCode - Raw TypeScript/JSX code for the layout component.
 * @param React - React library object to use in the compiled code.
 * @returns Object containing the compiled component, layout metadata, and schema.
 */
const compileCustomLayout = async (layoutCode: string, React: any) => {
  const { type: t } = await import("arktype");

  const cleanCode = layoutCode
    .replace(/import\s+React\s+from\s+'react';?/g, "")
    .replace(/import\s*{\s*type\s+as\s+t\s*}\s*from\s+['"]arktype['"];?/g, "")
    .replace(/import\s*{\s*t\s*}\s*from\s+['"]arktype['"];?/g, "")
    .replace(/import\s+.*\s+from\s+['"]arktype['"];?/g, "")
    .replace(/typescript/g, "");
  const compiled = Babel.transform(cleanCode, {
    presets: [
      ["react", { runtime: "classic" }],
      ["typescript", { isTSX: true, allExtensions: true }],
    ],
    sourceType: "script",
  }).code;

  const factory = new Function(
    "React",
    "_t",
    "Recharts",

    `
    const t = _t;
   
    const useRef= React.useRef;
    const useEffect= React.useEffect;
    // Expose commonly used Recharts components to compiled layouts
    const { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, ScatterChart, Scatter, FunnelChart, Funnel, TreemapChart, Treemap, SankeyChart, Sankey, RadialBarChart, RadialBar, ReferenceLine, ReferenceDot, ReferenceArea, Brush, ErrorBar, LabelList, Label } = Recharts || {};
    
      ${compiled}

      /* everything declared in the string is in scope here */
      return {
        __esModule: true,   
        default: typeof dynamicSlideLayout !== 'undefined' ? dynamicSlideLayout : (typeof DefaultLayout !== 'undefined' ? DefaultLayout : undefined),
        layoutName,
        layoutId,
        layoutDescription,
        Schema
      };
    `,
  );

  return factory(React, t, Recharts);
};

/**
 * Props for the LayoutProvider component.
 *
 * @property children - React nodes to render inside the provider.
 */
export const LayoutProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  /**
   * Layout provider component.
   *
   * Manages the lifecycle of layout data loading, compilation, and caching.
   * Fetches layout metadata from the server, compiles layout components
   * dynamically, and provides layout access utilities to child components
   * via context. Handles loading states, errors, and font management.
   *
   * Features:
   * - Fetches template and layout metadata from API
   * - Compiles layout components from source code using Babel
   * - Caches compiled components for performance
   * - Preloads layouts for faster rendering
   * - Manages custom template fonts
   * - Provides refetch capability for manual updates
   *
   * @param children - React nodes to render inside the provider.
   * @returns LayoutContext.Provider with layout data and utilities.
   */
  const [layoutData, setLayoutData] = useState<LayoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreloading, setIsPreloading] = useState(false);
  const [customTemplateFonts, setCustomTemplateFonts] = useState<
    Map<string, string[]>
  >(new Map());
  const setLayoutLoading = usePresentationUIStore((state) => state.setLayoutLoading);

  const buildData = async (templateData: TemplateResponse[]) => {
    const layouts: LayoutInfo[] = [];

    const layoutsById = new Map<string, LayoutInfo>();
    const layoutsByTemplateID = new Map<string, Set<string>>();
    const templateSettingsMap = new Map<string, TemplateSetting>();
    const fileMap = new Map<string, { fileName: string; templateID: string }>();
    const templateLayoutsCache = new Map<string, LayoutInfo[]>();
    const fullDataByTemplateID = new Map<string, FullDataInfo[]>();

    // Start preloading process
    setIsPreloading(true);

    // Helper to remove default values from JSON schema
    const removeDefaults = (obj: unknown): unknown => {
      if (typeof obj !== "object" || obj === null) return obj;
      if (Array.isArray(obj)) return obj.map(removeDefaults);
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (key === "default") continue;
        result[key] = removeDefaults(value);
      }
      return result;
    };

    try {
      // 1. Initialize template settings (sync operation)
      for (const template of templateData) {
        if (!layoutsByTemplateID.has(template.templateID)) {
          layoutsByTemplateID.set(template.templateID, new Set());
        }
        fullDataByTemplateID.set(template.templateID, []);

        const settings = template.settings || {
          templateName: template.templateName,
          description: `${template.templateID} presentation layouts`,
          ordered: false,
          default: false,
        };
        templateSettingsMap.set(template.templateID, settings);
        templateLayoutsCache.set(template.templateID, []);
      }

      // 2. Parallel import all template files
      type ImportResult = {
        template: TemplateResponse;
        fileName: string;
        module: any;
        error: Error | null;
      };

      const importPromises = templateData.flatMap((template) =>
        template.files.map(async (fileName): Promise<ImportResult> => {
          try {
            const file = fileName.replace(".tsx", "").replace(".ts", "");
            const module = await import(
              `@/presentation-templates/${template.templateID}/${file}`
            );
            return { template, fileName, module, error: null };
          } catch (error) {
            return { template, fileName, module: null, error: error as Error };
          }
        }),
      );

      const results = await Promise.all(importPromises);

      // 3. Process import results
      for (const { template, fileName, module, error } of results) {
        if (error) {
          console.error(
            `💥 Error importing ${fileName} from ${template.templateID}:`,
            error,
          );
          continue;
        }

        const file = fileName.replace(".tsx", "").replace(".ts", "");

        if (!module.default) {
          toast.error(`${file} has no default export`, {
            description: "Please ensure the layout file exports a default component",
          });
          console.warn(`❌ ${file} has no default export`);
          continue;
        }

        if (!module.Schema) {
          toast.error(`${file} has no Schema export`, {
            description: "Please ensure the layout file exports a Schema",
          });
          console.warn(`❌ ${file} has no Schema export`);
          continue;
        }

        // Cache the layout component
        const cacheKey = createCacheKey(template.templateID, fileName);
        if (!layoutCache.has(cacheKey)) {
          layoutCache.set(cacheKey, module.default);
        }

        const originalLayoutId =
          module.layoutId || file.toLowerCase().replace(/layout$/, "");
        const uniqueKey = `${template.templateID}:${originalLayoutId}`;
        const layoutName =
          module.layoutName || file.replace(/([A-Z])/g, " $1").trim();
        const layoutDescription =
          module.layoutDescription || `${layoutName} layout for presentations`;

        let jsonSchema: Record<string, unknown> = {};
        try {
          const schemaJson = module.Schema.toJsonSchema({
            fallback: (ctx: { base: unknown }) => ctx.base,
          });
          jsonSchema = removeDefaults(schemaJson) as Record<string, unknown>;
        } catch (jsonSchemaError) {
          console.warn(
            `⚠️ Failed to generate JSON schema for ${fileName}:`,
            jsonSchemaError,
          );
        }

        const layout: LayoutInfo = {
          id: uniqueKey,
          name: layoutName,
          description: layoutDescription,
          json_schema: jsonSchema,
          templateID: template.templateID,
          templateName: template.templateName,
        };

        let sampleData: object = {};
        try {
          const parseResult = module.Schema({});
          if (
            parseResult &&
            typeof parseResult === "object" &&
            "data" in parseResult &&
            parseResult.data !== undefined
          ) {
            sampleData = parseResult.data as object;
          } else if (
            parseResult &&
            typeof parseResult === "object" &&
            !("problems" in parseResult)
          ) {
            sampleData = parseResult as object;
          }
        } catch {
          // If parsing fails, use empty object as sample data
        }

        const fullData: FullDataInfo = {
          name: layoutName,
          component: module.default,
          schema: jsonSchema,
          sampleData: sampleData as Record<string, unknown>,
          fileName,
          templateID: template.templateID,
          layoutId: uniqueKey,
        };

        // Add to collections
        layoutsById.set(uniqueKey, layout);
        layoutsByTemplateID.get(template.templateID)!.add(uniqueKey);
        fileMap.set(uniqueKey, { fileName, templateID: template.templateID });
        layouts.push(layout);

        // Add to template-specific collections
        const templateLayouts = templateLayoutsCache.get(template.templateID)!;
        templateLayouts.push(layout);

        const templateFullData = fullDataByTemplateID.get(template.templateID)!;
        templateFullData.push(fullData);
      }
    } catch (err: any) {
      console.error("Compilation error:", err);
    }

    return {
      layoutsById,
      layoutsByTemplateID,
      templateSettings: templateSettingsMap,
      fileMap,
      templateLayoutsCache,
      layoutSchema: layouts,
      fullDataByTemplateID,
    };
  };

  const loadLayouts = async () => {
    try {
      setLoading(true);
      setError(null);
      setLayoutLoading(true);

      const templateResponse = await fetch("/api/v1/templates");

      if (!templateResponse.ok) {
        throw new Error(
          `Failed to fetch layouts: ${templateResponse.statusText}`,
        );
      }

      const templateData: TemplateResponse[] = await templateResponse.json();

      if (!templateData || templateData.length === 0) {
        setError("No template found");
        return;
      }

      const data = await buildData(templateData);
      const customLayouts = await LoadCustomLayouts();
      setIsPreloading(false);
      const combinedData = {
        layoutsById: mergeMaps(data.layoutsById, customLayouts.layoutsById),
        layoutsByTemplateID: mergeMaps(
          data.layoutsByTemplateID,
          customLayouts.layoutsByTemplateID,
        ),
        templateSettings: mergeMaps(
          data.templateSettings,
          customLayouts.templateSettings,
        ),
        fileMap: mergeMaps(data.fileMap, customLayouts.fileMap),
        templateLayouts: mergeMaps(
          data.templateLayoutsCache,
          customLayouts.templateLayoutsCache,
        ),
        layoutSchema: [...data.layoutSchema, ...customLayouts.layoutSchema],
        fullDataByTemplateID: mergeMaps(
          data.fullDataByTemplateID,
          customLayouts.fullDataByTemplateID,
        ),
      };

      setLayoutData(combinedData);

      // The preloading is now handled within buildData
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load layouts";
      setError(errorMessage);
      console.error("💥 Error loading layouts:", err);
    } finally {
      setLayoutLoading(false);
      setLoading(false);
    }
  };

  function mergeMaps<K, V>(map1: Map<K, V>, map2: Map<K, V>): Map<K, V> {
    const merged = new Map(map1);
    map2.forEach((value, key) => {
      merged.set(key, value);
    });
    return merged;
  }

  const LoadCustomLayouts = async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    const layouts: LayoutInfo[] = [];
    const layoutsById = new Map<string, LayoutInfo>();
    const layoutsByTemplateID = new Map<string, Set<string>>();
    const templateSettingsMap = new Map<string, TemplateSetting>();
    const fileMap = new Map<string, { fileName: string; templateID: string }>();
    const templateLayoutsCache = new Map<string, LayoutInfo[]>();
    const fullDataByTemplateID = new Map<string, FullDataInfo[]>();
    try {
      const customTemplateResponse = await fetch(
        `/api/v1/templates/summary`,
        {
          headers: {
            ...getHeader(),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      const customTemplateData = await customTemplateResponse.json();

      const customFonts = new Map<string, string[]>();
      const customTemplates = customTemplateData.presentations || [];
      for (const templateInfo of customTemplates) {
        const pid =
          (templateInfo &&
            (templateInfo.presentation_id ||
              templateInfo.presentation ||
              templateInfo.id)) ||
          "";
        if (!pid) {
          // skip invalid entries
          continue;
        }
        const templateID = `custom-${pid}`;
        const templateName = templateInfo.template?.name || templateID;
        fullDataByTemplateID.set(templateID, []);
        if (!layoutsByTemplateID.has(templateID)) {
          layoutsByTemplateID.set(templateID, new Set());
        }
        const presentationId = pid;
        const customLayoutResponse = await fetch(
          `/api/v1/templates/${presentationId}`,
          {
            headers: {
              ...getHeader(),
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );
        const customLayoutsData = await customLayoutResponse.json();
        const allLayout = customLayoutsData.layouts;

        const settings = {
          templateName: templateName,
          description: `Custom presentation layouts`,
          ordered: false,
          default: false,
        };

        templateSettingsMap.set(`custom-${presentationId}`, settings);
        const templateLayouts: LayoutInfo[] = [];
        const templateFullData: FullDataInfo[] = [];

        // Helper to create an inline error component for this specific slide
        const createErrorComponent = (
          title: string,
          message: string,
        ): React.ComponentType<{ data: any }> => {
          const ErrorSlide: React.FC<{ data: any }> = () => (
            <div className="aspect-video w-full h-full bg-red-50 text-red-700 flex flex-col items-start justify-start p-4 space-y-2">
              <div className="text-sm font-semibold">{title}</div>
              <pre className="text-xs whitespace-pre-wrap wrap-break-word max-h-full overflow-auto bg-red-100 rounded-md p-2 border border-red-200">
                {message}
              </pre>
            </div>
          );
          ErrorSlide.displayName = "CustomTemplateErrorSlide";
          return ErrorSlide;
        };

        for (const i of allLayout) {
          try {
            /* ---------- 1. compile JSX to plain script ------------------ */
            const module = await compileCustomLayout(i.layout_code, React);

            // Determine identifiers even if subsequent steps fail
            const originalLayoutId =
              (module && (module as any).layoutId) ||
              i.layout_name.toLowerCase().replace(/layout$/, "");
            const uniqueKey = `${`custom-${presentationId}`}:${originalLayoutId}`;
            const layoutName =
              (module && (module as any).layoutName) ||
              i.layout_name.replace(/([A-Z])/g, " $1").trim();
            const layoutDescription =
              (module && (module as any).layoutDescription) ||
              `${layoutName} layout for presentations`;

            let fullData: FullDataInfo | null = null;
            let jsonSchema: any = null;
            let componentToUse: React.ComponentType<
              { data: any } | any
            > | null = null;
            let sampleData: any = {};

            // Validate exports
            if (!module || !(module as any).default) {
              const errorComp = createErrorComponent(
                `Invalid export in ${i.layout_name}`,
                "Default export not found. Please export a default React component.",
              );
              componentToUse = errorComp;
              jsonSchema = {};
            } else if (!(module as any).Schema) {
              const errorComp = createErrorComponent(
                `Schema missing in ${i.layout_name}`,
                "Schema export not found. Please export an ArkType Schema as 'Schema'.",
              );
              componentToUse = errorComp;
              jsonSchema = {};
            } else {
              // Cache valid component
              const cacheKey = createCacheKey(
                `custom-${presentationId}`,
                i.layout_name,
              );
              if (!layoutCache.has(cacheKey)) {
                layoutCache.set(cacheKey, (module as any).default);
              }
              componentToUse = (module as any).default;

              // Build schema and sample data with guards
              try {
                // Use fallback option to handle predicates that arktype cannot convert
                const schemaJson = (
                  module as {
                    Schema: {
                      toJsonSchema: (opts?: {
                        fallback?: (ctx: { base: unknown }) => unknown;
                      }) => Record<string, unknown>;
                    };
                  }
                ).Schema.toJsonSchema({
                  fallback: (ctx: { base: unknown }) => ctx.base,
                });
                // Remove default values from JSON schema
                const removeDefaults = (obj: unknown): unknown => {
                  if (typeof obj !== "object" || obj === null) return obj;
                  if (Array.isArray(obj)) return obj.map(removeDefaults);
                  const result: Record<string, unknown> = {};
                  for (const [key, value] of Object.entries(
                    obj as Record<string, unknown>,
                  )) {
                    if (key === "default") continue;
                    result[key] = removeDefaults(value);
                  }
                  return result;
                };
                jsonSchema = removeDefaults(schemaJson) as Record<
                  string,
                  unknown
                >;
              } catch (schemaErr: unknown) {
                const errorMessage =
                  schemaErr instanceof Error
                    ? schemaErr.message
                    : String(schemaErr);
                const errorComp = createErrorComponent(
                  `Schema generation failed for ${i.layout_name}`,
                  errorMessage,
                );
                componentToUse = errorComp;
                jsonSchema = {};
              }

              if (
                componentToUse !== null &&
                componentToUse !== (module as { default: unknown }).default
              ) {
                // componentToUse already replaced with error component
                sampleData = {};
              } else {
                // arktype 2.x: call Schema directly as a function
                try {
                  const parseResult = (
                    module as { Schema: (input: object) => unknown }
                  ).Schema({});
                  if (
                    parseResult &&
                    typeof parseResult === "object" &&
                    "data" in parseResult &&
                    (parseResult as { data?: object }).data !== undefined
                  ) {
                    sampleData = (parseResult as { data: object }).data;
                  } else if (
                    parseResult &&
                    typeof parseResult === "object" &&
                    !("problems" in parseResult)
                  ) {
                    sampleData = parseResult as object;
                  } else {
                    sampleData = {};
                  }
                } catch {
                  sampleData = {};
                }
              }
            }

            customFonts.set(presentationId, i.fonts);

            const layout: LayoutInfo = {
              id: uniqueKey,
              name: layoutName,
              description: layoutDescription,
              json_schema: jsonSchema,
              templateID: templateID,
              templateName: templateName,
            };

            fullData = {
              name: layoutName,
              component: componentToUse as React.ComponentType<any>,
              schema: jsonSchema,
              sampleData: sampleData,
              fileName: i.layout_name,
              templateID: templateID,
              layoutId: uniqueKey,
            };

            templateFullData.push(fullData);

            layoutsById.set(uniqueKey, layout);
            layoutsByTemplateID.get(templateID)!.add(uniqueKey);
            fileMap.set(uniqueKey, {
              fileName: i.layout_name,
              templateID: templateID,
            });
            templateLayouts.push(layout);
            layouts.push(layout);
          } catch (e: any) {
            // Handle compilation/runtime errors during transformation
            const uniqueKey = `${`custom-${presentationId}`}:${i.layout_name.toLowerCase().replace(/layout$/, "")}`;
            const layoutName = i.layout_name.replace(/([A-Z])/g, " $1").trim();
            const errorComp = createErrorComponent(
              `Compilation error in ${i.layout_name}`,
              e?.message || String(e),
            );

            const layout: LayoutInfo = {
              id: uniqueKey,
              name: layoutName,
              description: `Failed to compile ${i.layout_name}`,
              json_schema: {},
              templateID: templateID,
              templateName: templateName,
            };

            const fullData: FullDataInfo = {
              name: layoutName,
              component: errorComp,
              schema: {},
              sampleData: {},
              fileName: i.layout_name,
              templateID: templateID,
              layoutId: uniqueKey,
            };

            templateFullData.push(fullData);
            layoutsById.set(uniqueKey, layout);
            layoutsByTemplateID.get(templateID)!.add(uniqueKey);
            fileMap.set(uniqueKey, {
              fileName: i.layout_name,
              templateID: templateID,
            });
            templateLayouts.push(layout);
            layouts.push(layout);
          }
        }
        setCustomTemplateFonts(customFonts);
        // Cache template layouts
        templateLayoutsCache.set(templateID, templateLayouts);
        fullDataByTemplateID.set(templateID, templateFullData);
      }
    } catch (err: any) {
      console.error("Compilation error:", err);
    }

    return {
      layoutsById,
      layoutsByTemplateID,
      templateSettings: templateSettingsMap,
      fileMap,
      templateLayoutsCache,
      layoutSchema: layouts,
      fullDataByTemplateID,
    };
  };

  const getLayout = (
    layoutId: string,
  ): React.ComponentType<{ data: any }> | null => {
    if (!layoutData) return null;

    let fileInfo: { fileName: string; templateID: string } | undefined;

    // Search through all fileMap entries to find the layout
    for (const [key, info] of Array.from(layoutData.fileMap.entries())) {
      if (key === layoutId) {
        fileInfo = info;
        break;
      }
    }

    if (!fileInfo) {
      console.warn(`No file info found for layout: ${layoutId}`);
      return null;
    }

    const cacheKey = createCacheKey(fileInfo.templateID, fileInfo.fileName);

    // Return cached layout if available
    if (layoutCache.has(cacheKey)) {
      return layoutCache.get(cacheKey)!;
    }
    // Create and cache layout if not available
    const file = fileInfo.fileName.replace(".tsx", "").replace(".ts", "");
    const Layout = dynamic(
      () => import(`@/presentation-templates/${fileInfo.templateID}/${file}`),
      {
        loading: () => (
          <div className="w-full aspect-video bg-gray-100 animate-pulse rounded-lg" />
        ),
        ssr: false,
      },
    ) as React.ComponentType<{ data: any }>;

    layoutCache.set(cacheKey, Layout);
    return Layout;
  };

  // Updated accessor methods to handle templateID-specific lookups
  const getLayoutById = (layoutId: string): LayoutInfo | null => {
    if (!layoutData) return null;

    // Search through all entries to find the layout (since we don't know the templateID)
    for (const [key, layout] of Array.from(layoutData.layoutsById.entries())) {
      if (key === layoutId) {
        return layout;
      }
    }
    return null;
  };

  const getLayoutsByTemplateID = (templateID: string): LayoutInfo[] => {
    return layoutData?.templateLayouts.get(templateID) || [];
  };

  const getTemplateSetting = (templateID: string): TemplateSetting | null => {
    return layoutData?.templateSettings.get(templateID) || null;
  };

  const getAllTemplateIDs = (): string[] => {
    return layoutData ? Array.from(layoutData.templateSettings.keys()) : [];
  };

  const getAllLayouts = (): LayoutInfo[] => {
    return layoutData?.layoutSchema || [];
  };

  const getFullDataByTemplateID = (templateID: string): FullDataInfo[] => {
    return layoutData?.fullDataByTemplateID.get(templateID) || [];
  };
  const getCustomTemplateFonts = (presentationId: string): string[] | null => {
    return customTemplateFonts.get(presentationId) || null;
  };

  // Load layouts on mount
  useEffect(() => {
    loadLayouts();
  }, []); // Add presentationId to dependency array

  const contextValue: LayoutContextType = {
    getLayoutById,
    getLayoutsByTemplateID,
    getTemplateSetting,
    getAllTemplateIDs,
    getAllLayouts,
    getFullDataByTemplateID,
    getCustomTemplateFonts,
    loading,
    error,
    getLayout,
    isPreloading,
    cacheSize: layoutCache.size,
    refetch: loadLayouts,
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
};

/**
 * Hook to access the layout context.
 *
 * Returns the layout context value, which provides access to layout data,
 * compiled components, and utility functions. Must be used within a
 * LayoutProvider component.
 *
 * @returns LayoutContextType object with layout utilities and data.
 * @throws Error if used outside of LayoutProvider.
 *
 * @example
 * ```typescript
 * const { getLayoutById, getLayoutsByTemplateID } = useLayout();
 * const layout = getLayoutById("intro-slide");
 * ```
 */
export const useLayout = (): LayoutContextType => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
};
