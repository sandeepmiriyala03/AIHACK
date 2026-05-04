/** @type {import('next').NextConfig} */
const path = require("path");

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  experimental: {
    webpackBuildWorker: true,
  },

  transpilePackages: ["@yuktishaalaa/yuktai", "llamaindex", "@huggingface/transformers"],

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  webpack: (config, { isServer }) => {
    // 1. Resolve fallback for browser environments
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

      // FIX: Ensure the WebGPU bundle is properly mapped and not ignored
      config.resolve.alias = {
        ...config.resolve.alias,
        "onnxruntime-web/webgpu": path.resolve(__dirname, "node_modules/onnxruntime-web/dist/ort.webgpu.bundle.min.mjs"),
      };
    }

    // 2. Updated IgnorePlugin: REMOVED ort.webgpu.bundle.min.mjs from here
    config.plugins.push(
      new (require("webpack").IgnorePlugin)({
        resourceRegExp: /ort-wasm-simd-threaded\.asyncify\.wasm$|^pdf-poppler$|onnxruntime-node$|^sharp$/,
      })
    )

    // 3. Handle .node files
    if (!isServer) {
      config.module.rules.push({
        test: /\.node$/,
        use: "null-loader",
      })
    }

    // 4. Treat .mjs files as ESM
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
    });

    // 5. Enable import.meta support
    config.module.parser = {
      ...config.module.parser,
      javascript: {
        importMeta: true,
      },
    };

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    return config;
  },

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
          {
            key: "Permissions-Policy",
            value: "microphone=*, speaker=*",
          },
        ],
      },
    ]
  },
}

module.exports = withPWA(nextConfig)