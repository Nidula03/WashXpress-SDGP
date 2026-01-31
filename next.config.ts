import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Explicitly set workspace root to silence lockfile inference warning
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
