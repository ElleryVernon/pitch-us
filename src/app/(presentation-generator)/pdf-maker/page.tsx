/**
 * PDF maker page component for generating PDF exports.
 *
 * Client component that handles the PDF generation page. Reads presentation
 * ID from URL search params and validates it. Displays error state if ID is
 * missing, otherwise renders the PdfMakerPage component.
 */

"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import PdfMakerPage from "./pdf-maker-page";

/**
 * PDF maker content component.
 *
 * Reads presentation ID from URL search params. If missing, displays an error
 * message with navigation back to home. Otherwise, renders the PdfMakerPage
 * component with the presentation ID.
 *
 * @returns PdfMakerPage component or error state.
 */
const PdfMakerContent = () => {
  const router = useRouter();
  const params = useSearchParams();
  const queryId = params.get("id");
  if (!queryId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold">No presentation id found</h1>
        <p className="text-gray-500 pb-4">Please try again</p>
        <Button onClick={() => router.push("/")}>
          Go to home
        </Button>
      </div>
    );
  }
  return <PdfMakerPage presentation_id={queryId} />;
};

/**
 * PDF maker page wrapper component.
 *
 * Wraps PdfMakerContent in Suspense for loading state handling.
 *
 * @returns Suspense-wrapped PdfMakerContent component.
 */
const page = () => {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PdfMakerContent />
    </Suspense>
  );
};

export default page;
