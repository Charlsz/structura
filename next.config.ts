import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile react-force-graph for dynamic import
  transpilePackages: ["react-force-graph", "three"],

  // Empty turbopack config to enable Turbopack (Next.js 16 default)
  turbopack: {},

  // Image domains for GitHub avatars
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
