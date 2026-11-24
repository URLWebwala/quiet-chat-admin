/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false; // Prevents webpack chunk caching collisions during hot reload
    }
    return config;
  },
  images: {
    domains: ["192.168.1.27", "flagcdn.com"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "192.168.1.51",
        port: "6006",
        pathname: "/storage/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/ai/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
