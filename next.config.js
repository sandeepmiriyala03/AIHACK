// next.config.js

// @ts-expect-error next-pwa has no official types
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,

  fallbacks: {
    document: "/offline.html",
  },

  runtimeCaching: [

    // 1️⃣ App Pages
    {
      urlPattern: /^https:\/\/.*\/$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "pages",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    // 2️⃣ Next Data (IMPORTANT FIX)
    {
      urlPattern: /\/_next\/data\/.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "next-data",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    // 3️⃣ Static Files
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static",
        expiration: {
          maxEntries: 300,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    // 4️⃣ Images
    {
      urlPattern: /\/_next\/image\?.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    // 5️⃣ HuggingFace Models
    {
      urlPattern: /^https:\/\/huggingface\.co\/.*\/resolve\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "hf-models",
        expiration: {
          maxEntries: 300,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    {
      urlPattern: /^https:\/\/cdn\.huggingface\.co\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "hf-cdn",
        expiration: {
          maxEntries: 300,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    // 6️⃣ Transformers
    {
      urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/@xenova\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "transformers",
        expiration: {
          maxEntries: 300,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },

    // 7️⃣ ONNX WASM
    {
      urlPattern: /onnxruntime-web.*\.wasm$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "onnx-wasm",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },

    // 8️⃣ ONNX Models
    {
      urlPattern: /\/models\/.*\.onnx$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "onnx-models",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },

    // 9️⃣ Tesseract Data
    {
      urlPattern: /^https:\/\/tessdata\.projectnaptha\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "tesseract",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },

    // 🔟 Fonts
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: "CacheFirst",
      options: { cacheName: "fonts" },
    },

    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: "CacheFirst",
      options: { cacheName: "fonts-static" },
    },

    // 🔥 FINAL FIX (Catch All)
    {
      urlPattern: /.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "others",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ ADD THIS LINE
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