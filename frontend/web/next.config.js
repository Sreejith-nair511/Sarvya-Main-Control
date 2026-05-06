/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  // No proxy needed — all API routes are built-in Next.js /app/api routes
};

module.exports = nextConfig;
