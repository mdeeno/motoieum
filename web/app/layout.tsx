import './globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'MOTOIEUM',
  description: '오토바이 중고거래 및 커뮤니티',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* ✅ 카카오맵 스크립트 추가 (autoload=false 필수) */}
        {/* 👇 아래 YOUR_KAKAO_KEY 부분을 복사한 키로 바꾸세요! */}
        <Script
          strategy="beforeInteractive"
          src="//dapi.kakao.com/v2/maps/sdk.js?appkey=c223f6110e84b8965b50e4ecfd7fc3b3&autoload=false"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
