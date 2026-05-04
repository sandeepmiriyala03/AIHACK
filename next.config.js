/** @type {import('next').NextConfig} */

const withPWA = require("next-pwa")({
  dest:        "public",
  register:    true,
  skipWaiting: true,
  disable:     process.env.NODE_ENV === "development",
})

const nextConfig = {
  reactStrictMode: true,

  transpilePackages: ["@yuktishaalaa/yuktai"],

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  allowedDevOrigins: ["192.168.1.14"],

  webpack: (config, { isServer }) => {
    // Ignore native packages that cannot run in browser or Vercel
    config.plugins.push(
      new (require("webpack").IgnorePlugin)({
        resourceRegExp: /^pdf-poppler$|onnxruntime-node/,
      })
    )
    // Ignore .node binary files in browser bundle
    if (!isServer) {
      config.module.rules.push({
        test: /\.node$/,
        use:  "null-loader",
      })
    }
    return config
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