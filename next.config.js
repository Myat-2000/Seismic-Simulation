/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Disable image optimizer to ensure broader browser compatibility
  images: {
    unoptimized: true,
  },
  experimental: {
    // Disable shared Runtime (improved compatibility)
    disableSharedWorkersRuntime: true,
  },
  // Future settings
  future: {
    webpack5: true,
  },
}

module.exports = nextConfig 