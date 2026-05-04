/** @type {import('next').NextConfig} */

const withPWA = require("next-pwa")({
  dest:        "public",
  register:    true,
  skipWaiting: true,
  disable:     process.env.NODE_ENV === "development",
})

const nextConfig = {
  reactStrictMode: true,

  // Fixes "Call retries were exceeded" by isolating the build worker
  experimental: {
    webpackBuildWorker: true,
  },

  // Added @huggingface/transformers to this list
  transpilePackages: ["@yuktishaalaa/yuktai", "llamaindex", "@huggingface/transformers"],

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  webpack: (config, { isServer }) => {
    // 1. Handle Node.js modules that don't exist in the browser
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

    // 2. Fix for Transformers.js / ONNX WASM errors
    // We explicitly ignore the .wasm and .mjs files that were crashing your build
    config.plugins.push(
      new (require("webpack").IgnorePlugin)({
        resourceRegExp: /ort-wasm-simd-threaded\.asyncify\.wasm$|ort\.webgpu\.bundle\.min\.mjs$|^pdf-poppler$|onnxruntime-node$|^sharp$/,
      })
    )

    // 3. Handle .node files
    if (!isServer) {
      config.module.rules.push({
        test: /\.node$/,
        use:  "null-loader",
      })
    }

    // 4. Specifically handle WASM files if the IgnorePlugin isn't enough
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
            key:   "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key:   "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key:   "Permissions-Policy",
            value: "microphone=*, speaker=*",
          },
        ],
      },
    ]
  },
}

module.exports = withPWA(nextConfig)