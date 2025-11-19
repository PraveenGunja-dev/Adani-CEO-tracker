import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/table-data",
        destination: "http://localhost:8005/table-data",
      },
      {
        source: "/table-data/:path*",
        destination: "http://localhost:8005/table-data/:path*",
      },
      {
        source: "/dropdown-options",
        destination: "http://localhost:8005/dropdown-options",
      },
      {
        source: "/dropdown-options/:path*",
        destination: "http://localhost:8005/dropdown-options/:path*",
      },
      {
        source: "/location-relationships",
        destination: "http://localhost:8005/location-relationships",
      },
      {
        source: "/location-relationships/:path*",
        destination: "http://localhost:8005/location-relationships/:path*",
      },
      {
        source: "/health",
        destination: "http://localhost:8005/health",
      },
    ];
  },
};

export default nextConfig;