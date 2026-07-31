import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@setu/ui", "@setu/types"],
};

export default nextConfig;
