/**
 * Error boundary component for slide rendering.
 *
 * Catches JavaScript errors during slide component rendering and displays
 * a user-friendly error message instead of crashing the entire application.
 * Useful for handling errors in dynamically loaded or compiled slide layouts.
 */

"use client";

import React from "react";

/**
 * Props for the SlideErrorBoundary component.
 *
 * @property children - React nodes to render (slide components).
 * @property label - Optional label to display in error message (e.g., slide name).
 */
interface SlideErrorBoundaryProps {
  children: React.ReactNode;
  label?: string;
}

/**
 * State for the SlideErrorBoundary component.
 *
 * @property hasError - Whether an error has been caught.
 * @property errorMessage - Error message to display to the user.
 */
interface SlideErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Error boundary class component for slide rendering.
 *
 * Catches errors during the render phase of child components and displays
 * an error UI instead of crashing. Logs errors to console for debugging.
 * Uses React error boundary lifecycle methods (getDerivedStateFromError,
 * componentDidCatch) to handle errors gracefully.
 */
export class SlideErrorBoundary extends React.Component<
  SlideErrorBoundaryProps,
  SlideErrorBoundaryState
> {
  constructor(props: SlideErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: unknown): SlideErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown) {
    // Optionally log to an error reporting service
    // eslint-disable-next-line no-console
    console.error("Slide render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="aspect-video w-full h-full bg-red-50 text-red-700 flex flex-col items-start justify-start p-4 space-y-2 rounded-md border border-red-200">
          <div className="text-sm font-semibold">
            {this.props.label ? `${this.props.label} render error` : "Slide render error"}
          </div>
          <pre className="text-xs whitespace-pre-wrap wrap-break-word max-h-full overflow-auto bg-red-100 rounded-md p-2 border border-red-200">
            {this.state.errorMessage}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default SlideErrorBoundary;


