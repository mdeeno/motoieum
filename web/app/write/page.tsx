// web/app/market/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase'; // 👈 진짜 데이터 가져오기 위해 추가

// ==========================================
// 1. 타입 정의 (Supabase 데이터 모양)
// ==========================================
type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  image_url: string | null;
};

// ==========================================
// 2. 메인 컴포넌트
// ==========================================

export default function MarketPage() {
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
            <button className="hidden md:block px-5 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-gray-800 transition cursor-pointer">
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
          onClick={() => alert('로그인 페이지로 이동')}
        />
      </nav>

      {/* 글쓰기 버튼 (지도 탭이 아닐 때만 보임) */}
      {activeTab !== 'map' && (
        <button
          onClick={() => router.push('/write')}
          className="fixed bottom-24 right-5 md:bottom-12 md:right-12 bg-orange-500 text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl text-3xl flex items-center justify-center hover:bg-orange-600 active:scale-90 transition-all duration-300 z-50 cursor-pointer"
        >
          <span className="-mt-1">+</span>
        </button>
      )}
    </div>
  );
}

// ------------------------------------------
// 하위 컴포넌트들
// ------------------------------------------

function MarketView() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]); // 👈 가짜 데이터 대신 진짜 데이터 저장소

  // 🚀 Supabase에서 데이터 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error('에러:', error);
      else setPosts(data || []);
    };

    fetchPosts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-extrabold text-gray-800 px-2">
          🔥 실시간 인기 매물
        </h2>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>아직 등록된 매물이 없어요 😢</p>
          <p className="text-sm">우측 하단 + 버튼을 눌러 첫 글을 써보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {posts.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(`/market/${item.id}`)}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer overflow-hidden flex flex-row sm:flex-col h-36 sm:h-auto"
            >
              {/* 📸 썸네일 이미지 영역 */}
              <div className="w-32 sm:w-full sm:h-52 bg-gray-100 flex items-center justify-center text-gray-400 font-medium text-sm shrink-0 group-hover:scale-105 transition duration-500 relative overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>이미지 없음</span>
                )}
              </div>

              {/* 📝 텍스트 정보 영역 */}
              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      모토이음
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition text-sm sm:text-base">
                    {item.title}
                  </h3>
                  <div className="text-gray-400 text-xs font-medium mb-2 line-clamp-1">
                    {item.content}
                  </div>
                </div>
                <div className="flex justify-between items-end mt-1 sm:mt-4">
                  <span className="font-extrabold text-lg sm:text-xl text-gray-900">
                    가격 미정
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// (커뮤니티랑 지도는 그대로 뒀습니다)
function CommunityView() {
  return (
    <div className="text-center py-20 text-gray-400">
      커뮤니티 준비 중... 🚧
    </div>
  );
}

function MapPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 bg-white rounded-3xl border border-dashed border-gray-300 m-4">
      <div className="text-8xl mb-6 animate-pulse grayscale opacity-50">🗺️</div>
      <h2 className="text-3xl font-black text-gray-800 mb-4">MAP SERVICE</h2>
      <p className="text-gray-500 font-medium">정비 지도는 준비 중입니다.</p>
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
