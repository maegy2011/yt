import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Remove webpack watch options to enable proper HMR and WebSocket functionality
  eslint: {
    // 构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },
  // Add proper WebSocket and HMR configuration
  experimental: {
    // Enable proper HMR
    webpackBuildWorker: true,
  },
  // Configure rewrites to handle API routes properly
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

export default nextConfig;
