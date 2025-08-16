import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: process.env.DIST_DIR,
  eslint: {
    ignoreDuringBuilds: true
  },
  env: {
    MODE: process.env.MODE
  }
};

export default nextConfig;
