/** @type {import('next').NextConfig} */
const path = require("path");

const withPWA = require("next-pwa")({
  dest:                  "public",
  register:              true,
  skipWaiting:           true,   // Apply new SW immediately
  cleanupOutdatedCaches: true,   // Delete old caches automatically  ← NEW
  disable:               process.env.NODE_ENV === "development",
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify:       true,
  experimental: {
    webpackBuildWorker: true,
  },
  transpilePackages: [
    "@yuktishaalaa/yuktai",
    "llamaindex",
    "@huggingface/transformers",
  ],
  typescript: { ignoreBuildErrors: true },
  images:     { unoptimized: true },

  webpack: (config, { isServer }) => {
    // 1. DYNAMIC ALIASING
    config.resolve.alias = {
      ...config.resolve.alias,
      "onnxruntime-web/webgpu":    path.join(__dirname, "node_modules/onnxruntime-web/dist/ort.webgpu.bundle.min.mjs"),
      "ort.webgpu.bundle.min.mjs": path.join(__dirname, "node_modules/onnxruntime-web/dist/ort.webgpu.bundle.min.mjs"),
    };

    // 2. BROWSER FALLBACKS
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs:         false,
        path:       false,
        os:         false,
        crypto:     false,
        perf_hooks: false,
        stream:     false,
        dns:        false,
        net:        false,
        tls:        false,
      };
    }

    // 3. MODERN ESM RESOLUTION
    config.module.rules.push({
      test:    /\.mjs$/,
      include: /node_modules/,
      type:    "javascript/auto",
      resolve: {
        fullySpecified: false,
      },
    });

    // 4. HANDLE BINARY/NODE FILES
    config.module.rules.push({
      test: /\.node$/,
      use:  "null-loader",
    });

    // 5. IGNORE EXTERNAL BINARIES
    config.plugins.push(
      new (require("webpack").IgnorePlugin)({
        resourceRegExp: /ort-wasm-simd-threaded\.asyncify\.wasm$|^pdf-poppler$|onnxruntime-node$|^sharp$/,
      })
    );

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers:           true,
    };

    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy",   value: "same-origin" },
        ],
      },
      // ↓ NEW — force sw.js to never be cached (always fresh)
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);