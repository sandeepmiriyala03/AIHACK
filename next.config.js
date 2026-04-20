/** @type {import('next').NextConfig} */

// @ts-expect-error next-pwa has no official types
const withPWA = require("next-pwa")({
  dest: "public",
  
  // ✅ Disable in dev for faster refresh
  disable: process.env.NODE_ENV === "development",

  register: true,
  skipWaiting: true,
  clientsClaim: true,

  // 🚀 FIX: Set to 50MB to accommodate large ONNX and TensorFlow WASM/Model files
  maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, 

  runtimeCaching: [
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
  ],
  fallbacks: {
    document: "/offline.html",
  },
});

const nextConfig = {
  reactStrictMode: true,
  
  // 🛠️ UNBLOCK BUILD: Increases timeout to 10 mins to prevent hanging at 1/26 
  // while heavy AI libraries are being processed in the background.
  staticPageGenerationTimeout: 600,

  transpilePackages: ["@yuktishaalaa/yuktai"],

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
    // 🛠️ SILENCE WARNINGS: Stops ONNX/Node.js critical dependency errors
    config.module.exprContextCritical = false;

    config.ignoreWarnings = [
      { module: /ort\.bundle\.min\.mjs$/ },
      { module: /ort\.node\.min\.mjs$/ },
    ];

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