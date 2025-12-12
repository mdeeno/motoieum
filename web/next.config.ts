import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 🚀 핵심: 들어오자마자 /market 으로 강제 이동시키는 설정
  async redirects() {
    return [
      {
        source: '/',
        destination: '/market',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
