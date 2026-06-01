/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "tesseract.js",
      "@google/generative-ai",
      "pdf-parse",
    ],
  },
};

export default nextConfig;
