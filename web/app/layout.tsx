import './globals.css';
import Script from 'next/script'; // ✅ Script 컴포넌트 필수

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
        <Script
          strategy="beforeInteractive"
          src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=7n4ywi632h"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
