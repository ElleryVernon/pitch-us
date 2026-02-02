/**
 * Global providers component.
 *
 * Wraps the application with necessary context providers. Currently provides
 * the LayoutProvider for managing presentation template layouts throughout
 * the application.
 */

"use client";

import { LayoutProvider } from "./(presentation-generator)/context/layout-context";

/**
 * Providers component for global context.
 *
 * Wraps children with the LayoutProvider, which manages template layout
 * configuration and provides layout-related utilities to child components.
 *
 * @param children - React nodes to wrap with providers.
 * @returns Children wrapped with LayoutProvider.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <LayoutProvider>{children}</LayoutProvider>;
}
