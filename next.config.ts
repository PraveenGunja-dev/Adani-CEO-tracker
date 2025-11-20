import type { NextConfig } from "next";
 
const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
 
  async rewrites() {
    // In production, API requests are handled by this FastAPI server
    // In development, we proxy to the local FastAPI server
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
   
    return [
      {
        source: "/api/table-data",
        destination: "http://localhost:8005/table-data",
      },
      {
        source: "/api/table-data/:path*",
        destination: "http://localhost:8005/table-data/:path*",
      },
      {
        source: "/api/dropdown-options",
        destination: "http://localhost:8005/dropdown-options",
      },
      {
        source: "/api/dropdown-options/:path*",
        destination: "http://localhost:8005/dropdown-options/:path*",
      },
      {
        source: "/api/location-relationships",
        destination: "http://localhost:8005/location-relationships",
      },
      {
        source: "/api/location-relationships/:path*",
        destination: "http://localhost:8005/location-relationships/:path*",
      },
      {
        source: "/api/health",
        destination: "http://localhost:8005/health",
      },
    ];
  },
};
 
export default nextConfig;
 
 