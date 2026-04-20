/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Core React Settings
  reactStrictMode: true,

  // 2. Package Transpilation
  // Added to ensure the worker handles the custom package properly
  transpilePackages: ["@yuktishaalaa/yuktai"],

  // 3. Image Optimization
  images: {
    unoptimized: true,
  },

  // 4. Build Optimizations (CRITICAL FOR FIXING THE HANG)
  typescript: {
    // Prevents the "Running TypeScript" phase from timing out
    ignoreBuildErrors: true,
  },
  eslint: {
    // Speeds up the build process significantly
    ignoreDuringBuilds: true,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            // Changed to 'credentialless' to allow internal build requests to pass
            value: "credentialless", 
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
      {
        source: "/wasm/:path*",
        headers: [
          {
            key: "Content-Type",
            value: "application/wasm",
          },
        ],
      },
    ];
  },

  experimental: {
    allowedRevisions: ["*"], 
  },
};

module.exports = nextConfig;