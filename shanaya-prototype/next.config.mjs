/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
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
