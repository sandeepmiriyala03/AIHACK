/** @type {import('next').NextConfig} */

const withPWA = require("next-pwa")({
  dest:        "public",
  register:    true,
  skipWaiting: true,
  disable:     process.env.NODE_ENV === "development",
})

const nextConfig = {
  reactStrictMode: true,

  // Required for Yuktai and heavy AI packages
  transpilePackages: ["@yuktishaalaa/yuktai", "llamaindex"],

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
      };
    }

    // 2. Ignore native/Node-specific binaries during bundling
    config.plugins.push(
      new (require("webpack").IgnorePlugin)({
        resourceRegExp: /^pdf-poppler$|onnxruntime-node$|^sharp$/,
      })
    )

    // 3. Handle .node files (often used by LlamaIndex/Sharp)
    if (!isServer) {
      config.module.rules.push({
        test: /\.node$/,
        use:  "null-loader",
      })
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