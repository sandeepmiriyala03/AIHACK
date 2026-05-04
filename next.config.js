/** @type {import('next').NextConfig} */
const path = require("path");

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    webpackBuildWorker: true,
  },
  transpilePackages: ["@yuktishaalaa/yuktai", "llamaindex", "@huggingface/transformers"],
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },

  webpack: (config, { isServer }) => {
    // 1. DYNAMIC ALIASING
    // Instead of absolute local paths, we let the bundler handle the module resolution
    // This prevents hardcoding /vercel/path0/ into your client-side JS
    config.resolve.alias = {
      ...config.resolve.alias,
      "onnxruntime-web/webgpu": "onnxruntime-web/dist/ort.webgpu.bundle.min.mjs",
    };

    // 2. BROWSER FALLBACKS
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        perf_hooks: false,
        stream: false,
        dns: false,
        net: false,
        tls: false,
      };
    }

    // 3. SERVER-SIDE BYPASS
    if (isServer) {
      config.module.rules.push({
        test: /ort\.webgpu\.bundle\.min\.mjs$/,
        loader: "null-loader",
      });
    }

    // 4. HANDLE BINARY/NODE FILES
    config.module.rules.push({
      test: /\.node$/,
      use: "null-loader",
    });

    // 5. MODERN ESM RESOLUTION
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
      resolve: {
        fullySpecified: false,
      },
    });

    // 6. IGNORE EXTERNAL BINARIES
    config.plugins.push(
      new (require("webpack").IgnorePlugin)({
        resourceRegExp: /ort-wasm-simd-threaded\.asyncify\.wasm$|^pdf-poppler$|onnxruntime-node$|^sharp$/,
      })
    );

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Use 'require-corp' for stronger isolation required by WebGPU/SharedArrayBuffer
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);