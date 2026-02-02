"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Loader2,
  Play,
  Redo2,
  Download,
  Undo2,
  Check,
  RefreshCw,
  Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PresentationGenerationApi } from "../../services/api/presentation-generation";
import { OverlayLoader } from "@/components/ui/overlay-loader";
import { toast } from "sonner";
import { PptxPresentationModel } from "@/types/pptx-models";
import { useRouter, usePathname } from "next/navigation";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";
import { usePresentationUndoRedo } from "../hooks/presentation-undo-redo";
import ToolTip from "@/components/tool-tip";
import { useUndoRedoStore, usePresentationUIStore, usePresentationDataStore } from "@/stores";
import { cn } from "@/lib/utils";

const PDFIMAGE = "/pdf.svg";
const PPTXIMAGE = "/pptx.svg";

/**
 * Returns a human-readable relative time string (e.g., "just now", "2 minutes ago")
 */
const getRelativeTimeString = (date: Date | null): string => {
  if (!date) return "";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 5) return "just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  return date.toLocaleDateString();
};

interface PresentationActionsProps {
  presentation_id: string;
  currentSlide?: number;
  isSaving?: boolean;
  lastSavedAt?: Date | null;
}

const PresentationActions: React.FC<PresentationActionsProps> = ({
  presentation_id,
  currentSlide,
  isSaving,
  lastSavedAt,
}) => {
  const [open, setOpen] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const clearHistory = useUndoRedoStore((state) => state.clearHistory);
  const presentationData = usePresentationDataStore((state) => state.presentationData);
  const clearPresentationData = usePresentationDataStore((state) => state.clearPresentationData);
  const isStreaming = usePresentationUIStore((state) => state.isStreaming);

  const { onUndo, onRedo, canUndo, canRedo } = usePresentationUndoRedo();

  const get_presentation_pptx_model = async (
    id: string,
  ): Promise<PptxPresentationModel> => {
    const response = await fetch(`/api/v1/exports/pptx-model?id=${id}`);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload?.detail ||
        payload?.error ||
        "Failed to get presentation PPTX model";
      throw new Error(message);
    }
    if (!payload || !Array.isArray(payload.slides)) {
      throw new Error("Invalid PPTX model response");
    }
    return payload as PptxPresentationModel;
  };

  const handleExportPptx = async () => {
    if (isStreaming) return;

    try {
      setOpen(false);
      setShowLoader(true);
      trackEvent(MixpanelEvent.Header_UpdatePresentationContent_API_Call);
      await PresentationGenerationApi.updatePresentationContent(
        presentationData,
      );
      trackEvent(MixpanelEvent.Header_GetPptxModel_API_Call);
      const pptx_model = await get_presentation_pptx_model(presentation_id);
      if (!pptx_model) {
        throw new Error("Failed to get presentation PPTX model");
      }
      trackEvent(MixpanelEvent.Header_ExportAsPPTX_API_Call);
      const pptx_path =
        await PresentationGenerationApi.exportAsPPTX(
          pptx_model,
          presentation_id,
        );
      if (pptx_path) {
        downloadLink(pptx_path);
      } else {
        throw new Error("No path returned from export");
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Having trouble exporting!", {
        description:
          "We are having trouble exporting your presentation. Please try again.",
      });
    } finally {
      setShowLoader(false);
    }
  };

  const handleExportPdf = async () => {
    if (isStreaming) return;

    try {
      setOpen(false);
      setShowLoader(true);
      trackEvent(MixpanelEvent.Header_UpdatePresentationContent_API_Call);
      await PresentationGenerationApi.updatePresentationContent(
        presentationData,
      );

      trackEvent(MixpanelEvent.Header_ExportAsPDF_API_Call);
      const response = await fetch("/api/v1/exports/pdf", {
        method: "POST",
        body: JSON.stringify({
          id: presentation_id,
          title: presentationData?.title,
        }),
      });

      if (response.ok) {
        const { path: pdfPath } = await response.json();
        if (!pdfPath) {
          throw new Error("PDF path not returned from server");
        }
        downloadLink(pdfPath);
      } else {
        throw new Error("Failed to export PDF");
      }
    } catch (err) {
      console.error(err);
      toast.error("Having trouble exporting!", {
        description:
          "We are having trouble exporting your presentation. Please try again.",
      });
    } finally {
      setShowLoader(false);
    }
  };

  const handleReGenerate = () => {
    clearPresentationData();
    clearHistory();
    trackEvent(MixpanelEvent.Header_ReGenerate_Button_Clicked, { pathname });
    router.push(`/presentation?id=${presentation_id}&stream=true`);
  };

  const downloadLink = (path: string) => {
    if (!path) {
      throw new Error("Download path is undefined");
    }
    if (window.opener) {
      window.open(path, "_blank");
    } else {
      const link = document.createElement("a");
      link.href = path;
      link.download = path.split("/").pop() || "download";
      document.body.appendChild(link);
      link.click();
    }
  };

  const slideCount = presentationData?.slides?.length ?? 0;
  const activeSlide = typeof currentSlide === "number" ? currentSlide + 1 : 1;
  const presentationTitle = presentationData?.title || "Your presentation";

  // Update relative time every 10 seconds
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const relativeTime = useMemo(
    () => getRelativeTimeString(lastSavedAt ?? null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lastSavedAt, setTick],
  );

  // Determine save status
  const getSaveStatus = () => {
    if (isSaving) {
      return {
        icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
        text: "Saving...",
        className: "text-accent border-accent/30 bg-accent/5",
      };
    }
    if (lastSavedAt) {
      return {
        icon: <Check className="h-3.5 w-3.5" />,
        text: `Saved ${relativeTime}`,
        className: "text-accent border-accent/30 bg-accent/5",
      };
    }
    return {
      icon: <Cloud className="h-3.5 w-3.5" />,
      text: "Auto-save enabled",
      className: "text-text-400 border-bg-200 bg-bg-100/80",
    };
  };

  const saveStatus = getSaveStatus();

  return (
    <>
      <OverlayLoader
        show={showLoader}
        text="Exporting presentation..."
        showProgress={true}
        duration={40}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between animate-stagger-1">
        {/* Left side - Title and status */}
        <div className="space-y-3 min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-text-400 font-medium">
              Presentation
            </p>
            {/* Save status - minimal inline indicator */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs transition-all duration-300",
                isSaving
                  ? "text-accent"
                  : lastSavedAt
                    ? "text-accent"
                    : "text-text-400",
              )}
            >
              {saveStatus.icon}
              <span className="hidden sm:inline">{saveStatus.text}</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-text-100 truncate">
            {presentationTitle}
          </h1>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Undo/Redo - grouped */}
          <div className="flex items-center border border-bg-200 rounded-lg bg-bg-100 overflow-hidden">
            <ToolTip content="Undo (Cmd+Z)">
              <button
                disabled={!canUndo}
                className="p-2 text-text-300 hover:text-text-200 hover:bg-bg-200/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                onClick={() => onUndo()}
              >
                <Undo2 className="w-4 h-4" />
              </button>
            </ToolTip>
            <div className="w-px h-4 bg-bg-200" />
            <ToolTip content="Redo (Cmd+Shift+Z)">
              <button
                disabled={!canRedo}
                className="p-2 text-text-300 hover:text-text-200 hover:bg-bg-200/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                onClick={() => onRedo()}
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </ToolTip>
          </div>

          {/* Re-generate */}
          <ToolTip content="Re-generate presentation">
            <button
              onClick={handleReGenerate}
              disabled={isStreaming || !presentationData}
              className="p-2 rounded-lg border border-bg-200 bg-bg-100 text-text-300 hover:text-text-200 hover:bg-bg-200/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </ToolTip>

          {/* Present button */}
          <Button
            onClick={() => {
              const to = `?id=${presentation_id}&mode=present&slide=${currentSlide || 0}`;
              trackEvent(MixpanelEvent.Navigation, { from: pathname, to });
              router.push(to);
            }}
            variant="outline"
            className="rounded-lg border-bg-200 text-text-200 hover:bg-bg-200/50 hover:border-bg-300"
          >
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Present</span>
          </Button>

          {/* Export dropdown */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                disabled={true}
                className="rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[200px] p-1.5 border-bg-200"
            >
              <div className="space-y-0.5">
                <button
                  disabled={true}
                  onClick={() => {
                    trackEvent(MixpanelEvent.Header_Export_PDF_Button_Clicked, {
                      pathname,
                    });
                    handleExportPdf();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-200 hover:bg-bg-200/50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <img src={PDFIMAGE} alt="pdf" className="h-5 w-5" />
                  Export as PDF
                </button>
                <button
                  disabled={true}
                  onClick={() => {
                    trackEvent(
                      MixpanelEvent.Header_Export_PPTX_Button_Clicked,
                      {
                        pathname,
                      },
                    );
                    handleExportPptx();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-200 hover:bg-bg-200/50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <img src={PPTXIMAGE} alt="pptx" className="h-5 w-5" />
                  Export as PPTX
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </>
  );
};

export default PresentationActions;
