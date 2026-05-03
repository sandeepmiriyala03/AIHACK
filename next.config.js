/** @type {import('next').NextConfig} */

const withPWA = require("next-pwa")({
  dest:        "public",
  register:    true,
  skipWaiting: true,
  disable:     process.env.NODE_ENV === "development",
})

const nextConfig = {
  reactStrictMode: true,

  // Transpile yuktai plugin
  transpilePackages: ["@yuktishaalaa/yuktai"],

  // Skip type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Images
  images: {
    unoptimized: true,
  },

  // Speed up static generation
  experimental: {
    workerThreads: true,
    cpus:          2,
  },

  // Security + PWA + AI headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key:   "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key:   "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key:   "Permissions-Policy",
            value: "microphone=*, speaker=*",
          },
        ],
      },
    ]
  },
}

module.exports = withPWA(nextConfig)