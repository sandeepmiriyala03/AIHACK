/** @type {import('next').NextConfig} */

// @ts-expect-error next-pwa has no official types
const withPWA = require("next-pwa")({
  dest: "public",

  // ✅ Disable in dev
  disable: process.env.NODE_ENV === "development",

  register: true,
  skipWaiting: true,
  clientsClaim: true,

  // ⚠️ IMPORTANT: avoid aggressive stale caching
  runtimeCaching: [
    // Pages (always fresh first)
    {
      urlPattern: ({ request }) => request.destination === "document",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24,
        },
      },
    },

    // Next static files (safe to cache)
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static",
        expiration: {
          maxEntries: 300,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },

    // Next data
    {
      urlPattern: /\/_next\/data\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "next-data",
      },
    },

    // Images
    {
      urlPattern: /\/_next\/image\?.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
      },
    },
  ],

  fallbacks: {
    document: "/offline.html",
  },
});

const nextConfig = {
  reactStrictMode: true,

  transpilePackages: ["yuktai-js"],

  async headers() {
    return [
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

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "onnxruntime-node": false,
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
    });

    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },
};

module.exports = withPWA(nextConfig);