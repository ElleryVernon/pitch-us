import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",

  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "!./src/app/privacy-policy/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          DEFAULT: "#071A14",
          light: "#0A2A21",
          dark: "#051210",
          accent: "#d97757",
        },
        bg: {
          0: "var(--bg-0)",
          100: "var(--bg-100)",
          200: "var(--bg-200)",
          300: "var(--bg-300)",
        },
        text: {
          100: "var(--text-100)",
          200: "var(--text-200)",
          300: "var(--text-300)",
          400: "var(--text-400)",
          500: "var(--text-500)",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "hsl(var(--accent-foreground))",
        },
        "accent-hover": "var(--accent-hover)",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      // Container settings for consistent widths
      maxWidth: {
        container: "var(--container-max-width, 1440px)",
        content: "var(--content-max-width, 1280px)",
      },
      // Spacing system for consistent padding/margins
      spacing: {
        "page-x": "var(--page-padding-x, 1rem)",
        "page-y": "var(--page-padding-y, 2rem)",
        section: "var(--section-spacing, 3rem)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        shimmer: {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(100%)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
      },
      fontFamily: {
        instrument_sans: ["var(--font-instrument-sans)"],
        inter: ["var(--font-inter)"],
        roboto: ["var(--font-roboto)"],
        serif: ["var(--font-source-serif-4)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
export default config;
