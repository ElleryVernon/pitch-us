/**
 * Outline page component for customizing presentation outlines.
 *
 * Server component that handles the outline editing page. Reads presentation
 * ID and template ID from URL search params and passes them to the client
 * component. Includes SEO metadata for the outline editing page.
 */

import React, { Suspense } from "react";
import { Metadata } from "next";
import OutlinePage from "./components/outline-page";
import OutlineFallback from "./components/outline-fallback";

/**
 * Page metadata for SEO and social sharing.
 */
export const metadata: Metadata = {
  title: "Outline Presentation",
  description:
    "Customize and organize your presentation outline. Drag and drop slides, add charts, and generate your presentation with ease.",
  alternates: {
    canonical: "https://pitch-us.vercel.app/create",
  },
  keywords: [
    "presentation generator",
    "AI presentations",
    "data visualization",
    "automatic presentation maker",
    "professional slides",
    "data-driven presentations",
    "document to presentation",
    "presentation automation",
    "smart presentation tool",
    "business presentations",
  ],
};

/**
 * Props for the Outline page component.
 *
 * @property searchParams - Async search params from URL query string.
 *   Contains optional `id` (presentation ID) and `template` (template ID).
 */
interface PageProps {
  searchParams: Promise<{ id?: string; template?: string }>;
}

/**
 * Outline page server component.
 *
 * Reads presentation ID and template ID from URL search params and passes
 * them to the OutlinePage client component. Uses Suspense for loading states.
 * Handles Next.js 16 async searchParams API.
 *
 * @param searchParams - Async search params from URL.
 * @returns Suspense-wrapped OutlinePage component with initial props.
 */
export default async function Page({ searchParams }: PageProps) {
  // Await searchParams for Next.js 16 async API
  const params = await searchParams;

  return (
    <Suspense fallback={<OutlineFallback />}>
      <OutlinePage initialPresentationId={params.id} initialTemplateId={params.template} />
    </Suspense>
  );
}
