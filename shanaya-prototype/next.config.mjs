/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false; // Disables PackFileCacheStrategy on disk to eliminate chunk mismatch errors
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://admin.quietchat.in/api/:path*',
      },
    ];
  },
};

export default nextConfig;
