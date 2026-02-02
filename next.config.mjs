/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // Standalone output for optimized production builds
  output: "standalone",

  // Transpile settings to resolve arktype/zod HMR issues
  transpilePackages: ["arktype", "zod"],

  // In Next.js 15, serverExternalPackages became stable
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "puppeteer-core",
    "@sparticuz/chromium",
    "sharp",
    "canvas",
    "@napi-rs/canvas",
    "jszip",
  ],

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-7c765f3726084c52bcd5d180d51f1255.r2.dev",
      },
      {
        protocol: "https",
        hostname: "pptgen-public.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "pptgen-public.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "img.icons8.com",
      },
      {
        protocol: "https",
        hostname: "present-for-me.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "yefhrkuqbjcblofdcpnr.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "pixabay.com",
      },
    ],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  // Empty turbopack config to allow webpack config alongside Turbopack in Next.js 16
  turbopack: {},
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const cacheControl = isProd
      ? "public, max-age=31536000, immutable"
      : "no-store, must-revalidate";
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: cacheControl,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
