/**
 * Root page component for the application.
 *
 * The main entry point for the application's home page. Renders the Home
 * component which provides the initial user interface for creating presentations.
 */

import Home from "@/app/components/home"

/**
 * Root page component.
 *
 * Renders the Home component which displays the main interface for presentation
 * generation, including template selection, discover section, and drafts.
 *
 * @returns The Home component wrapped in the page structure.
 */
const page = () => {
    return (
        <Home />
    )
}

export default page