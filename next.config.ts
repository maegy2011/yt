import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable strict type checking in production
  typescript: {
    ignoreBuildErrors: false,
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Optimize webpack configuration
  webpack: (config, { dev }) => {
    if (dev) {
      // Optimize watch options for better performance
      config.watchOptions = {
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  // Enable ESLint during builds for code quality
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

export default nextConfig;
