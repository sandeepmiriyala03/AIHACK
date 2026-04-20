/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Transpile your UI package
  transpilePackages: ["@yuktishaalaa/yuktai"],

  // Skip type checking and linting during build (Next.js 16 way)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Images
  images: {
    unoptimized: true,
  },

  // Speed up static page generation (uses your 2 Vercel cores)
  experimental: {
    workerThreads: true,
    cpus: 2,
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;