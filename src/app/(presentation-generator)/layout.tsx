/**
 * Layout component for the presentation generator route group.
 *
 * Wraps all pages in the (presentation-generator) route group with the
 * ConfigurationInitializer to ensure user configuration is properly initialized.
 */

import React from 'react'
import { ConfigurationInitializer } from '../configuration-initializer'

/**
 * Layout component for presentation generator pages.
 *
 * Wraps children with ConfigurationInitializer to disable API key changes
 * during the presentation generation flow, ensuring configuration stability.
 *
 * @param children - React nodes to render inside the layout.
 * @returns Children wrapped with ConfigurationInitializer.
 */
const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <ConfigurationInitializer>
        {children}
      </ConfigurationInitializer>
    </div>
  )
}

export default layout
