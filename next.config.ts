import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tree-shake per-import instead of bundling the whole package —
  // both libraries ship hundreds of modules under a single barrel export.
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react", "apexcharts"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
