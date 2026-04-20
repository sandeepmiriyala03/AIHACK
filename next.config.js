/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 1. Core Transpilation
  transpilePackages: ["@yuktishaalaa/yuktai"],

  // 2. Build Speed-ups (Must be at top level)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 3. Image & Headers
  images: {
    unoptimized: true,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            // 'credentialless' is safer for internal build workers
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

  // 4. Clean Experimental (Removed invalid 'allowedRevisions')
  experimental: {}, 
};

module.exports = nextConfig;