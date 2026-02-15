/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "**.convex.site",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
