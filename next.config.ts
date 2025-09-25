import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },     // don't fail deploys on lint
  // optional if you ever hit TS errors in CI:
  // typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
