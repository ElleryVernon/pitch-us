/**
 * Configuration initializer component.
 *
 * Initializes user configuration settings on mount. Currently disables the
 * ability to change API keys after initial setup, ensuring configuration
 * stability throughout the application session.
 */

'use client';

import { useEffect } from 'react';
import { useUserConfigStore } from '@/stores';

/**
 * Configuration initializer component.
 *
 * Disables the ability to change API keys on mount. This ensures that once
 * the application is initialized, users cannot modify their API key configuration
 * during the session, maintaining configuration consistency.
 *
 * @param children - React nodes to render after initialization.
 * @returns The children components unchanged.
 */
export function ConfigurationInitializer({ children }: { children: React.ReactNode }) {
  const setCanChangeKeys = useUserConfigStore((state) => state.setCanChangeKeys);

  useEffect(() => {
    setCanChangeKeys(false);
  }, [setCanChangeKeys]);

  return children;
}
