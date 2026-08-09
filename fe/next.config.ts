import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: process.env.DIST_DIR,
  devIndicators: false,
  env: {
    MODE: process.env.MODE
  }
};

export default nextConfig;
