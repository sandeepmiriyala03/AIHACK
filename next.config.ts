// @ts-expect-error next-pwa has no official TypeScript types
import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 🚀 REQUIRED FOR ONNX RUNTIME WASM
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // These allow SharedArrayBuffer, which TrOCR needs to run in the browser
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
        ],
      },
      {
        // 🌐 Fixes CORS and 404 behavior for your large model files
        source: '/models/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // 🧠 IMPORTANT: Prevents the PWA from crashing by trying to cache 300MB+ models
  publicExcludes: ['!models/**/*'], 
})(nextConfig);

