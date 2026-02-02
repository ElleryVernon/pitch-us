/**
 * Template layout card component for displaying template options.
 *
 * This component renders a single template option in the template selection
 * grid. It displays template metadata, preview slides, and selection state.
 *
 * Features:
 * - Template name and description
 * - Preview of first 4 slide layouts in a grid
 * - Selection indicator (checkmark when selected)
 * - Ordered vs Flexible badge
 * - Click handler for template selection
 * - Font loading for custom templates
 *
 * The component loads custom fonts when displaying custom templates to ensure
 * proper rendering of template previews.
 */

import { CheckCircle } from "lucide-react";
import React from "react";
import { usePathname } from "next/navigation";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";
import { Template } from "../types/index";
import { useLayout } from "../../context/layout-context";
import { useFontLoader } from "../../hooks/use-font-loader";
import ScaledSlidePreview from "../../components/scaled-slide-preview";

/**
 * Props for the TemplateLayouts component.
 *
 * @property template - Template object containing id, name, description, and
 *   layout information.
 * @property onSelectTemplate - Callback invoked when template is clicked.
 *   Receives the selected template object.
 * @property selectedTemplate - Currently selected template, or null if none
 *   selected. Used to show selection indicator.
 */
interface TemplateLayoutsProps {
  template: Template;
  onSelectTemplate: (template: Template) => void;
  selectedTemplate: Template | null;
}

/**
 * Template layout card component.
 *
 * Renders a clickable card displaying template information and preview slides.
 * Handles template selection with analytics tracking and font loading for
 * custom templates.
 *
 * @param props - Component props containing template data and callbacks.
 * @returns JSX element containing the template card with previews.
 */
const TemplateLayouts: React.FC<TemplateLayoutsProps> = ({
  template,
  onSelectTemplate,
  selectedTemplate,
}) => {
  // Get layout data and fonts for this template
  const { getFullDataByTemplateID, getCustomTemplateFonts } = useLayout();
  const layoutTemplate = getFullDataByTemplateID(template.id);
  
  // Extract custom template ID and load fonts if it's a custom template
  // Custom templates have IDs like "custom-123", so we extract "123"
  const fonts = getCustomTemplateFonts(template.id.split("custom-")[1]);
  useFontLoader(fonts || []);
  
  const pathname = usePathname();
  return (
    <div
      onClick={() => {
        trackEvent(MixpanelEvent.Group_Layout_Selected_Clicked, { pathname });
        onSelectTemplate(template);
      }}
      className={`relative p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
        selectedTemplate?.id === template.id
          ? "border-accent/60 bg-bg-200/70 shadow-sm"
          : "border-bg-200 bg-bg-100/80 hover:border-bg-300 hover:shadow-sm"
      }`}
    >
      {selectedTemplate?.id === template.id && (
        <div className="absolute top-3 right-3">
          <CheckCircle className="w-5 h-5 text-accent" />
        </div>
      )}

      {/* Template metadata header */}
      <div className="mb-3 ">
        <h6 className="text-base capitalize font-medium text-text-200 mb-1">
          {template.name}
        </h6>
        <p className="text-sm text-text-300">{template.description}</p>
      </div>

      {/* Layout previews grid - shows first 4 layouts */}
      {/* Each preview renders a scaled-down version of the slide layout */}
      <div className="grid grid-cols-2 gap-2 mb-3 min-h-[260px]">
        {layoutTemplate &&
          layoutTemplate?.slice(0, 4).map((layout, index) => {
            const {
              component: LayoutComponent,
              sampleData,
              layoutId,
              templateID,
            } = layout;
            return (
              <ScaledSlidePreview
                key={`${templateID}-${index}`}
                className="cursor-pointer rounded-lg border border-bg-200 bg-bg-100"
              >
                {/* Render layout component with sample data for preview */}
                <LayoutComponent data={sampleData} />
              </ScaledSlidePreview>
            );
          })}
      </div>

      {/* Footer with layout count and ordering mode badge */}
      <div className="flex items-center justify-between text-xs text-text-400">
        <span>{layoutTemplate?.length} layouts</span>
        {/* Badge indicating whether template uses ordered (structured) or flexible layout assignment */}
        <span
          className={`px-2 py-1 rounded text-xs ${
            template.ordered
              ? "bg-bg-200 text-text-300"
              : "bg-accent/15 text-accent"
          }`}
        >
          {template.ordered ? "Structured" : "Flexible"}
        </span>
      </div>
    </div>
  );
};

export default TemplateLayouts;
