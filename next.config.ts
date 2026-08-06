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
    // Article cover/gallery images are uploaded to R2 and served from the
    // R2_PUBLIC_URL custom domain — next/image refuses to optimize any
    // remote host not explicitly allow-listed here.
    remotePatterns: [{ protocol: "https", hostname: "indonesiatanpapolusi.org", pathname: "/articles/**" }],
  },
};

export default nextConfig;
