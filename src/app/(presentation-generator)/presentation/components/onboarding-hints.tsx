"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Lightbulb, Image, WandSparkles, GripVertical, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to your presentation!",
    description: "Let's take a quick tour of the key features to help you create amazing slides.",
    icon: <Lightbulb className="w-5 h-5" />,
  },
  {
    id: "images",
    title: "Click images to edit them",
    description: "You can replace images, adjust positioning, or generate new ones with AI. Just click on any image in your slides.",
    icon: <Image className="w-5 h-5" />,
  },
  {
    id: "ai-edit",
    title: "AI-powered slide editing",
    description: "Hover over any slide and click the 'AI Edit' button to modify content using natural language prompts.",
    icon: <WandSparkles className="w-5 h-5" />,
  },
  {
    id: "reorder",
    title: "Drag to reorder slides",
    description: "Use the sidebar to drag and drop slides into your preferred order. You can also view slides in list or grid format.",
    icon: <GripVertical className="w-5 h-5" />,
  },
  {
    id: "shortcuts",
    title: "Keyboard shortcuts",
    description: "Press '?' anytime to see all keyboard shortcuts. Use arrow keys to navigate, Cmd/Ctrl+Z to undo, and 'P' to present.",
    icon: <Keyboard className="w-5 h-5" />,
  },
];

const STORAGE_KEY = "presenton_onboarding_completed";

interface OnboardingHintsProps {
  enabled?: boolean;
  onComplete?: () => void;
}

/**
 * Onboarding hints component that guides new users through key features
 * Shows once per user (stored in localStorage)
 */
const OnboardingHints: React.FC<OnboardingHintsProps> = ({
  enabled = true,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Check if user has already completed onboarding
  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem(STORAGE_KEY);
      if (completed) {
        setHasCompleted(true);
      } else if (enabled) {
        // Show onboarding after a short delay
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [enabled]);

  const handleNext = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    setHasCompleted(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    onComplete?.();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  if (!isVisible || hasCompleted) {
    return null;
  }

  const step = ONBOARDING_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50 animate-fade-in" />

      {/* Hint card */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4 animate-stagger-1">
        <div className="bg-bg-100 rounded-2xl border border-bg-200 shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-bg-200">
            <div
              className="h-full bg-accent transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Icon and step indicator */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
                  {step.icon}
                </div>
                <span className="text-xs font-medium text-text-400 uppercase tracking-wider">
                  Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                </span>
              </div>
              <button
                onClick={handleSkip}
                className="p-2 rounded-lg hover:bg-bg-200 text-text-400 hover:text-text-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title and description */}
            <h3 className="text-lg font-semibold text-text-200 mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-text-300 leading-relaxed mb-6">
              {step.description}
            </p>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-sm text-text-400 hover:text-text-300 transition-colors"
              >
                Skip tour
              </button>

              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <button
                    onClick={handlePrevious}
                    className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium text-text-300 hover:text-text-200 hover:bg-bg-200/60 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className={cn(
                    "flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    isLastStep
                      ? "bg-accent text-white hover:bg-accent-hover"
                      : "bg-accent text-white hover:bg-accent-hover"
                  )}
                >
                  {isLastStep ? "Get started" : "Next"}
                  {!isLastStep && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Step indicators */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-1.5">
              {ONBOARDING_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200",
                    index === currentStep
                      ? "bg-accent w-6"
                      : index < currentStep
                      ? "bg-accent/40"
                      : "bg-bg-200"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingHints;

/**
 * Hook to manually trigger onboarding
 */
export const useOnboarding = () => {
  const resetOnboarding = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const hasCompletedOnboarding = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) === "true";
    }
    return false;
  }, []);

  return {
    resetOnboarding,
    hasCompletedOnboarding,
  };
};
