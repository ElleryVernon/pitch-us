"use client";
import { Button } from "@/components/ui/button";
import {
  SquareArrowOutUpRight,
  Play,
  Loader2,
  Redo2,
  Undo2,
} from "lucide-react";
import { useState, useCallback } from "react";
import Wrapper from "@/components/wrapper";
import { useRouter, usePathname } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PresentationGenerationApi } from "../../services/api/presentation-generation";
import { OverlayLoader } from "@/components/ui/overlay-loader";
import Link from "next/link";
import { toast } from "sonner";
import Announcement from "@/components/announcement";
import { PptxPresentationModel } from "@/types/pptx-models";
import Image from "next/image";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";
import { usePresentationUndoRedo } from "../hooks/presentation-undo-redo";
import ToolTip from "@/components/tool-tip";
import { useUndoRedoStore, usePresentationUIStore, usePresentationDataStore } from "@/stores";

const PDFIMAGE = "/pdf.svg";
const PPTXIMAGE = "/pptx.svg";

const EXPORT_ERROR_MESSAGE = "Having trouble exporting!";
const EXPORT_ERROR_DESCRIPTION = "We are having trouble exporting your presentation. Please try again.";

interface HeaderProps {
  presentation_id: string;
  currentSlide?: number;
}

const Header = ({ presentation_id, currentSlide }: HeaderProps) => {
  const [open, setOpen] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const clearHistory = useUndoRedoStore((state) => state.clearHistory);
  const presentationData = usePresentationDataStore((state) => state.presentationData);
  const clearPresentationData = usePresentationDataStore((state) => state.clearPresentationData);
  const isStreaming = usePresentationUIStore((state) => state.isStreaming);

  const { onUndo, onRedo, canUndo, canRedo } = usePresentationUndoRedo();

  // Common export preparation - saves presentation before export
  const prepareExport = useCallback(async () => {
    setOpen(false);
    setShowLoader(true);
    trackEvent(MixpanelEvent.Header_UpdatePresentationContent_API_Call);
    await PresentationGenerationApi.updatePresentationContent(
      presentationData as unknown as { id: string; [key: string]: unknown },
    );
  }, [presentationData]);

  // Common export error handler
  const handleExportError = useCallback((error: unknown) => {
    console.error("Export failed:", error);
    toast.error(EXPORT_ERROR_MESSAGE, { description: EXPORT_ERROR_DESCRIPTION });
  }, []);

  // Download helper
  const downloadLink = useCallback((path: string) => {
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
  }, []);

  const getPptxModel = useCallback(async (id: string): Promise<PptxPresentationModel> => {
    const response = await fetch(`/api/v1/exports/pptx-model?id=${id}`);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.detail || payload?.error || "Failed to get presentation PPTX model");
    }
    if (!payload || !Array.isArray(payload.slides)) {
      throw new Error("Invalid PPTX model response");
    }
    return payload as PptxPresentationModel;
  }, []);

  const handleExportPptx = useCallback(async () => {
    if (isStreaming) return;

    try {
      await prepareExport();
      
      trackEvent(MixpanelEvent.Header_GetPptxModel_API_Call);
      const pptx_model = await getPptxModel(presentation_id);
      
      trackEvent(MixpanelEvent.Header_ExportAsPPTX_API_Call);
      const pptx_path = await PresentationGenerationApi.exportAsPPTX(
        pptx_model,
        presentation_id,
      );
      
      if (pptx_path) {
        downloadLink(pptx_path);
      } else {
        throw new Error("No path returned from export");
      }
    } catch (error) {
      handleExportError(error);
    } finally {
      setShowLoader(false);
    }
  }, [isStreaming, prepareExport, getPptxModel, presentation_id, downloadLink, handleExportError]);

  const handleExportPdf = useCallback(async () => {
    if (isStreaming) return;

    try {
      await prepareExport();

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
    } catch (error) {
      handleExportError(error);
    } finally {
      setShowLoader(false);
    }
  }, [isStreaming, prepareExport, presentation_id, presentationData?.title, downloadLink, handleExportError]);

  const handleReGenerate = useCallback(() => {
    clearPresentationData();
    clearHistory();
    trackEvent(MixpanelEvent.Header_ReGenerate_Button_Clicked, { pathname });
    router.push(`/presentation?id=${presentation_id}&stream=true`);
  }, [clearPresentationData, clearHistory, pathname, router, presentation_id]);

  const handlePresent = useCallback(() => {
    const to = `?id=${presentation_id}&mode=present&slide=${currentSlide || 0}`;
    trackEvent(MixpanelEvent.Navigation, { from: pathname, to });
    router.push(to);
  }, [presentation_id, currentSlide, pathname, router]);

  return (
    <>
      <OverlayLoader
        show={showLoader}
        text="Exporting presentation..."
        showProgress={true}
        duration={40}
      />
      <div className="bg-[#071A14] w-full shadow-lg sticky top-0">
        <Announcement />
        <Wrapper className="flex items-center justify-between py-1">
          <Link href="/" className="min-w-[120px] py-3">
            <span className="text-2xl font-bold text-white font-inter">
              Pitch<span className="text-emerald-400">:</span>US
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-4 2xl:gap-6">
            {isStreaming && (
              <Loader2 className="animate-spin text-white font-bold w-6 h-6" />
            )}

            {/* Menu Items */}
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <button
                onClick={handleReGenerate}
                disabled={isStreaming || !presentationData}
                className="text-white disabled:opacity-50"
              >
                Re-Generate
              </button>
              
              <div className="flex items-center gap-2">
                <ToolTip content="Undo">
                  <button
                    disabled={!canUndo}
                    className="text-white disabled:opacity-50"
                    onClick={onUndo}
                  >
                    <Undo2 className="w-6 h-6" />
                  </button>
                </ToolTip>
                <ToolTip content="Redo">
                  <button
                    disabled={!canRedo}
                    className="text-white disabled:opacity-50"
                    onClick={onRedo}
                  >
                    <Redo2 className="w-6 h-6" />
                  </button>
                </ToolTip>
              </div>

              <Button
                onClick={handlePresent}
                variant="ghost"
                className="border border-white font-bold text-white rounded-[32px] transition-all duration-300 group"
              >
                <Play className="w-4 h-4 mr-1 stroke-white group-hover:stroke-black" />
                Present
              </Button>

              <div style={{ zIndex: 100 }} className="hidden lg:block relative">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button className="border py-5 text-[#071A14] font-bold rounded-[32px] transition-all duration-500 hover:border hover:bg-[#071A14] hover:text-white w-full bg-white">
                      <SquareArrowOutUpRight className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[250px] space-y-2 py-3 px-2">
                    <div className="space-y-2 bg-white rounded-lg">
                      <Button
                        onClick={() => {
                          trackEvent(MixpanelEvent.Header_Export_PDF_Button_Clicked, { pathname });
                          handleExportPdf();
                        }}
                        variant="ghost"
                        className="pb-4 border-b rounded-none border-gray-300 w-full flex justify-start text-[#071A14]"
                      >
                        <Image src={PDFIMAGE} alt="pdf export" width={30} height={30} />
                        Export as PDF
                      </Button>
                      <Button
                        onClick={() => {
                          trackEvent(MixpanelEvent.Header_Export_PPTX_Button_Clicked, { pathname });
                          handleExportPptx();
                        }}
                        variant="ghost"
                        className="w-full flex justify-start text-[#071A14]"
                      >
                        <Image src={PPTXIMAGE} alt="pptx export" width={30} height={30} />
                        Export as PPTX
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Mobile Export Options */}
              <div className="lg:hidden flex flex-col w-full">
                <div className="space-y-2 max-md:mt-4 rounded-lg">
                  <Button
                    onClick={() => {
                      trackEvent(MixpanelEvent.Header_Export_PDF_Button_Clicked, { pathname });
                      handleExportPdf();
                    }}
                    variant="ghost"
                    className="pb-4 border-b rounded-none border-gray-300 w-full flex justify-start text-[#071A14] bg-white py-6 border-none rounded-lg"
                  >
                    <Image src={PDFIMAGE} alt="pdf export" width={30} height={30} />
                    Export as PDF
                  </Button>
                  <Button
                    onClick={() => {
                      trackEvent(MixpanelEvent.Header_Export_PPTX_Button_Clicked, { pathname });
                      handleExportPptx();
                    }}
                    variant="ghost"
                    className="w-full flex justify-start text-[#071A14] bg-white py-6"
                  >
                    <Image src={PPTXIMAGE} alt="pptx export" width={30} height={30} />
                    Export as PPTX
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Wrapper>
      </div>
    </>
  );
};

export default Header;
