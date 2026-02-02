/**
 * Template selection component for choosing presentation templates.
 *
 * This component displays available templates in a grid layout, allowing users
 * to select a template for presentation generation. It handles both built-in
 * templates and custom templates loaded from the server.
 *
 * Features:
 * - Fetches custom template metadata from API
 * - Filters out templates with errored layouts
 * - Sorts templates with built-in templates first, then custom templates
 * - Auto-selects default template when templates load
 * - Displays loading skeleton during template loading
 * - Shows empty state if no templates available
 *
 * Template sorting:
 * - Built-in templates: Specific order (vision-bold, data-driven, etc.)
 * - Custom templates: Sorted by last_updated_at (newest first)
 * - Default templates appear first within their category
 *
 * The component automatically selects the default template (or first template)
 * when templates are loaded to ensure a template is always selected.
 */

"use client";
import React, { useEffect } from "react";
import { useLayout } from "../../context/layout-context";
import TemplateLayouts from "./template-layouts";

import { Template } from "../types/index";

import { getHeader } from "../../services/api/header";

/**
 * Props for the TemplateSelection component.
 *
 * @property selectedTemplate - Currently selected template, or null if none
 *   selected. Used to highlight selected template in child components.
 * @property onSelectTemplate - Callback invoked when a template is selected.
 *   Receives the selected template object with slides populated.
 */
interface TemplateSelectionProps {
  selectedTemplate: Template | null;
  onSelectTemplate: (template: Template) => void;
}

const TemplateSelection: React.FC<TemplateSelectionProps> = ({
  selectedTemplate,
  onSelectTemplate,
}) => {
  const {
    getLayoutsByTemplateID,
    getTemplateSetting,
    getAllTemplateIDs,
    getFullDataByTemplateID,
    loading,
  } = useLayout();

  /**
   * State for custom template metadata.
   *
   * Maps custom template IDs (e.g., "custom-123") to metadata including:
   * - lastUpdatedAt: Timestamp for sorting (newest first)
   * - name: Display name from template configuration
   * - description: Template description from configuration
   */
  const [summaryMap, setSummaryMap] = React.useState<
    Record<
      string,
      { lastUpdatedAt?: number; name?: string; description?: string }
    >
  >({});

  /**
   * Effect: Fetch custom template metadata from API.
   *
   * Loads custom template summary data including last updated timestamps and
   * metadata. This is used for:
   * - Sorting custom templates by recency
   * - Displaying custom template names and descriptions
   * - Differentiating custom templates from built-in templates
   *
   * Only runs once on mount. Errors are silently handled by setting empty map.
   */
  useEffect(() => {
    // Fetch custom templates summary to get last_updated_at and template meta
    // for sorting and display
    fetch(`/api/v1/templates/summary`, {
      headers: getHeader(),
    })
      .then((res) => res.json())
      .then((data) => {
        const map: Record<
          string,
          { lastUpdatedAt?: number; name?: string; description?: string }
        > = {};
        if (data && Array.isArray(data.presentations)) {
          // Transform API response into map keyed by template ID
          for (const p of data.presentations) {
            const slug = `custom-${p.presentation_id}`;
            map[slug] = {
              lastUpdatedAt: p.last_updated_at
                ? new Date(p.last_updated_at).getTime()
                : 0,
              name: p.template?.name,
              description: p.template?.description,
            };
          }
        }
        setSummaryMap(map);
      })
      .catch(() => setSummaryMap({}));
  }, []);

  /**
   * Memoized list of available templates with metadata.
   *
   * Transforms template IDs into Template objects with proper metadata:
   * - Filters out templates with errored layouts (prevents broken templates)
   * - Uses custom metadata for custom templates (name, description)
   * - Falls back to template ID and default description for built-in templates
   * - Includes ordering mode and default flag from settings
   *
   * Recomputes when template IDs, settings, or custom metadata change.
   */
  const templates: Template[] = React.useMemo(() => {
    const templates = getAllTemplateIDs();
    if (templates.length === 0) return [];

    const Templates: Template[] = templates
      .filter((templateID: string) => {
        // Filter out templates that contain errored layouts
        // Custom templates may have compile/parse errors that create error slides
        // We don't want to show broken templates to users
        const fullData = getFullDataByTemplateID(templateID);
        const hasErroredLayouts = fullData.some(
          (fd: any) =>
            (fd as any)?.component?.displayName === "CustomTemplateErrorSlide",
        );
        return !hasErroredLayouts;
      })
      .map((templateID) => {
        const settings = getTemplateSetting(templateID);
        const customMeta = summaryMap[templateID];
        const isCustom = templateID.toLowerCase().startsWith("custom-");
        return {
          id: templateID,
          // Use custom name if available, otherwise use template ID
          name: isCustom && customMeta?.name ? customMeta.name : templateID,
          // Use custom description if available, otherwise use settings or default
          description:
            isCustom && customMeta?.description
              ? customMeta.description
              : settings?.description || `${templateID} presentation templates`,
          ordered: settings?.ordered || false,
          default: settings?.default || false,
        };
      });

    // Sort templates with specific order for built-in templates
    // Built-in templates appear in this order, then custom templates sorted by name
    const templateOrder = [
      "vision-bold",
      "data-driven",
      "product-narrative",
      "minimal-investor",
    ];

    return Templates.sort((a, b) => {
      const indexA = templateOrder.indexOf(a.id);
      const indexB = templateOrder.indexOf(b.id);

      // Both templates are in the specific order list - sort by order
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      // Only A is in the list - A comes first
      if (indexA !== -1) return -1;
      // Only B is in the list - B comes first
      if (indexB !== -1) return 1;

      // Neither in list: sort by default flag, then alphabetically
      // Default templates appear first, then alphabetical by name
      if (a.default && !b.default) return -1;
      if (!a.default && b.default) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [
    getAllTemplateIDs,
    getLayoutsByTemplateID,
    getTemplateSetting,
    getFullDataByTemplateID,
    summaryMap,
  ]);

  /**
   * Memoized list of built-in templates.
   *
   * Filters templates to only include those that don't start with "custom-".
   * These are the default templates shipped with the application.
   */
  const inBuiltTemplates = React.useMemo(
    () => templates.filter((g) => !g.id.toLowerCase().startsWith("custom-")),
    [templates],
  );
  
  /**
   * Memoized list of custom templates sorted by recency.
   *
   * Filters templates to only include custom templates (starting with "custom-")
   * and sorts them by last_updated_at descending (newest first). Uses summaryMap
   * to get update timestamps.
   */
  const customTemplates = React.useMemo(() => {
    const unsorted = templates.filter((g) =>
      g.id.toLowerCase().startsWith("custom-"),
    );
    // Sort by last_updated_at desc using summaryMap keyed by template id
    // Newest custom templates appear first
    return unsorted.sort(
      (a, b) =>
        (summaryMap[b.id]?.lastUpdatedAt || 0) -
        (summaryMap[a.id]?.lastUpdatedAt || 0),
    );
  }, [templates, summaryMap]);

  /**
   * Effect: Auto-select default template when templates are loaded.
   *
   * Automatically selects the default template (or first template) when:
   * - Templates are loaded (length > 0)
   * - No template is currently selected
   *
   * Ensures a template is always selected for generation. Populates template
   * with slides data from layout context before calling onSelectTemplate.
   */
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplate) {
      const defaultTemplate = templates.find((g) => g.default) || templates[0];
      const slides = getLayoutsByTemplateID(defaultTemplate.id);

      // Debug: Log auto-selected slides data
      console.log("=== TemplateSelection: Auto-select ===");
      console.log("Default template ID:", defaultTemplate.id);
      console.log("Slides count:", slides?.length);
      console.log(
        "Slides schema check:",
        slides?.map((s, i) => ({
          index: i,
          id: s.id,
          hasJsonSchema: !!s.json_schema,
          schemaKeys: Object.keys(s.json_schema || {}),
          schemaType: s.json_schema?.type,
          schemaProperties: Object.keys(
            (s.json_schema as Record<string, unknown>)?.properties || {},
          ),
        })),
      );

      onSelectTemplate({
        ...defaultTemplate,
        slides: slides,
      });
    }
  }, [templates, selectedTemplate, onSelectTemplate]);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Skeleton header */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-bg-200 rounded animate-pulse"></div>
          <div className="h-3 w-12 bg-bg-200 rounded animate-pulse"></div>
        </div>
        {/* Skeleton grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-bg-200 bg-bg-100/80 animate-pulse"
            >
              <div className="h-4 bg-bg-200 rounded mb-2"></div>
              <div className="h-3 bg-bg-200/80 rounded mb-3"></div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[1, 2, 3, 4].map((j) => (
                  <div
                    key={j}
                    className="aspect-video bg-bg-200 rounded-lg"
                  ></div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="h-3 w-16 bg-bg-200 rounded"></div>
                <div className="h-5 w-14 bg-bg-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h5 className="text-lg font-medium mb-2 text-text-200">
            No Templates Available
          </h5>
          <p className="text-text-300 text-sm">
            No presentation templates could be loaded. Please try refreshing the
            page.
          </p>
        </div>
      </div>
    );
  }

  /**
   * Handles template selection from user click.
   *
   * Loads slide layouts for the selected template and calls onSelectTemplate
   * callback with template data including slides. Includes debug logging
   * for development to verify schema data.
   *
   * @param template - The template object that was clicked.
   */
  const handleTemplateSelection = (template: Template) => {
    // Get slide layouts for this template
    const slides = getLayoutsByTemplateID(template.id);

    // Debug: Log slides data to check json_schema
    // This helps verify that templates have proper schema data for generation
    console.log("=== TemplateSelection: handleTemplateSelection ===");
    console.log("Template ID:", template.id);
    console.log("Slides count:", slides?.length);
    console.log(
      "Slides schema check:",
      slides?.map((s, i) => ({
        index: i,
        id: s.id,
        hasJsonSchema: !!s.json_schema,
        schemaKeys: Object.keys(s.json_schema || {}),
        schemaType: s.json_schema?.type,
        schemaProperties: Object.keys(
          (s.json_schema as Record<string, unknown>)?.properties || {},
        ),
      })),
    );

    // Call callback with template including slides data
    onSelectTemplate({
      ...template,
      slides: slides,
    });
  };

  return (
    <div className="space-y-4">
      {/* Concise header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-300">Built-in Templates</p>
        <span className="text-xs text-text-400">
          {inBuiltTemplates.length} sets
        </span>
      </div>
      {/* Grid directly without container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {inBuiltTemplates.map((template) => (
          <TemplateLayouts
            key={template.id}
            template={template}
            onSelectTemplate={handleTemplateSelection}
            selectedTemplate={selectedTemplate}
          />
        ))}
      </div>
    </div>
  );
};

export default TemplateSelection;
