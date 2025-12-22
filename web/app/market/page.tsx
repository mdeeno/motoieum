'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 생성
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
  if (!price || price.trim() === '') return '가격 문의';
  // 숫자만 추출해서 처리
  const cleanPrice = price.replace(/[^0-9]/g, '');
  if (cleanPrice) {
    const num = parseInt(cleanPrice, 10);
    return num >= 10000
      ? `${Math.floor(num / 10000).toLocaleString()}만원`
      : `${num.toLocaleString()}원`;
  }
  return price;
};

// 🛠️ 헬퍼 함수: 날짜 포맷팅
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${
    date.getMinutes() < 10 ? '0' : ''
  }${date.getMinutes()}`;
};

export default function MarketPage() {
  const router = useRouter();

  // 1. 메인 탭 (중고장터 / 커뮤니티 / 정비지도)
  const [activeTab, setActiveTab] = useState<'market' | 'community' | 'map'>(
    'market'
  );

  // 2. 소스 필터 상태 (전체 / 모토이음 / 바튜매 / 중검단)
  const [sourceFilter, setSourceFilter] = useState<
    'all' | 'motoieum' | 'batumae' | 'joongum'
  >('all');

  // 데이터 상태
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [communityItems, setCommunityItems] = useState<any[]>([]);
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

        console.log('불러온 데이터 확인:', data); // F12 개발자 도구 콘솔에서 확인 가능
        setMarketItems(data || []);
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

  // 🔥 [핵심] 필터링 로직: 중검단(joongum)을 확실하게 분리
  const filteredMarketItems = marketItems.filter((item) => {
    const source = item.source ? item.source.toLowerCase() : '';

    if (sourceFilter === 'all') return true;

    // 중검단 탭: source가 'joongum'인 것만
    if (sourceFilter === 'joongum') return source === 'joongum';

    // 바튜매 탭: source가 'batumae'인 것만
    if (sourceFilter === 'batumae') return source === 'batumae';

    // 모토이음 탭: source가 'joongum'도 아니고 'batumae'도 아닌 것들 (직접 업로드 등)
    if (sourceFilter === 'motoieum') {
      return source !== 'joongum' && source !== 'batumae';
    }

    return true;
  });

  const handleItemClick = (item: any) => {
    // 크롤링 데이터는 새 창으로 열기
    if (
      (item.source === 'joongum' || item.source === 'batumae') &&
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
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-10">
            <h1
              className="text-2xl font-black italic text-blue-600 cursor-pointer"
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
                onClick={() => router.push('/mypage')}
                className="hidden md:block px-5 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-bold hover:bg-gray-200 transition"
              >
                마이페이지
              </button>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="hidden md:block px-5 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-gray-800 transition"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 pb-28 md:pb-8">
        {/* 1. 중고장터 탭 */}
        {activeTab === 'market' && (
          <div className="space-y-6">
            <div className="flex justify-between items-end px-2">
              <h2 className="text-xl font-extrabold text-gray-900">
                🔥 실시간 인기 매물
              </h2>
            </div>

            {/* 필터 버튼들 */}
            <div className="flex gap-2 overflow-x-auto pb-2 px-1 hide-scrollbar">
              <FilterPill
                label="전체"
                isActive={sourceFilter === 'all'}
                onClick={() => setSourceFilter('all')}
              />
              <FilterPill
                label="모토이음"
                isActive={sourceFilter === 'motoieum'}
                onClick={() => setSourceFilter('motoieum')}
                activeColor="bg-blue-600 text-white"
              />
              <FilterPill
                label="바튜매"
                isActive={sourceFilter === 'batumae'}
                onClick={() => setSourceFilter('batumae')}
                activeColor="bg-gray-800 text-white"
              />
              <FilterPill
                label="중검단"
                isActive={sourceFilter === 'joongum'}
                onClick={() => setSourceFilter('joongum')}
                activeColor="bg-yellow-400 text-black"
              />
            </div>

            {loading ? (
              <div className="text-center py-20 text-gray-500">로딩 중...</div>
            ) : filteredMarketItems.length === 0 ? (
              <div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-300 rounded-xl bg-white">
                조건에 맞는 매물이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMarketItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition p-4 cursor-pointer overflow-hidden relative"
                  >
                    <div className="h-48 bg-gray-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden text-gray-400 relative border border-gray-100">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          alt={item.title}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-3xl">🏍️</span>
                          <span className="text-sm font-medium">
                            이미지 없음
                          </span>
                        </div>
                      )}

                      {/* 🔥 배지 표시 로직 (가장 중요한 부분) */}
                      <div className="absolute top-3 left-3 flex gap-1">
                        {item.source === 'joongum' ? (
                          <span className="bg-yellow-400 text-black px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm">
                            ✅ 중검단
                          </span>
                        ) : item.source === 'batumae' ? (
                          <span className="bg-gray-800 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm">
                            🏍️ 바튜매
                          </span>
                        ) : (
                          <span className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm">
                            ⚡ MOTOIEUM
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-gray-900 text-lg mb-2 truncate">
                      {item.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-3 font-medium">
                      {item.year && (
                        <span className="bg-gray-100 border border-gray-200 px-2 py-1 rounded-md">
                          {/^\d+$/.test(item.year)
                            ? `${item.year} 년식`
                            : item.year}
                        </span>
                      )}
                      {item.mileage && (
                        <span className="bg-gray-100 border border-gray-200 px-2 py-1 rounded-md">{`${parseInt(
                          item.mileage.replace(/[^0-9]/g, '') || '0'
                        ).toLocaleString()} km`}</span>
                      )}
                      {!item.year && !item.mileage && (
                        <span>{item.location}</span>
                      )}
                    </div>
                    <div className="font-extrabold text-2xl text-blue-700">
                      {formatPrice(item.price)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. 커뮤니티 탭 */}
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

        {/* 3. 지도 탭 */}
        {activeTab === 'map' && <KakaoMap user={user} />}
      </main>

      {/* 글쓰기 버튼 */}
      {activeTab !== 'map' && (
        <button
          onClick={() => router.push('/write')}
          className="fixed bottom-24 right-5 md:bottom-12 md:right-12 bg-blue-600 text-white w-14 h-14 rounded-full shadow-2xl text-3xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition z-50 cursor-pointer"
        >
          +
        </button>
      )}

      {/* 모바일 탭바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-20 safe-area-pb z-40 rounded-t-2xl shadow-[0_-4px_15px_rgba(0,0,0,0.08)]">
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
          onClick={() => router.push(user ? '/mypage' : '/login')}
        />
      </nav>
    </div>
  );
}

// 필터 버튼 컴포넌트
function FilterPill({
  label,
  isActive,
  onClick,
  activeColor = 'bg-black text-white',
}: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${
        isActive
          ? `${activeColor} border-transparent shadow-md`
          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}

function HeaderTab({ label, isActive, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
        isActive
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
      className="flex flex-col items-center justify-center w-full h-full cursor-pointer group"
    >
      <span
        className={`text-2xl transition-all duration-300 ${
          isActive
            ? '-translate-y-1 text-blue-600'
            : 'text-gray-400 group-hover:text-gray-600'
        }`}
      >
        {icon}
      </span>
      <span
        className={`text-[11px] font-bold mt-1 transition-all ${
          isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

// 🗺️ 지도 컴포넌트
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
