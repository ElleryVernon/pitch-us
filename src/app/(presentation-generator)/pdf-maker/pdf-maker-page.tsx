"use client";
import React, { useEffect, useState } from "react";
import { usePresentationDataStore, type PresentationData } from "@/stores";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";
import { AlertCircle } from "lucide-react";
import { DashboardApi } from "../services/api/dashboard";
import { useLayout } from "../context/layout-context";
import { useFontLoader } from "../hooks/use-font-loader";
import { useTemplateLayouts } from "../hooks/use-template-layouts";
import PptFlowLayout from "../components/ppt-flow-layout";

const PresentationPage = ({ presentation_id }: { presentation_id: string }) => {
  const { renderSlideContent, loading } = useTemplateLayouts();
  const pathname = usePathname();
  const [contentLoading, setContentLoading] = useState(true);
  const { getCustomTemplateFonts } = useLayout();
  
  const presentationData = usePresentationDataStore((state) => state.presentationData);
  const setPresentationData = usePresentationDataStore((state) => state.setPresentationData);
  
  const [error, setError] = useState(false);

  useEffect(() => {
    if (
      !loading &&
      presentationData?.slides &&
      presentationData?.slides.length > 0
    ) {
      const layout = presentationData.slides[0]?.layout;
      if (!layout || !layout.includes("custom-")) return;
      const pid = layout.split(":")[0].split("custom-")[1];
      const fonts = getCustomTemplateFonts(pid);

      useFontLoader(fonts || []);
    }
  }, [presentationData, loading, getCustomTemplateFonts]);

  // Function to fetch the slides
  useEffect(() => {
    fetchUserSlides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to fetch the user slides
  const fetchUserSlides = async () => {
    try {
      const data = await DashboardApi.getPresentation(presentation_id);
      setPresentationData(data as PresentationData);
      setContentLoading(false);
    } catch (err) {
      setError(true);
      toast.error("Failed to load presentation");
      console.error("Error fetching user slides:", err);
      setContentLoading(false);
    }
  };

  // Regular view
  return (
    <PptFlowLayout showBackButton={false} useWrapper={false}>
      {error ? (
        <div className="flex flex-col items-center justify-center h-screen">
          <div
            className="bg-bg-100 border border-red-200 text-red-700 px-6 py-8 rounded-2xl shadow-sm flex flex-col items-center"
            role="alert"
          >
            <AlertCircle className="w-12 h-12 mb-4 text-red-400" />
            <strong className="font-semibold text-2xl mb-2">Oops!</strong>
            <p className="block text-base py-2 text-text-300">
              We encountered an issue loading your presentation.
            </p>
            <p className="text-sm py-2 text-text-300">
              Please check your internet connection or try again later.
            </p>
            <Button
              className="mt-4 rounded-full bg-accent text-white hover:bg-accent-hover"
              onClick={() => {
                trackEvent(MixpanelEvent.PdfMaker_Retry_Button_Clicked, {
                  pathname,
                });
                window.location.reload();
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <div className="">
          <div
            id="presentation-slides-wrapper"
            className="mx-auto flex flex-col items-center overflow-hidden justify-center"
          >
            {!presentationData ||
            loading ||
            contentLoading ||
            !presentationData?.slides ||
            presentationData?.slides.length === 0 ? (
              <div className="relative w-full h-[calc(100vh-120px)] mx-auto">
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <Skeleton
                      key={index}
                      className="aspect-video bg-bg-200/80 my-4 w-full mx-auto max-w-[1280px]"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {presentationData &&
                  presentationData.slides &&
                  presentationData.slides.length > 0 &&
                  presentationData.slides.map((slide, index) => (
                    <div
                      key={index}
                      className="w-full"
                      data-speaker-note={slide.speaker_note}
                    >
                      {renderSlideContent(slide, true)}
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>
      )}
    </PptFlowLayout>
  );
};

export default PresentationPage;
