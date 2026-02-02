/**
 * Icons editor component for selecting and replacing slide icons.
 *
 * This component provides a side panel interface for searching and selecting
 * icons to replace existing icons in slides. It displays icons in a grid layout
 * and allows users to search by keyword.
 *
 * Features:
 * - Icon search by keyword query
 * - Grid display of search results (up to 40 icons)
 * - Loading skeletons during search
 * - Empty state when no results found
 * - Smooth sheet animation on open/close
 * - Auto-search on component mount if icon_prompt is provided
 *
 * The component uses PresentationGenerationApi to search for icons and calls
 * onIconChange callback when an icon is selected.
 */

"use client";
import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PresentationGenerationApi } from "../services/api/presentation-generation";
import { getStaticFileUrl } from "../utils/others";
import { toast } from "sonner";

/**
 * Props for the IconsEditor component.
 *
 * @property icon_prompt - Optional array of search queries. If provided,
 *   automatically searches for icons when component mounts. First query
 *   is used as initial search input.
 * @property onClose - Optional callback invoked when the editor is closed.
 *   Called after animation completes (300ms delay).
 * @property onIconChange - Optional callback invoked when an icon is selected.
 *   Receives the new icon URL and the search query used to find it.
 */
interface IconsEditorProps {
  icon_prompt?: string[] | null;
  onClose?: () => void;
  onIconChange?: (newIconUrl: string, query?: string) => void;
}

/**
 * Icons editor component.
 *
 * Renders a side sheet panel for searching and selecting icons. Displays
 * search results in a grid and handles icon selection with callbacks.
 *
 * @param props - Component props containing search prompts and callbacks.
 * @returns JSX element containing the icons editor sheet panel.
 */
const IconsEditor = ({
  icon_prompt,
  onClose,
  onIconChange,

}: IconsEditorProps) => {
  // State management for icons, search, and UI state
  const [icons, setIcons] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(
    icon_prompt?.[0] || ""
  );
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  /**
   * Effect: Auto-search icons on component mount.
   *
   * If icon_prompt is provided and no icons are loaded yet, automatically
   * triggers icon search using the first prompt. This provides immediate
   * results when opening the editor with a pre-filled query.
   */
  useEffect(() => {
    if (icon_prompt && icon_prompt.length > 0 && icons.length === 0) {
      handleIconSearch();
    }
  }, []);

  /**
   * Searches for icons based on the current query.
   *
   * Calls the PresentationGenerationApi to search for icons matching the
   * search query. Uses icon_prompt as fallback if searchQuery is empty.
   * Limits results to 40 icons. Handles errors with user-friendly toast
   * notifications.
   *
   * @throws Displays error toast if API call fails.
   */
  const handleIconSearch = async () => {
    setLoading(true);
    const query = searchQuery.length > 0 ? searchQuery : icon_prompt?.[0] || "";

    try {
      const data = await PresentationGenerationApi.searchIcons({
        query,
        limit: 40,
      });
      setIcons(data as string[]);
    } catch (error) {
      console.error("Error fetching icons:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch icons. Please try again.");
      setIcons([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles icon selection and calls the parent callback.
   *
   * When an icon is clicked, calls onIconChange with the icon URL and
   * search query, then closes the editor. The search query is preserved
   * for potential future use or display.
   *
   * @param newIcon - URL string of the selected icon.
   */
  const handleIconChange = (newIcon: string) => {

    if (onIconChange) {
      onIconChange(newIcon, searchQuery || icon_prompt?.[0] || '');
    }
    handleClose();
  };

  /**
   * Handles closing the editor with animation delay.
   *
   * Sets isOpen to false to trigger Sheet close animation, then calls
   * onClose callback after 300ms to allow animation to complete. This
   * ensures smooth visual transition.
   */
  const handleClose = () => {
    setIsOpen(false);
    // Delay the actual close to allow animation to complete
    setTimeout(() => {
      onClose?.();
    }, 300); // Match the Sheet animation duration
  };
  

  return (
    <div className="icons-editor-container">


      <Sheet open={isOpen} onOpenChange={() => handleClose()}>
        <SheetContent
          side="right"
          className="w-[400px]"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onClick={(e) => e.stopPropagation()}
        >
          <SheetHeader>
            <SheetTitle>Choose Icon</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Search Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleIconSearch();
              }}
            >
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <Input
                  placeholder="Search icons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="pl-10"
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="w-full text-semibold text-[#51459e]"
                onClick={(e) => e.stopPropagation()}
              >
                Search
              </Button>
            </form>

            {/* Icons Grid */}
            <div className="max-h-[80vh] hide-scrollbar overflow-y-auto p-1">
              {loading ? (
                <div className="grid grid-cols-4 gap-4">
                  {Array.from({ length: 40 }).map((_, index) => (
                    <Skeleton key={index} className="w-16 h-16 rounded-lg" />
                  ))}
                </div>
              ) : icons && icons.length > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  {icons.map((iconSrc, idx) => (
                    <div
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleIconChange(iconSrc);
                      }}
                      className="w-12 h-12 cursor-pointer group relative rounded-lg overflow-hidden hover:bg-gray-100 p-2 transition-colors"
                    >
                      <img
                        src={iconSrc}
                        alt={`Icon ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-[60vh] text-center text-gray-500 space-y-4">
                  <Search className="w-12 h-12 text-gray-400" />
                  <p className="text-sm">No icons found for your search.</p>
                  <p className="text-xs">Try refining your search query.</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default IconsEditor;
