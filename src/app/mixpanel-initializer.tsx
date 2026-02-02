/**
 * Mixpanel analytics initializer component.
 *
 * Initializes Mixpanel analytics tracking and automatically tracks page views
 * as users navigate through the application. Wraps the application to ensure
 * analytics are active throughout the user session.
 */

'use client';

import { useEffect } from 'react';
import { initMixpanel, MixpanelEvent, trackEvent } from '@/utils/mixpanel';
import { usePathname } from 'next/navigation';

/**
 * Mixpanel initializer component.
 *
 * Initializes Mixpanel analytics on mount and tracks page views whenever
 * the pathname changes. This ensures all page navigation is automatically
 * tracked for analytics purposes.
 *
 * @param children - React nodes to render.
 * @returns The children components wrapped in a fragment.
 */
export function MixpanelInitializer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Initialize once
  useEffect(() => {
    initMixpanel();
  }, []);

  useEffect(() => {
    trackEvent(MixpanelEvent.PageView, { url: pathname });
  }, [pathname]);

  return <>{children}</>;
}

export default MixpanelInitializer;


