/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ["192.168.1.27", "flagcdn.com"], // Add flagcdn.com for HTTPS
    remotePatterns: [
      {
        protocol: "http",
        hostname: "192.168.1.51",
        port: "6006",
        pathname: "/storage/**",
      },

      // {
      //   protocol: "https",
      //   hostname: "lh3.googleusercontent.com",
      //   pathname: "/**", // allow all paths
      // },
     
     
    ],
  },
};

export default nextConfig;
