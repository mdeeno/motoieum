'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ==========================================
// 1. 샘플 데이터
// ==========================================
const MARKET_ITEMS = [
  {
    id: 1,
    source: 'motoieum',
    title: '22년식 슈퍼커브 110 팝니다',
    price: '185만원',
    loc: '성동구',
    date: '1일 전',
    img: 'bg-blue-100',
    status: '판매중',
  },
  {
    id: 2,
    source: 'batumae',
    title: '혼다 PCX 125 ABS 급매합니다',
    price: '250만원',
    loc: '강남구',
    date: '3시간 전',
    img: 'bg-gray-200',
    status: '예약중',
  },
  {
    id: 3,
    source: 'lightbargain',
    title: '[인증중고] 포르자 350 튜닝 다수',
    price: '620만원',
    loc: '라이트바겐',
    date: '2일 전',
    img: 'bg-red-100',
    status: '판매완료',
  },
  {
    id: 4,
    source: 'motoieum',
    title: '배달통 및 거치대 일괄',
    price: '5만원',
    loc: '마포구',
    date: '방금 전',
    img: 'bg-green-100',
    status: '판매중',
  },
  {
    id: 5,
    source: 'batumae',
    title: '야마하 NMAX 125 상태 S급',
    price: '280만원',
    loc: '서초구',
    date: '6일 전',
    img: 'bg-purple-100',
    status: '판매중',
  },
  {
    id: 6,
    source: 'motoieum',
    title: '쇼에이 헬멧 L사이즈',
    price: '45만원',
    loc: '은평구',
    date: '5일 전',
    img: 'bg-yellow-100',
    status: '판매중',
  },
];

const POSTS = [
  {
    id: 1,
    category: '자유',
    title: '이번 주말 양만장 가실 분 계신가요?',
    author: '라이더1',
    views: 120,
    comments: 5,
    date: '12:30',
  },
  {
    id: 2,
    category: '질문',
    title: '엔진오일 교체 주기 질문드립니다.',
    author: '바린이',
    views: 55,
    comments: 12,
    date: '11:05',
  },
  {
    id: 3,
    category: '정보',
    title: '성수동 혼다 예약 꿀팁 공유합니다',
    author: '정비왕',
    views: 340,
    comments: 8,
    date: '어제',
  },
  {
    id: 4,
    category: '후기',
    title: '제우스 모토라드 다녀왔습니다 (친절함)',
    author: '비엠오너',
    views: 210,
    comments: 2,
    date: '어제',
  },
  {
    id: 5,
    category: '자유',
    title: '오늘 날씨 진짜 좋네요 안전운전하세요',
    author: '안전제일',
    views: 88,
    comments: 0,
    date: '2일 전',
  },
];

// ==========================================
// 2. 메인 컴포넌트
// ==========================================

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'market' | 'community' | 'map'>(
    'market'
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* 🟢 헤더 */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-10">
            <h1
              className="text-2xl font-black italic tracking-wide text-blue-600 cursor-pointer hover:text-blue-700 transition transform hover:scale-105"
              onClick={() => setActiveTab('market')}
            >
              MOTOIEUM
            </h1>
            <nav className="hidden md:flex gap-3">
              <HeaderTab
                label="중고장터"
                isActive={activeTab === 'market'}
                onClick={() => setActiveTab('market')}
              />
              <HeaderTab
                label="커뮤니티"
                isActive={activeTab === 'community'}
                onClick={() => setActiveTab('community')}
              />
              <HeaderTab
                label="정비지도"
                isActive={activeTab === 'map'}
                onClick={() => setActiveTab('map')}
              />
            </nav>
          </div>
          <div className="flex gap-2">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full cursor-pointer">
              🔔
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full cursor-pointer">
              🔍
            </button>
            <button
              onClick={() => router.push('/login')}
              className="hidden md:block px-5 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-gray-800 transition cursor-pointer"
            >
              로그인
            </button>
          </div>
        </div>
      </header>

      {/* 🟠 메인 컨텐츠 */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 pb-28 md:pb-8">
        {activeTab === 'market' && <MarketView />}
        {activeTab === 'community' && <CommunityView />}
        {activeTab === 'map' && <MapPlaceholder />}
      </main>

      {/* 🔵 [모바일 탭바] */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-20 safe-area-pb z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-t-2xl">
        <MobileTabButton
          label="장터"
          icon="🏷️"
          isActive={activeTab === 'market'}
          onClick={() => setActiveTab('market')}
        />
        <MobileTabButton
          label="커뮤니티"
          icon="💬"
          isActive={activeTab === 'community'}
          onClick={() => setActiveTab('community')}
        />
        <MobileTabButton
          label="정비지도"
          icon="🗺️"
          isActive={activeTab === 'map'}
          onClick={() => setActiveTab('map')}
        />
        <MobileTabButton
          label="마이"
          icon="👤"
          isActive={false}
          onClick={() => router.push('/login')}
        />
      </nav>

      {/* 글쓰기 버튼 */}
      {activeTab !== 'map' && (
        <button
          onClick={() => router.push('/write')}
          className="fixed bottom-24 right-5 md:bottom-12 md:right-12 bg-blue-600 text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl text-3xl flex items-center justify-center hover:bg-blue-500 active:scale-90 transition-all duration-300 z-50 cursor-pointer"
        >
          <span className="-mt-1">+</span>
        </button>
      )}
    </div>
  );
}

// ------------------------------------------
// 컴포넌트들
// ------------------------------------------

function MarketView() {
  const router = useRouter();
  const [filter, setFilter] = useState('all'); // all, motoieum, batumae, lightbargain

  // 필터링 로직
  const filteredItems =
    filter === 'all'
      ? MARKET_ITEMS
      : MARKET_ITEMS.filter((item) => item.source === filter);

  // 출처별 뱃지 스타일
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'motoieum':
        return (
          <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            모토이음
          </span>
        );
      case 'batumae':
        return (
          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            바튜매
          </span>
        );
      case 'lightbargain':
        return (
          <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            라이트바겐
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-extrabold text-gray-800 px-2">
          🔥 실시간 인기 매물
        </h2>

        {/* 장터 필터 탭 */}
        <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide">
          {['all', 'motoieum', 'batumae', 'lightbargain'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all cursor-pointer
                ${
                  filter === type
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              {type === 'all'
                ? '전체'
                : type === 'motoieum'
                ? '모토이음'
                : type === 'batumae'
                ? '바이크튜닝매니아'
                : '라이트바겐'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => router.push(`/market/${item.id}`)}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer overflow-hidden flex flex-row sm:flex-col h-36 sm:h-auto"
          >
            <div
              className={`w-32 sm:w-full sm:h-52 ${item.img} flex items-center justify-center text-gray-400 font-medium text-sm shrink-0 group-hover:scale-105 transition duration-500 relative`}
            >
              상품 이미지
              {item.status !== '판매중' && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white font-bold border-2 border-white px-3 py-1 rounded-lg transform -rotate-12">
                    {item.status}
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 flex flex-col justify-between flex-1">
              <div>
                <div className="flex justify-between items-start mb-1">
                  {getSourceBadge(item.source)}
                  <span className="text-xs text-gray-400">{item.date}</span>
                </div>
                <h3 className="font-bold text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition text-sm sm:text-base">
                  {item.title}
                </h3>
                <div className="text-gray-400 text-xs font-medium mb-2">
                  {item.loc}
                </div>
              </div>
              <div className="flex justify-between items-end mt-1 sm:mt-4">
                <span className="font-extrabold text-lg sm:text-xl text-gray-900">
                  {item.price}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunityView() {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[600px]">
        <div className="flex border-b border-gray-100 gap-6 overflow-x-auto text-sm font-bold text-gray-400 pb-4 mb-4 scrollbar-hide">
          {['전체글', '자유게시판', '질문/답변', '정비정보', '모임/번개'].map(
            (tab, idx) => (
              <button
                key={tab}
                className={`whitespace-nowrap transition cursor-pointer ${
                  idx === 0
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                    : 'hover:text-gray-800'
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>
        <div className="divide-y divide-gray-50">
          {POSTS.map((post) => (
            <div
              key={post.id}
              className="py-5 hover:bg-gray-50 cursor-pointer transition flex items-center justify-between group rounded-lg px-2"
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="bg-blue-50 text-blue-600 text-[11px] px-2 py-1 rounded-md font-bold">
                    {post.category}
                  </span>
                  <h3 className="font-bold text-gray-900 text-base truncate group-hover:text-blue-600 transition">
                    {post.title}
                  </h3>
                </div>
                <div className="text-xs font-medium text-gray-400">
                  {post.author} · {post.date} · 조회 {post.views}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center bg-gray-100 px-4 py-1.5 rounded-lg text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition">
                <span className="text-[10px] font-medium">댓글</span>
                <span className="font-bold">{post.comments}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden lg:block w-80 space-y-6">
        <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm">
          <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
            📢 공지사항
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            MOTOIEUM 커뮤니티 이용 수칙이 개정되었습니다.
            <br />
            클린한 라이딩 문화를 위해 필독 부탁드립니다!
          </p>
        </div>
      </div>
    </div>
  );
}

function MapPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 bg-white rounded-3xl border border-dashed border-gray-300 m-4">
      <div className="text-8xl mb-6 animate-pulse grayscale opacity-50">🗺️</div>
      <h2 className="text-3xl font-black text-gray-800 mb-4">MAP SERVICE</h2>
      <p className="text-gray-500 font-medium">
        정비 지도는 더 완벽한 모습으로
        <br />
        찾아오기 위해 준비 중입니다.
      </p>
    </div>
  );
}

function HeaderTab({ label, isActive, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full text-base font-bold transition-all cursor-pointer ${
        isActive
          ? 'bg-blue-600 text-white shadow-md scale-105'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {label}
    </button>
  );
}

function MobileTabButton({ label, icon, isActive, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center w-full h-full cursor-pointer active:scale-95 transition-all"
    >
      <span
        className={`text-2xl transition-all ${
          isActive ? '-translate-y-1' : 'opacity-50 grayscale'
        }`}
      >
        {icon}
      </span>
      <span
        className={`text-xs font-bold transition-all ${
          isActive ? 'text-blue-600' : 'text-gray-400'
        }`}
      >
        {label}
      </span>
    </button>
  );
}
