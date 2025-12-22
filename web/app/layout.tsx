import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

// 👇 [핵심] 메타데이터 설정을 통해 '비밀 모드(no-referrer)'를 전역에 적용합니다.
export const metadata: Metadata = {
  title: 'MOTOIEUM - 라이더를 위한 모든 것',
  description: '중고 오토바이 거래부터 정비 정보까지',
  referrer: 'no-referrer', // ✅ 이 한 줄이 엑박을 막아주는 마법의 코드입니다!
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      {/* Next.js가 자동으로 <head>를 관리하므로 직접 <head> 태그를 쓸 필요가 없습니다. */}

      <body className={inter.className}>
        {/* 👇 카카오 지도는 body 안에서 불러오는 것이 안정적입니다. */}
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services,clusterer`}
          strategy="beforeInteractive"
        />

        {children}
      </body>
    </html>
  );
}
