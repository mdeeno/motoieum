'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

declare global {
  interface Window {
    kakao: any;
  }
}

// 🛠️ 헬퍼 함수: 가격 포맷팅
const formatPrice = (price: string | null | undefined) => {
  if (!price || price === '가격 문의' || price.trim() === '')
    return '가격 문의';
  const numStr = price.toString().replace(/[^0-9]/g, '');
  if (!numStr) return price;
  const num = parseInt(numStr, 10);
  return num >= 10000
    ? `${Math.floor(num / 10000).toLocaleString()}만원`
    : `${num.toLocaleString()}원`;
};

// 🛠️ 헬퍼 함수: 날짜 포맷팅
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${
    date.getMinutes() < 10 ? '0' : ''
  }${date.getMinutes()}`;
};

// 🛠️ 필터용 브랜드 목록
const BRANDS = [
  '전체',
  '혼다',
  '야마하',
  '가와사키',
  '스즈키',
  'BMW',
  '할리데이비슨',
  '베스파',
];

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'market' | 'community' | 'map'>(
    'market'
  );

  // 데이터 상태
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [communityItems, setCommunityItems] = useState<any[]>([]);

  // 🔍 필터 상태 (NEW)
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('전체');

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 로그인 체크
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();
  }, []);

  // 탭 변경에 따른 데이터 로딩
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (activeTab === 'market') {
        const { data } = await supabase
          .from('market')
          .select('*')
          .order('created_at', { ascending: false });
        setMarketItems(data || []);
        setFilteredItems(data || []); // 초기값 설정
      } else if (activeTab === 'community') {
        const { data } = await supabase
          .from('community')
          .select('*')
          .order('created_at', { ascending: false });
        setCommunityItems(data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [activeTab]);

  // 🔥 브랜드 필터링 로직 (라이트바겐 스타일)
  useEffect(() => {
    if (activeTab === 'market') {
      if (selectedBrand === '전체') {
        setFilteredItems(marketItems);
      } else {
        setFilteredItems(
          marketItems.filter(
            (item) =>
              item.title.includes(selectedBrand) ||
              (item.content && item.content.includes(selectedBrand))
          )
        );
      }
    }
  }, [selectedBrand, marketItems, activeTab]);

  const handleItemClick = (item: any) => {
    if (
      (item.source === 'junggeomdan' || item.source === 'batumae') &&
      item.external_link
    ) {
      window.open(item.external_link, '_blank');
    } else {
      const path =
        activeTab === 'market' ? `/market/${item.id}` : `/community/${item.id}`;
      router.push(path);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900">
      {/* 🔹 헤더 (디자인 개선) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1
              className="text-2xl font-black italic text-blue-600 cursor-pointer tracking-tighter"
              onClick={() => setActiveTab('market')}
            >
              MOTOIEUM
            </h1>
            <nav className="hidden md:flex gap-1">
              <NavButton
                label="중고장터"
                active={activeTab === 'market'}
                onClick={() => setActiveTab('market')}
              />
              <NavButton
                label="커뮤니티"
                active={activeTab === 'community'}
                onClick={() => setActiveTab('community')}
              />
              <NavButton
                label="정비지도"
                active={activeTab === 'map'}
                onClick={() => setActiveTab('map')}
              />
            </nav>
          </div>
          <div>
            {user ? (
              <button
                onClick={() => router.push('/mypage')}
                className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-200"
              >
                마이페이지
              </button>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-blue-700 shadow-md transition"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 pb-28 md:pb-12">
        {/* 1. 중고장터 탭 */}
        {activeTab === 'market' && (
          <>
            {/* 🔹 메인 배너 (검색창 포함) */}
            <div className="bg-gray-900 rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-xl">
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  원하는 바이크를 찾아보세요.
                </h2>
                <p className="text-gray-400 mb-6 text-sm md:text-base">
                  MOTOIEUM이 엄선한 중고 매물과 정비 정보를 한눈에.
                </p>
                <div className="bg-white rounded-xl p-1.5 flex max-w-lg shadow-lg">
                  <input
                    className="flex-1 px-4 text-gray-900 outline-none font-medium bg-transparent"
                    placeholder="모델명, 제조사 검색 (예: 슈퍼커브)"
                  />
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                    검색
                  </button>
                </div>
              </div>
              {/* 장식용 원 */}
              <div className="absolute -right-10 -top-10 w-64 h-64 bg-blue-600 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
            </div>

            {/* 🔹 브랜드 필터 (가로 스크롤) */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
              {BRANDS.map((brand) => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition border shadow-sm ${
                    selectedBrand === brand
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-900'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>

            {/* 🔹 매물 리스트 Grid */}
            <div className="flex items-center gap-2 mb-4 px-1">
              <span className="text-xl">🔥</span>
              <h3 className="text-xl font-bold text-gray-900">추천 매물</h3>
              <span className="text-blue-600 font-bold text-sm bg-blue-50 px-2 py-0.5 rounded-full">
                {filteredItems.length}
              </span>
            </div>

            {loading ? (
              <div className="text-center py-20 text-gray-400 animate-pulse">
                데이터를 불러오는 중입니다...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                조건에 맞는 매물이 없습니다. 😢
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
                  >
                    {/* 이미지 영역 */}
                    <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                          <span className="text-4xl mb-2">🏍️</span>
                          <span className="text-xs">No Image</span>
                        </div>
                      )}

                      {/* 뱃지 */}
                      <div className="absolute top-3 left-3 flex gap-1">
                        {item.source === 'junggeomdan' ? (
                          <span className="bg-green-600/90 backdrop-blur-sm text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">
                            ✅ 중검단
                          </span>
                        ) : item.source === 'batumae' ? (
                          <span className="bg-gray-900/90 backdrop-blur-sm text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">
                            🏍️ 바튜매
                          </span>
                        ) : (
                          <span className="bg-blue-600/90 backdrop-blur-sm text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">
                            ⚡ MOTOIEUM
                          </span>
                        )}
                      </div>

                      {/* 찜 버튼 (UI 장식) */}
                      <div className="absolute bottom-3 right-3 bg-white/90 p-1.5 rounded-full text-gray-300 shadow-sm">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </div>
                    </div>

                    {/* 텍스트 영역 */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-1">
                        {item.title}
                      </h3>

                      <div className="flex gap-2 text-xs text-gray-500 mb-4">
                        <span className="bg-gray-50 px-2 py-1 rounded border border-gray-100">
                          {item.year && /^\d+$/.test(item.year)
                            ? `${item.year}년식`
                            : item.year || '연식미상'}
                        </span>
                        <span className="bg-gray-50 px-2 py-1 rounded border border-gray-100">
                          {item.mileage
                            ? `${parseInt(
                                item.mileage.replace(/[^0-9]/g, '') || '0'
                              ).toLocaleString()}km`
                            : '키로수 미상'}
                        </span>
                      </div>

                      <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-xl font-extrabold text-blue-600 tracking-tight">
                          {formatPrice(item.price)}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {item.location}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 2. 커뮤니티 탭 (기존 기능 유지) */}
        {activeTab === 'community' && (
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-gray-900 px-2">
              🗣️ 라이더 커뮤니티
            </h2>
            {loading ? (
              <div className="text-center py-20 text-gray-500">로딩 중...</div>
            ) : communityItems.length === 0 ? (
              <div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-300 rounded-xl bg-white">
                등록된 글이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {communityItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer flex gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold">
                          {item.category || '자유'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {item.content}
                      </p>
                    </div>
                    {item.image_url && (
                      <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={item.image_url}
                          className="w-full h-full object-cover"
                          alt="썸네일"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. 지도 탭 (기존 기능 완벽 복구) */}
        {activeTab === 'map' && <KakaoMap user={user} />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center md:text-left grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-black italic text-gray-300 mb-2">
              MOTOIEUM
            </h2>
            <p className="text-sm text-gray-500">
              라이더를 위한 No.1 중고거래 & 정비 플랫폼
              <br />
              중고거래부터 정비지도까지, 라이더를 위한 모든 것.
            </p>
          </div>
          <div className="flex flex-col md:items-end text-sm text-gray-500 items-center">
            <p className="font-bold text-gray-900 mb-1">고객센터 / 제휴문의</p>
            <a
              href="mailto:motoieum@gmail.com"
              className="hover:text-blue-600 transition font-bold text-blue-500"
            >
              motoieum@gmail.com
            </a>
            <span className="mt-2 text-xs text-gray-400">
              © 2025 MOTOIEUM Corp. All rights reserved.
            </span>
          </div>
        </div>
      </footer>

      {/* 글쓰기 버튼 (PC 가림 현상 수정됨: md:bottom-28) */}
      {activeTab !== 'map' && (
        <button
          onClick={() => router.push('/write')}
          className="fixed bottom-24 right-5 md:bottom-28 md:right-12 bg-blue-600 text-white w-14 h-14 rounded-full shadow-2xl text-3xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition z-50 cursor-pointer"
        >
          +
        </button>
      )}

      {/* 모바일 탭바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-20 pb-2 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <NavIcon
          icon="🏷️"
          label="장터"
          active={activeTab === 'market'}
          onClick={() => setActiveTab('market')}
        />
        <NavIcon
          icon="💬"
          label="커뮤니티"
          active={activeTab === 'community'}
          onClick={() => setActiveTab('community')}
        />
        <NavIcon
          icon="🗺️"
          label="지도"
          active={activeTab === 'map'}
          onClick={() => setActiveTab('map')}
        />
        <NavIcon
          icon="👤"
          label="MY"
          active={false}
          onClick={() => router.push(user ? '/mypage' : '/login')}
        />
      </nav>
    </div>
  );
}

// ✨ 네비게이션 컴포넌트
function NavButton({ label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-bold transition ${
        active
          ? 'text-blue-600 bg-blue-50'
          : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      {label}
    </button>
  );
}

function NavIcon({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center w-full pt-2 ${
        active ? 'text-blue-600' : 'text-gray-400'
      }`}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

// 🗺️ 지도 컴포넌트 (원본 기능 유지)
function KakaoMap({ user }: { user: any }) {
  const mapRef = useRef<any>(null);
  const [keyword, setKeyword] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (window.kakao && window.kakao.maps) {
        clearInterval(intervalId);
        window.kakao.maps.load(() => {
          const container = document.getElementById('map');
          if (!container) return;
          const options = {
            center: new window.kakao.maps.LatLng(37.566826, 126.9786567),
            level: 3,
          };
          const map = new window.kakao.maps.Map(container, options);
          mapRef.current = map;

          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
              const locPosition = new window.kakao.maps.LatLng(
                position.coords.latitude,
                position.coords.longitude
              );
              map.setCenter(locPosition);
              new window.kakao.maps.Marker({
                map: map,
                position: locPosition,
                image: new window.kakao.maps.MarkerImage(
                  'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
                  new window.kakao.maps.Size(30, 30)
                ),
              });
            });
          }
        });
      }
    }, 100);
    return () => clearInterval(intervalId);
  }, []);

  const fetchBookmarks = async () => {
    if (!user) return alert('로그인이 필요합니다.');
    const { data } = await supabase
      .from('map_bookmarks')
      .select('*')
      .order('created_at', { ascending: false });
    setBookmarks(data || []);
    setShowBookmarks(true);
  };

  const searchPlaces = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return alert('검색어를 입력해주세요!');
    if (!window.kakao || !window.kakao.maps) return;

    window.kakao.maps.load(() => {
      const ps = new window.kakao.maps.services.Places();
      ps.keywordSearch(keyword, (data: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setSearchResults(data);
          displayMarkers(data);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          alert('검색 결과가 없습니다.');
          setSearchResults([]);
        }
      });
    });
  };

  const displayMarkers = (places: any[]) => {
    const map = mapRef.current;
    const bounds = new window.kakao.maps.LatLngBounds();
    places.forEach((place) => {
      const marker = new window.kakao.maps.Marker({
        map: map,
        position: new window.kakao.maps.LatLng(place.y, place.x),
      });
      window.kakao.maps.event.addListener(marker, 'click', () => {
        setSelectedPlace(place);
        map.panTo(new window.kakao.maps.LatLng(place.y, place.x));
      });
      bounds.extend(new window.kakao.maps.LatLng(place.y, place.x));
    });
    map.setBounds(bounds);
  };

  const moveToPlace = (place: any) => {
    if (!mapRef.current) return;
    const moveLatLon = new window.kakao.maps.LatLng(place.y, place.x);
    mapRef.current.panTo(moveLatLon);
    setSelectedPlace(place);
    setSearchResults([]);
    setShowBookmarks(false);
  };

  const handleBookmark = async (place: any) => {
    if (!user) return alert('로그인이 필요한 기능입니다.');
    if (confirm(`'${place.place_name}'을(를) 즐겨찾기에 추가하시겠습니까?`)) {
      await supabase.from('map_bookmarks').insert([
        {
          user_id: user.id,
          place_name: place.place_name,
          address: place.address_name,
          phone: place.phone,
          lat: parseFloat(place.y),
          lng: parseFloat(place.x),
          place_url: place.place_url,
        },
      ]);
      alert('저장되었습니다! ⭐');
    }
  };

  return (
    <div className="relative w-full h-[70vh] rounded-3xl overflow-hidden border border-gray-200 shadow-md">
      <div id="map" className="w-full h-full bg-gray-100"></div>

      <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
        <form
          onSubmit={searchPlaces}
          className="flex-1 bg-white rounded-xl shadow-lg flex overflow-hidden p-1"
        >
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="장소, 주소 검색"
            className="flex-1 px-4 py-2 outline-none text-gray-900"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 rounded-lg font-bold"
          >
            검색
          </button>
        </form>
        <button
          onClick={fetchBookmarks}
          className="bg-yellow-400 text-white w-12 rounded-xl shadow-lg font-bold text-xl flex items-center justify-center"
        >
          ⭐
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="absolute top-16 left-4 right-4 bg-white rounded-xl shadow-xl max-h-60 overflow-y-auto z-20 border border-gray-200">
          <div className="p-2 sticky top-0 bg-gray-50 border-b flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500">
              검색 결과 {searchResults.length}개
            </span>
            <button
              onClick={() => setSearchResults([])}
              className="text-gray-400 text-lg px-2"
            >
              ×
            </button>
          </div>
          {searchResults.map((place, idx) => (
            <div
              key={idx}
              onClick={() => moveToPlace(place)}
              className="p-3 border-b hover:bg-gray-50 cursor-pointer last:border-0"
            >
              <div className="font-bold text-gray-900 text-sm">
                {place.place_name}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {place.road_address_name || place.address_name}
              </div>
            </div>
          ))}
        </div>
      )}

      {showBookmarks && (
        <div className="absolute top-16 left-4 right-4 bg-white rounded-xl shadow-xl max-h-60 overflow-y-auto z-20 border border-gray-200 animate-fade-in">
          <div className="p-2 sticky top-0 bg-yellow-50 border-b flex justify-between items-center">
            <span className="text-xs font-bold text-yellow-700">
              ⭐ 내 즐겨찾기 목록
            </span>
            <button
              onClick={() => setShowBookmarks(false)}
              className="text-gray-400 text-lg px-2"
            >
              ×
            </button>
          </div>
          {bookmarks.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              저장된 장소가 없습니다.
            </div>
          ) : (
            bookmarks.map((bm) => (
              <div
                key={bm.id}
                onClick={() =>
                  moveToPlace({
                    y: bm.lat,
                    x: bm.lng,
                    place_name: bm.place_name,
                    road_address_name: bm.address,
                    phone: bm.phone,
                  })
                }
                className="p-3 border-b hover:bg-gray-50 cursor-pointer last:border-0"
              >
                <div className="font-bold text-gray-900 text-sm">
                  ⭐ {bm.place_name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {bm.address}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <button
        onClick={() => {
          if (navigator.geolocation && mapRef.current) {
            navigator.geolocation.getCurrentPosition((pos) => {
              mapRef.current.panTo(
                new window.kakao.maps.LatLng(
                  pos.coords.latitude,
                  pos.coords.longitude
                )
              );
            });
          }
        }}
        className="absolute bottom-6 right-4 z-10 bg-white p-3 rounded-full shadow-lg text-gray-700 hover:bg-gray-50 border border-gray-200"
      >
        🧭
      </button>

      {selectedPlace && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] p-6 z-20 animate-slide-up">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {selectedPlace.place_name}
              </h3>
              <p className="text-sm text-gray-500">
                {selectedPlace.road_address_name || selectedPlace.address_name}
              </p>
              {selectedPlace.phone && (
                <p className="text-sm text-blue-600 mt-1">
                  📞 {selectedPlace.phone}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedPlace(null)}
              className="text-gray-400 text-2xl"
            >
              ×
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <a
              href={`https://map.kakao.com/link/to/${selectedPlace.place_name},${selectedPlace.y},${selectedPlace.x}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-yellow-400 text-black py-3 rounded-xl font-bold text-center shadow-sm hover:bg-yellow-500 transition"
            >
              길찾기 (Navi)
            </a>
            <button
              onClick={() => handleBookmark(selectedPlace)}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition border border-gray-200"
            >
              ⭐ 즐겨찾기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
