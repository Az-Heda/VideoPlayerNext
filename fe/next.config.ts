import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: process.env.DIST_DIR,
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
