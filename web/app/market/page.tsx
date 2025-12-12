// web/app/market/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

// 타입 정의
type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  image_url: string | null;
  price: number | null;
  category: string; // 📂 카테고리 추가
};

export default function MarketPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'market' | 'community' | 'map'>(
    'market'
  );
  const [user, setUser] = useState<any>(null); // 👤 로그인 유저 정보

  // 로그인 상태 확인
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    // 로그인/로그아웃 변화 감지
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert('로그아웃 되었습니다.');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* 🟢 헤더 */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-10">
            <h1
              className="text-2xl font-black italic tracking-wide text-blue-600 cursor-pointer"
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
            {user ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-600 text-sm font-bold hover:bg-gray-100 rounded-lg"
              >
                로그아웃
              </button>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="px-5 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-gray-800 transition"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 🟠 메인 컨텐츠 */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 pb-28 md:pb-8">
        {/* 탭에 따라 필터링해서 보여주기 */}
        {activeTab === 'market' && <PostListView category="market" />}
        {activeTab === 'community' && <PostListView category="community" />}
        {activeTab === 'map' && <MapPlaceholder />}
      </main>

      {/* 🔵 모바일 탭바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-20 safe-area-pb z-40 rounded-t-2xl shadow-up">
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
          label={user ? '내정보' : '로그인'}
          icon="👤"
          isActive={false}
          onClick={() =>
            user ? alert('내 정보 준비중') : router.push('/login')
          }
        />
      </nav>

      {/* 글쓰기 버튼 */}
      {activeTab !== 'map' && (
        <button
          onClick={() => router.push('/write')}
          className={`fixed bottom-24 right-5 md:bottom-12 md:right-12 text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl text-3xl flex items-center justify-center active:scale-90 transition-all z-50 cursor-pointer ${
            activeTab === 'market'
              ? 'bg-orange-500 hover:bg-orange-600'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <span className="-mt-1">+</span>
        </button>
      )}
    </div>
  );
}

// 📋 통합 게시글 리스트 뷰 (장터/커뮤니티 공용)
function PostListView({ category }: { category: string }) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      // 📂 카테고리에 맞는 글만 가져오기!
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('category', category) // 핵심: 여기서 필터링
        .order('created_at', { ascending: false });
      setPosts(data || []);
    };
    fetchPosts();
  }, [category]);

  return (
    <div className="space-y-6">
      <h2
        className={`text-xl font-extrabold px-2 ${
          category === 'market' ? 'text-gray-800' : 'text-blue-800'
        }`}
      >
        {category === 'market' ? '🔥 실시간 인기 매물' : '🗣️ 라이더들의 수다'}
      </h2>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>아직 등록된 글이 없어요 😢</p>
          <p className="text-sm">우측 하단 + 버튼을 눌러 첫 글을 써보세요!</p>
        </div>
      ) : (
        <div
          className={
            category === 'market'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
              : 'flex flex-col gap-3'
          }
        >
          {posts.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(`/market/${item.id}`)}
              className={`group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden ${
                category === 'market'
                  ? 'flex flex-row sm:flex-col h-36 sm:h-auto'
                  : 'p-5 flex items-center justify-between'
              }`}
            >
              {category === 'market' ? (
                // 🏷️ 장터 카드 디자인
                <>
                  <div className="w-32 sm:w-full sm:h-52 bg-gray-100 relative overflow-hidden shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                        이미지 없음
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="font-bold text-gray-900 line-clamp-2 mb-1 text-sm sm:text-base">
                        {item.title}
                      </h3>
                      <div className="text-gray-400 text-xs mb-2 line-clamp-1">
                        {item.content}
                      </div>
                    </div>
                    <span className="font-extrabold text-lg sm:text-xl text-gray-900">
                      {item.price?.toLocaleString()}원
                    </span>
                  </div>
                </>
              ) : (
                // 💬 커뮤니티 리스트 디자인
                <>
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-bold text-gray-900 text-base truncate mb-1 group-hover:text-blue-600 transition">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-1">
                      {item.content}
                    </p>
                    <span className="text-xs text-gray-400 mt-2 block">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {item.image_url && (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={item.image_url}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 나머지 컴포넌트들
function MapPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 bg-white rounded-3xl border border-dashed border-gray-300 m-4">
      <div className="text-8xl mb-6 grayscale opacity-50">🗺️</div>
      <h2 className="text-3xl font-black text-gray-800 mb-4">MAP SERVICE</h2>
      <p className="text-gray-500">정비 지도는 준비 중입니다.</p>
    </div>
  );
}
function HeaderTab({ label, isActive, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full text-base font-bold transition-all ${
        isActive
          ? 'bg-blue-600 text-white shadow-md scale-105'
          : 'text-gray-500 hover:bg-gray-100'
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
