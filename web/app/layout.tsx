import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MOTOIEUM',
  description: '오토바이 중고거래 & 커뮤니티 & 정비지도',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* ✅ autoload=false 필수 추가 
          지도가 로딩되기 전에 접근하는 에러를 막기 위해 수동 로딩으로 전환합니다.
        */}
        <script
          type="text/javascript"
          src="//dapi.kakao.com/v2/maps/sdk.js?appkey=c223f6110e84b8965b50e4ecfd7fc3b3&libraries=services,clusterer&autoload=false"
        ></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
