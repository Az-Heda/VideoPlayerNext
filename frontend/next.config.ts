import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "export",
  distDir: "out",
  devIndicators: {
    position: 'bottom-right',
  }
}

export default nextConfig
