/**
 * Toast notification system using Sonner.
 *
 * A customized toast notification component that integrates Sonner with the
 * application's design system. Provides styled toasts for success, error,
 * info, warning, and loading states, with support for dark mode and custom
 * styling that matches the application's color scheme.
 */

"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toast notification provider component.
 *
 * Wraps the Sonner Toaster component with custom styling that matches the
 * application's design system. Automatically adapts to the current theme
 * (light/dark mode) and provides consistent styling for all toast types.
 * Should be placed in the root layout or a high-level component.
 *
 * Features:
 * - Custom styling for success, error, info, warning, and loading toasts
 * - Dark mode support with theme-aware colors
 * - Gradient backgrounds and custom borders
 * - Accessible close buttons and action buttons
 * - Smooth animations and transitions
 *
 * @param props - All Sonner Toaster props (position, duration, etc.).
 * @returns A styled Toaster component with global CSS styles.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <>
      <style jsx global>{`
        /* Base toast styling - matches design system */
        [data-sonner-toaster] {
          --normal-bg: var(--bg-100, #ffffff);
          --normal-border: var(--bg-200, #f3f4f6);
          --normal-text: var(--text-100, #111827);
          --description-text: var(--text-300, #6b7280);
          font-family: inherit;
        }

        [data-sonner-toast] {
          padding: 16px !important;
          border-radius: 16px !important;
          background: var(--bg-100, #ffffff) !important;
          border: 1px solid var(--bg-200, #e5e7eb) !important;
          box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.08),
            0 2px 4px rgba(0, 0, 0, 0.04) !important;
          gap: 12px !important;
        }

        [data-sonner-toast] [data-icon] {
          width: 20px !important;
          height: 20px !important;
        }

        [data-sonner-toast] [data-title] {
          color: var(--text-100, #111827) !important;
          font-weight: 500 !important;
          font-size: 14px !important;
          line-height: 1.4 !important;
        }

        [data-sonner-toast] [data-description] {
          color: var(--text-300, #6b7280) !important;
          font-size: 13px !important;
          line-height: 1.4 !important;
          margin-top: 2px !important;
        }

        /* Success Toast */
        [data-sonner-toast][data-type="success"] {
          background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%) !important;
          border-color: #bbf7d0 !important;
        }
        [data-sonner-toast][data-type="success"] [data-icon] svg {
          color: #16a34a !important;
        }

        /* Error Toast - uses accent color */
        [data-sonner-toast][data-type="error"] {
          background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%) !important;
          border-color: #fecaca !important;
        }
        [data-sonner-toast][data-type="error"] [data-icon] svg {
          color: #dc2626 !important;
        }

        /* Info Toast - uses brand color */
        [data-sonner-toast][data-type="info"] {
          background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%) !important;
          border-color: #bae6fd !important;
        }
        [data-sonner-toast][data-type="info"] [data-icon] svg {
          color: #0284c7 !important;
        }

        /* Warning Toast */
        [data-sonner-toast][data-type="warning"] {
          background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%) !important;
          border-color: #fde68a !important;
        }
        [data-sonner-toast][data-type="warning"] [data-icon] svg {
          color: #d97706 !important;
        }

        /* Loading Toast - uses brand color */
        [data-sonner-toast][data-type="loading"] {
          background: var(--bg-100, #ffffff) !important;
          border-color: var(--bg-200, #e5e7eb) !important;
        }
        [data-sonner-toast][data-type="loading"] [data-icon] svg {
          color: var(--accent, #d97757) !important;
        }

        /* Default Toast (no type) */
        [data-sonner-toast][data-type="default"] {
          background: var(--bg-100, #ffffff) !important;
          border-color: var(--bg-200, #e5e7eb) !important;
        }

        /* Action buttons */
        [data-sonner-toast] [data-button] {
          background: var(--text-100, #111827) !important;
          color: white !important;
          border-radius: 8px !important;
          padding: 6px 12px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          transition: all 0.15s ease !important;
        }
        [data-sonner-toast] [data-button]:hover {
          background: var(--text-200, #374151) !important;
        }

        /* Cancel button */
        [data-sonner-toast] [data-cancel] {
          background: var(--bg-200, #f3f4f6) !important;
          color: var(--text-200, #374151) !important;
        }
        [data-sonner-toast] [data-cancel]:hover {
          background: var(--bg-300, #e5e7eb) !important;
        }

        /* Close button */
        [data-sonner-toast] [data-close-button] {
          background: transparent !important;
          border: none !important;
          color: var(--text-300, #6b7280) !important;
          opacity: 0.6 !important;
          transition: opacity 0.15s ease !important;
        }
        [data-sonner-toast] [data-close-button]:hover {
          opacity: 1 !important;
          background: var(--bg-200, #f3f4f6) !important;
        }

        /* Dark mode */
        .dark [data-sonner-toast] {
          background: #1f2937 !important;
          border-color: #374151 !important;
          box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.2) !important;
        }
        .dark [data-sonner-toast] [data-title] {
          color: #f9fafb !important;
        }
        .dark [data-sonner-toast] [data-description] {
          color: #9ca3af !important;
        }

        .dark [data-sonner-toast][data-type="success"] {
          background: linear-gradient(135deg, #052e16 0%, #1f2937 100%) !important;
          border-color: #166534 !important;
        }
        .dark [data-sonner-toast][data-type="success"] [data-icon] svg {
          color: #4ade80 !important;
        }

        .dark [data-sonner-toast][data-type="error"] {
          background: linear-gradient(135deg, #450a0a 0%, #1f2937 100%) !important;
          border-color: #991b1b !important;
        }
        .dark [data-sonner-toast][data-type="error"] [data-icon] svg {
          color: #f87171 !important;
        }

        .dark [data-sonner-toast][data-type="info"] {
          background: linear-gradient(135deg, #0c4a6e 0%, #1f2937 100%) !important;
          border-color: #0369a1 !important;
        }
        .dark [data-sonner-toast][data-type="info"] [data-icon] svg {
          color: #38bdf8 !important;
        }

        .dark [data-sonner-toast][data-type="warning"] {
          background: linear-gradient(135deg, #451a03 0%, #1f2937 100%) !important;
          border-color: #92400e !important;
        }
        .dark [data-sonner-toast][data-type="warning"] [data-icon] svg {
          color: #fbbf24 !important;
        }

        .dark [data-sonner-toast][data-type="loading"] {
          background: #1f2937 !important;
          border-color: #374151 !important;
        }
        .dark [data-sonner-toast][data-type="loading"] [data-icon] svg {
          color: #d97757 !important;
        }

        .dark [data-sonner-toast] [data-button] {
          background: #f9fafb !important;
          color: #111827 !important;
        }
        .dark [data-sonner-toast] [data-button]:hover {
          background: #e5e7eb !important;
        }

        .dark [data-sonner-toast] [data-cancel] {
          background: #374151 !important;
          color: #d1d5db !important;
        }
        .dark [data-sonner-toast] [data-cancel]:hover {
          background: #4b5563 !important;
        }

        .dark [data-sonner-toast] [data-close-button] {
          color: #9ca3af !important;
        }
        .dark [data-sonner-toast] [data-close-button]:hover {
          background: #374151 !important;
        }
      `}</style>
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        richColors={false}
        closeButton
        toastOptions={{
          classNames: {
            toast: "group toast",
            description: "group-[.toast]:text-muted-foreground",
          },
        }}
        {...props}
      />
    </>
  );
};

export { Toaster };
