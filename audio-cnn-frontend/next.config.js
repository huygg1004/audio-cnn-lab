/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Ignore ESLint errors (like the "unsafe assignment" and "optional chain" warnings)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript type errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default config;