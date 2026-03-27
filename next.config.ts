import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow custom font links in layout (App Router handles this correctly)
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
