/**
 * Presentation page component for viewing and editing presentations.
 *
 * Server component that handles the presentation editing page. Reads presentation
 * ID from URL search params and validates it. Displays error state if ID is missing,
 * otherwise renders the PresentationPage client component. Includes SEO metadata.
 */

import React, { Suspense } from "react";
import { Metadata } from "next";
import PresentationPage from "./components/presentation-page";
import PresentationFallback from "./components/presentation-fallback";
import PptFlowLayout from "../components/ppt-flow-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Page metadata for SEO and social sharing.
 */
export const metadata: Metadata = {
  title: "Presentation",
  description: "View and edit your AI-generated presentation.",
};

/**
 * Props for the Presentation page component.
 *
 * @property searchParams - Async search params from URL query string.
 *   Contains optional `id` (presentation ID, required), `stream` (streaming mode),
 *   `mode` (view/edit mode), and `slide` (selected slide index).
 */
interface PageProps {
  searchParams: Promise<{ id?: string; stream?: string; mode?: string; slide?: string }>;
}

/**
 * Presentation page server component.
 *
 * Reads presentation ID from URL search params. If missing, displays an error
 * page with navigation back to home. Otherwise, renders the PresentationPage
 * client component wrapped in Suspense. Handles Next.js 16 async searchParams API.
 *
 * @param searchParams - Async search params from URL.
 * @returns Suspense-wrapped PresentationPage component or error page.
 */
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const presentationId = params.id;

  if (!presentationId) {
    return (
      <PptFlowLayout
        topSlot={
          <div className="space-y-2 animate-stagger-1">
            <p className="text-[11px] uppercase tracking-[0.35em] text-text-400">
              Presentation
            </p>
            <h1 className="text-2xl sm:text-3xl font-serif font-normal text-text-200">
              Missing presentation
            </h1>
            <p className="text-sm text-text-300">
              We couldn&apos;t find a presentation id. Please try again.
            </p>
          </div>
        }
        contentClassName="gap-6"
      >
        <div className="rounded-2xl border border-bg-200 bg-bg-100/80 p-6 shadow-sm flex flex-col items-center text-center gap-4 animate-stagger-2">
          <Link href="/">
            <Button className="rounded-full bg-accent text-white hover:bg-accent-hover">
              Go to home
            </Button>
          </Link>
        </div>
      </PptFlowLayout>
    );
  }

  return (
    <Suspense fallback={<PresentationFallback />}>
      <PresentationPage presentation_id={presentationId} />
    </Suspense>
  );
}
