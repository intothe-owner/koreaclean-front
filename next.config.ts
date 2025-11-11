import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cleanhome-web.cleaninglab.co.kr", pathname: "**" },
      { protocol: "http", hostname: "localhost", port: "4500", pathname: "**" },
      { protocol: "http", hostname: "113.131.151.103", port: "4500", pathname: "**" },
      { protocol: "https", hostname: "asezstar.org", pathname: "**" },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash:false,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      path: false,
      fs: false,
    
    };
    return config;
  },

  // ✅ API 프록시 설정 추가
  async rewrites() {
    return [
      { source: "/backend/:path*", destination: "http://113.131.151.103:4500/:path*" },
       // ★ Socket.IO 프록시 (3종 세트)
      { source: "/socket.io", destination: "http://113.131.151.103:4500/socket.io" },
      { source: "/socket.io/", destination: "http://113.131.151.103:4500/socket.io/" },
      { source: "/socket.io/:path*", destination: "http://113.131.151.103:4500/socket.io/:path*" },
    ];
  },
};

export default nextConfig;
