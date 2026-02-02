/**
 * Announcement banner component for mobile devices.
 *
 * Displays a banner message encouraging users to use a computer for editing
 * presentations. This component is only visible on mobile devices (screens
 * smaller than medium breakpoint) to inform users that the full editing
 * experience is available on desktop.
 */

import React from "react";

/**
 * Announcement banner for mobile users.
 *
 * Renders a green banner with a message directing mobile users to use a
 * computer for editing. The banner is hidden on medium and larger screens
 * (max-md:block hidden) and only appears on mobile devices.
 *
 * @returns A div element containing the announcement message. The banner has
 *   green background, centered text, and appropriate padding.
 */
const Announcement = () => {
  return (
    <div className="max-md:block hidden py-1 text-base font-inter text-center bg-green-100 font-semibold">
      Want to edit? Use your computer to edit.
    </div>
  );
};

export default Announcement;
