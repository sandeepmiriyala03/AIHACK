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
  // Essential for local-first AI modules
  transpilePackages: ["@yuktishaalaa/yuktai", "llamaindex", "@huggingface/transformers"],
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },

  webpack: (config, { isServer }) => {
    // 1. RESOLVE ALIASES (Fixed to catch both literal name and package path)
    config.resolve.alias = {
      ...config.resolve.alias,
      "onnxruntime-web/webgpu": path.resolve(__dirname, "node_modules/onnxruntime-web/dist/ort.webgpu.bundle.min.mjs"),
      "ort.webgpu.bundle.min.mjs": path.resolve(__dirname, "node_modules/onnxruntime-web/dist/ort.webgpu.bundle.min.mjs"),
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
      // Prevents the Node.js build from crashing on browser-only WebGPU bundles
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

    // 7. ENABLE WEB-AI EXPERIMENTS
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
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);