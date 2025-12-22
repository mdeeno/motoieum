import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 👇 [핵심] 외부 이미지(네이버, 중검단 등)를 허용하는 설정입니다.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // 모든 HTTPS 이미지 허용
      },
      {
        protocol: 'http',
        hostname: '**', // 모든 HTTP 이미지 허용 (중검단 대비)
      },
    ],
  },
};

export default nextConfig;
