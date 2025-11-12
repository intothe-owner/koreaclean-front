// next.config.ts
import type { NextConfig } from "next";

/**
 * 배포용 Next.js 설정
 * - output: 'standalone' → EC2에서 가볍게 실행
 * - 이미지 원격 허용 도메인 정리
 * - 빌드 속도/안정성 옵션
 * - 프록시는 Nginx에서 처리(권장) → Next rewrites는 개발/임시용만 유지
 */
const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  env: { SKIP_BUILD_FETCH: "true" },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "cleanhome-web.cleaninglab.co.kr", pathname: "**" },
      { protocol: "https", hostname: "asezstar.org", pathname: "**" },

      // 개발/사내망 테스트가 필요하면 아래 두 줄을 남겨두고,
      // 운영 빌드에서는 가급적 제거하세요(보안/캐시 일관성).
      { protocol: "http", hostname: "localhost", port: "4500", pathname: "**" },
      { protocol: "http", hostname: "3.36.49.217", port: "80", pathname: "**" },
    ],
    // 필요 시 사이즈 튜닝
    deviceSizes: [360, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  trailingSlash: false,

  webpack: (config) => {
    // 서버 번들 슬림화: node 전용 모듈 false 처리
    config.resolve.fallback = {
      ...config.resolve.fallback,
      path: false,
      fs: false,
    };
    return config;
  },

  /**
   * ✅ 운영에서는 Nginx(ALB)에서 프록시/웹소켓 업그레이드를 처리하세요.
   * 아래 rewrites는 "개발/단일 서버"에서만 임시 사용 용도입니다.
   * 배포 시에는 .env에 BACKEND_ORIGIN을 넣어 쓰세요.
   */
  async rewrites() {
    const backend = process.env.BACKEND_ORIGIN; // 예: http://127.0.0.1:4500 (개발용)
    if (!backend) return [];

    return [
      { source: "/backend/:path*", destination: `${backend}/:path*` },
      // Socket.IO(개발용) – 운영은 Nginx에서 처리 권장
      { source: "/socket.io", destination: `${backend}/socket.io` },
      { source: "/socket.io/", destination: `${backend}/socket.io/` },
      { source: "/socket.io/:path*", destination: `${backend}/socket.io/:path*` },
    ];
  },
};

export default nextConfig;
