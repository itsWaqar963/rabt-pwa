import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin tracing root to this app — parent lockfile at C:\Users\Sudo
  // otherwise becomes workspace root and Next JSON.parse's missing package.json.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
