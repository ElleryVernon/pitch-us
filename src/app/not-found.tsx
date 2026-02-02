/**
 * 404 Not Found page component.
 *
 * Displays a user-friendly error page when a route is not found. Includes
 * an illustration, helpful message, and a link back to the homepage.
 */

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

/**
 * 404 Not Found page component.
 *
 * Renders a centered error page with:
 * - 404 illustration image
 * - Friendly error message
 * - Link to return to the homepage
 *
 * @returns A styled 404 error page with navigation options.
 */
const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center p-6">
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg p-8">
        <Image
          src="/404.svg"
          alt="Page not found"
          width={384}
          height={256}
          className="w-3/4 mx-auto mb-6"
          priority={false}
        />
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Oops! Page Not Found
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          It seems you've found a page that doesn't exist. But don't worry,
          every great presentation starts with a blank slide!
        </p>

        <div className="flex justify-center space-x-4 mb-8">
          <Link href="/">
            <Button className="bg-[#071A14] text-white px-6 py-2 rounded-md hover:bg-[#0A2A21]">
              Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
