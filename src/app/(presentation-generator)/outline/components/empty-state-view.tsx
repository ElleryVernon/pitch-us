/**
 * Empty state view component displayed when no presentation is found.
 *
 * This component is shown when the user navigates to the outline page but no
 * presentation ID is available in the URL or state. It provides a user-friendly
 * interface to guide users back to creating a new presentation.
 *
 * Features:
 * - Displays a centered empty state with icon and messaging
 * - Provides a back button to navigate to the previous page
 * - Includes a call-to-action button to create a new presentation
 * - Uses Claude theme styling for consistent visual design
 *
 * The component uses Next.js router for navigation and follows the application's
 * design system with proper spacing, typography, and interactive elements.
 */

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Wrapper from "@/components/wrapper";
import { FileText, Plus, ArrowRight, ArrowLeft } from "lucide-react";

/**
 * Empty state view component for missing presentations.
 *
 * Renders a full-screen empty state when no presentation is found. Includes
 * navigation controls and a primary action to create a new presentation.
 *
 * @returns JSX element containing the empty state UI with navigation controls.
 */
const EmptyStateView: React.FC = () => {
  const router = useRouter();

  return (
    <div className="claude-theme min-h-screen bg-bg-0 text-text-100 relative">
      {/* Floating Back Button */}
      <button
        onClick={() => router.back()}
        className="fixed top-6 left-6 z-50 p-2.5 rounded-full bg-bg-100/80 backdrop-blur-sm border border-bg-200 text-text-300 hover:text-text-200 hover:bg-bg-200/80 hover:border-bg-300 transition-all duration-200 shadow-sm"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <Wrapper>
        <div className="max-w-[760px] min-h-screen flex justify-center items-center mx-auto px-4 sm:px-6 pb-6">
          <div className="text-center space-y-8 animate-stagger-1">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-bg-100 rounded-2xl border border-bg-200 flex items-center justify-center shadow-sm">
                  <FileText className="w-10 h-10 text-text-300" />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-accent/15 rounded-full flex items-center justify-center">
                  <Plus className="w-4 h-4 text-accent" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl font-serif font-normal text-text-200">
                No Presentation Found
              </h1>
              <p className="text-sm sm:text-base text-text-300 max-w-md mx-auto leading-relaxed">
                It looks like the presentation you are looking for is not found.
                Let's create a brand new presentation!
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-4 animate-stagger-2">
              <Button
                onClick={() => router.push("/")}
                className="group bg-accent hover:bg-accent-hover text-white px-8 py-3 rounded-2xl text-base font-semibold shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all duration-200 active:scale-[0.99]"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Presentation
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </div>
          </div>
        </div>
      </Wrapper>
    </div>
  );
};

export default EmptyStateView;
