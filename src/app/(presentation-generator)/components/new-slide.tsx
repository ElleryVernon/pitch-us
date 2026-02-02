/**
 * New slide selection component for adding slides to presentations.
 *
 * This component displays a grid of available slide layouts from a template,
 * allowing users to select which layout to use for a new slide. When a layout
 * is selected, it creates a new slide with sample data and adds it to the
 * presentation at the specified index.
 *
 * Features:
 * - Grid display of available layouts (4 columns)
 * - Loading state while layouts are being fetched
 * - Close button to dismiss the selection UI
 * - Error handling with toast notifications
 * - Uses ScaledSlidePreview for consistent layout rendering
 *
 * The component uses the layout context to fetch available layouts for the
 * specified template and the presentation data store to add new slides.
 */

import React from "react";
import { usePresentationDataStore } from "@/stores";
import { Loader2 } from "lucide-react";
import { useLayout, FullDataInfo } from "../context/layout-context";
import { v4 as uuidv4 } from "uuid";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import ScaledSlidePreview from "./scaled-slide-preview";

/**
 * Props for the NewSlide component.
 *
 * @property setShowNewSlideSelection - Callback to control visibility of
 *   the slide selection UI. Called with false when slide is added or closed.
 * @property templateID - ID of the template to fetch layouts from.
 * @property index - Index position where the new slide should be inserted.
 * @property presentationId - ID of the presentation to add the slide to.
 */
interface NewSlideProps {
  setShowNewSlideSelection: (show: boolean) => void;
  templateID: string;
  index: number;
  presentationId: string;
}

/**
 * New slide selection component.
 *
 * Renders a grid of available slide layouts and handles selection to create
 * a new slide. Shows loading state while layouts are being fetched.
 *
 * @param props - Component props containing template ID, insertion index, and callbacks.
 * @returns JSX element containing the layout selection grid.
 */
const NewSlide = ({
  setShowNewSlideSelection,
  templateID,
  index,
  presentationId,
}: NewSlideProps) => {
  // Zustand store action for adding new slides
  const addNewSlide = usePresentationDataStore((state) => state.addNewSlide);
  
  /**
   * Handles new slide creation from layout selection.
   *
   * Creates a new slide object with:
   * - Unique UUID for slide ID
   * - Specified insertion index
   * - Sample data from the selected layout (title, body, etc.)
   * - Template and layout IDs for rendering
   * - Presentation ID for association
   *
   * Adds the slide to the presentation store and closes the selection UI.
   * Handles errors with toast notifications.
   *
   * @param sampleData - Sample data object from the selected layout template.
   * @param id - Layout ID of the selected layout.
   */
  const handleNewSlide = (sampleData: Record<string, unknown>, id: string) => {
    try {
      const newSlide = {
        id: uuidv4(),
        index: index,
        content: {
          title: (sampleData.title as string) || "",
          body: (sampleData.body as string) || "",
          ...sampleData,
        },
        layout_group: templateID,
        layout: id,
        presentation: presentationId,
      };
      addNewSlide(newSlide, index);
      setShowNewSlideSelection(false);
    } catch (error) {
      console.error(error);
      toast.error("Error adding new slide");
    }
  };
  
  const { getFullDataByTemplateID, loading } = useLayout();
  const fullData = getFullDataByTemplateID(templateID);

  if (loading) {
    return (
      <div className="my-6 w-full bg-gray-50 p-8 max-w-content">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold">Select a Slide Layout</h2>
          <Trash2
            onClick={() => setShowNewSlideSelection(false)}
            className="text-gray-500 text-2xl cursor-pointer"
          />
        </div>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="my-6 w-full bg-gray-50 p-8 max-w-content">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold">Select a Slide Layout</h2>
        <Trash2
          onClick={() => setShowNewSlideSelection(false)}
          className="text-gray-500 text-2xl cursor-pointer"
        />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {fullData.map((layout: FullDataInfo, idx: number) => {
          const { component: LayoutComponent, sampleData, layoutId } = layout;
          return (
            <div
              onClick={() => handleNewSlide(sampleData, layoutId)}
              key={`${layoutId}-${idx}`}
              className="cursor-pointer"
            >
              <ScaledSlidePreview className="rounded-lg border border-bg-200 bg-bg-100 hover:border-bg-300 transition-colors">
                <LayoutComponent data={sampleData} />
              </ScaledSlidePreview>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NewSlide;
