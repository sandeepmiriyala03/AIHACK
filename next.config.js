// next.config.js
// ================================================================
// AksharaTantra — Full Offline PWA Configuration
// OCR + HTR + Voice (MMS TTS) Fully Offline After First Load
// ================================================================

// @ts-expect-error next-pwa has no official types
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,

  runtimeCaching: [

    // 1️⃣ App Pages
    {
      urlPattern: /^https:\/\/.*\/$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "aksharatantra-pages",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    // 2️⃣ Next Static Files
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "aksharatantra-static",
        expiration: {
          maxEntries: 300,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    {
      urlPattern: /\/_next\/image\?.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "aksharatantra-images",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    // 3️⃣ HuggingFace Models
    {
      urlPattern: /^https:\/\/huggingface\.co\/.*\/resolve\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "aksharatantra-hf-resolve",
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
        cacheName: "aksharatantra-hf-cdn",
        expiration: {
          maxEntries: 300,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    // 4️⃣ Transformers.js
    {
      urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/@xenova\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "aksharatantra-transformers",
        expiration: {
          maxEntries: 300,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    // 5️⃣ ONNX Runtime WASM
    {
      urlPattern: /onnxruntime-web.*\.wasm$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "aksharatantra-onnx-wasm",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    // 6️⃣ ONNX Models
    {
      urlPattern: /\/models\/.*\.onnx$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "aksharatantra-onnx-models",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    // 7️⃣ Tesseract Data
    {
      urlPattern: /^https:\/\/tessdata\.projectnaptha\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "aksharatantra-tesseract-data",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    // 8️⃣ Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "aksharatantra-google-fonts",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "aksharatantra-google-fonts-static",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    // 9️⃣ Catch All
    {
      urlPattern: /.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "aksharatantra-others",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
        cacheableResponse: { statuses: [0, 200] },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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

    // Disable Node version of ONNX
    config.resolve.alias = {
      ...config.resolve.alias,
      "onnxruntime-node": false,
    };

    // Fix Node modules used by ONNX
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Fix .mjs module issues
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
    });

    // Enable WebAssembly
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },
};

module.exports = withPWA(nextConfig);