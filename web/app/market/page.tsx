// web/app/market/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

// 데이터 타입 정의
type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  image_url: string | null;
  price: number | null;
  category: string;
};

export default function MarketPage() {
  const router = useRouter();
  // 탭 상태: market(장터), community(커뮤니티), map(정비지도)
  const [activeTab, setActiveTab] = useState<'market' | 'community' | 'map'>(
    'market'
  );
  const [user, setUser] = useState<any>(null);

  // 검색 관련 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // 유저 로그인 상태 체크
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await supabase.auth.signOut();
      setUser(null);
      // 로그아웃 후 페이지 리프레시 (선택사항)
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* 🟢 헤더 */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          {/* 로고 & PC버전 탭 */}
          <div className="flex items-center gap-4 md:gap-10">
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

          <div className="flex gap-2 items-center">
            {/* 🔍 검색창 토글 로직 */}
            {showSearch ? (
              <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 animate-fadeIn">
                <input
                  type="text"
                  placeholder="제목 검색..."
                  className="bg-transparent border-none focus:outline-none text-sm w-32 md:w-48 text-gray-900 placeholder-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchTerm('');
                  }}
                  className="text-gray-400 hover:text-red-500 ml-1 font-bold px-1"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition"
              >
                🔍
              </button>
            )}

            {/* ✅ [수정됨] 로그인 상태에 따른 버튼 (내정보 / 로그아웃) */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/my')}
                  className="px-3 py-1.5 text-blue-600 text-xs md:text-sm font-bold hover:bg-blue-50 rounded-lg whitespace-nowrap transition"
                >
                  내 정보
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-gray-400 text-xs md:text-sm hover:bg-gray-100 rounded-lg whitespace-nowrap transition"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-1.5 bg-gray-900 text-white rounded-full text-xs md:text-sm font-bold hover:bg-gray-800 transition whitespace-nowrap"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 🟠 메인 컨텐츠 영역 */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 pb-28 md:pb-8">
        {activeTab === 'market' && (
          <PostListView category="market" searchTerm={searchTerm} />
        )}
        {activeTab === 'community' && (
          <PostListView category="community" searchTerm={searchTerm} />
        )}
        {activeTab === 'map' && <ShopListView />}
      </main>

      {/* 🔵 모바일 하단 탭바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-20 safe-area-pb z-40 rounded-t-2xl shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
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
        {/* ✅ [수정됨] 내정보 버튼 클릭 시 /my 페이지로 이동 */}
        <MobileTabButton
          label={user ? '내정보' : '로그인'}
          icon="👤"
          isActive={false}
          onClick={() => (user ? router.push('/my') : router.push('/login'))}
        />
      </nav>

      {/* 🔵 글쓰기 플로팅 버튼 (지도 탭 아닐 때만 보임) */}
      {activeTab !== 'map' && (
        <button
          onClick={() => router.push('/write')}
          className="fixed bottom-24 right-5 md:bottom-12 md:right-12 bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl text-3xl flex items-center justify-center active:scale-90 transition-all z-50 cursor-pointer"
        >
          <span className="-mt-1 font-light">+</span>
        </button>
      )}
    </div>
  );
}

// --------------------------------------------------------
// 📋 하위 컴포넌트: 게시글 리스트 (장터/커뮤니티 공용)
// --------------------------------------------------------
function PostListView({
  category,
  searchTerm,
}: {
  category: string;
  searchTerm: string;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      // 카테고리 필터링
      if (category === 'market') {
        // null이거나 market인 것
        query = query.or(`category.eq.market,category.is.null`);
      } else {
        query = query.eq('category', 'community');
      }

      // 검색어 필터링
      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) console.error(error);
      else setPosts(data || []);
      setLoading(false);
    };

    fetchPosts();
  }, [category, searchTerm]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-extrabold px-2 text-gray-800">
        {searchTerm
          ? `🔍 '${searchTerm}' 검색 결과`
          : category === 'market'
          ? '🔥 실시간 인기 매물'
          : '🗣️ 라이더들의 수다'}
      </h2>

      {loading ? (
        <div className="text-center py-20 text-gray-400">로딩 중...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>
            {searchTerm
              ? '검색 결과가 없어요 😢'
              : '아직 등록된 글이 없어요 😢'}
          </p>
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
              {/* === 장터 카드 디자인 === */}
              {category === 'market' ? (
                <>
                  <div className="w-32 sm:w-full sm:h-52 bg-gray-100 relative overflow-hidden shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        alt="상품"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="font-bold text-gray-900 line-clamp-2 mb-1 text-sm sm:text-base">
                        {item.title}
                      </h3>
                      <div className="text-gray-400 text-xs mb-2 line-clamp-1">
                        {/* 내용 미리보기 (지역 정보가 있다면 여기에 표시) */}
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="font-extrabold text-lg sm:text-xl text-gray-900">
                      {item.price
                        ? `${item.price.toLocaleString()}원`
                        : '가격제안'}
                    </span>
                  </div>
                </>
              ) : (
                /* === 커뮤니티 카드 디자인 === */
                <>
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        Q&A
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-base truncate mb-1 group-hover:text-blue-600 transition">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-1">
                      {item.content}
                    </p>
                  </div>
                  {item.image_url && (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                      <img
                        src={item.image_url}
                        className="w-full h-full object-cover"
                        alt="썸네일"
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

// --------------------------------------------------------
// 📋 하위 컴포넌트: 정비소 리스트 (더미 데이터)
// --------------------------------------------------------
function ShopListView() {
  const SHOPS = [
    {
      id: 1,
      name: '성수 혼다 강남점',
      loc: '서울 성동구',
      phone: '02-123-4567',
      tag: '공식',
    },
    {
      id: 2,
      name: '모토이음 정비센터',
      loc: '서울 마포구',
      phone: '010-0000-0000',
      tag: '제휴',
    },
    {
      id: 3,
      name: '야마하 관악점',
      loc: '서울 관악구',
      phone: '02-987-6543',
      tag: '공식',
    },
    {
      id: 4,
      name: '베스파 용산점',
      loc: '서울 용산구',
      phone: '02-555-5555',
      tag: '전문',
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold text-gray-800 px-2">
        📍 내 주변 추천 정비소
      </h2>
      {SHOPS.map((shop) => (
        <div
          key={shop.id}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center hover:shadow-md transition"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${
                  shop.tag === '공식' ? 'bg-red-500' : 'bg-blue-500'
                }`}
              >
                {shop.tag}
              </span>
              <h3 className="font-bold text-gray-900">{shop.name}</h3>
            </div>
            <p className="text-gray-500 text-sm">📍 {shop.loc}</p>
          </div>
          <button
            onClick={() => window.open(`tel:${shop.phone}`)}
            className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-green-100 transition"
          >
            📞
          </button>
        </div>
      ))}
    </div>
  );
}

// --------------------------------------------------------
// 🔧 유틸 컴포넌트들
// --------------------------------------------------------
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
