/**
 * Root layout component for the Next.js application.
 *
 * Defines the root HTML structure, metadata, font loading, and global providers
 * for the entire application. This layout wraps all pages and provides shared
 * configuration including fonts, analytics, and UI components.
 */

import type { Metadata } from "next";
import localFont from "next/font/local";
import { Roboto, Instrument_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import MixpanelInitializer from "./mixpanel-initializer";
import { Toaster } from "@/components/ui/sonner";

/**
 * Inter font configuration.
 *
 * Loads the Inter font from a local TTF file. Used as the primary UI font
 * throughout the application. Configured with CSS variable for easy theming.
 */
const inter = localFont({
  src: [
    {
      path: "./fonts/Inter.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

/**
 * Instrument Sans font configuration.
 *
 * Loads Instrument Sans from Google Fonts. Used for specific UI elements
 * requiring a sans-serif alternative to Inter.
 */
const instrument_sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument-sans",
  display: "swap",
  preload: false,
});

/**
 * Roboto font configuration.
 *
 * Loads Roboto from Google Fonts. Used for specific UI elements requiring
 * a modern sans-serif font.
 */
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-roboto",
  display: "swap",
  preload: false,
});

/**
 * Source Serif 4 font configuration.
 *
 * Loads Source Serif 4 from Google Fonts with multiple weights (300-600).
 * Used for serif typography in presentation content and headings.
 */
const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-source-serif-4",
  display: "swap",
  preload: false,
});

/**
 * Application metadata for SEO and social sharing.
 *
 * Defines the title, description, keywords, Open Graph tags, and Twitter
 * card metadata for the application. Used by search engines and social
 * media platforms when sharing links to the application.
 */
export const metadata: Metadata = {
  metadataBase: new URL("https://pitch-us.vercel.app"),
  title: "Pitch:US - AI Pitch Deck Generator",
  description:
    "AI-powered pitch deck generator for US VC-ready presentations. Transform your ideas into professional investor presentations with custom layouts and PDF/PPTX export.",
  keywords: [
    "AI pitch deck generator",
    "VC presentation",
    "investor pitch deck",
    "AI presentation generator",
    "startup pitch deck",
    "pitch deck creator",
    "professional presentations",
    "fundraising deck",
  ],
  openGraph: {
    title: "Pitch:US - AI Pitch Deck Generator",
    description:
      "AI-powered pitch deck generator for US VC-ready presentations. Transform your ideas into professional investor presentations with custom layouts and PDF/PPTX export.",
    url: "https://pitch-us.vercel.app",
    siteName: "Pitch:US",
    images: [
      {
        url: "https://pitch-us.vercel.app/pitch-us-feature-graphics.png",
        width: 1200,
        height: 630,
        alt: "Pitch:US Logo",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  alternates: {
    canonical: "https://pitch-us.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pitch:US - AI Pitch Deck Generator",
    description:
      "AI-powered pitch deck generator for US VC-ready presentations. Transform your ideas into professional investor presentations with custom layouts and PDF/PPTX export.",
    images: ["https://pitch-us.vercel.app/pitch-us-feature-graphics.png"],
  },
};

/**
 * Root layout component.
 *
 * Provides the root HTML structure for all pages in the application. Includes:
 * - Font loading and CSS variable configuration
 * - Global providers (LayoutProvider, MixpanelInitializer)
 * - Toast notifications (Sonner)
 * - Hydration warning suppression for theme providers
 *
 * @param children - React nodes to render inside the layout (page content).
 * @returns The root HTML structure with providers and global components.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${roboto.variable} ${instrument_sans.variable} ${sourceSerif4.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <MixpanelInitializer>{children}</MixpanelInitializer>
        </Providers>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
