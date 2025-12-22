'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Heart } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Window 객체에 kakao 타입 추가
declare global {
  interface Window {
    kakao: any;
  }
}

const formatPrice = (price: string | null | undefined) => {
  if (!price || price === '가격 문의') return '가격 문의';
  const numStr = price.toString().replace(/[^0-9]/g, '');
  if (!numStr) return price;
  const num = parseInt(numStr, 10);
  return num >= 10000
    ? `${Math.floor(num / 10000).toLocaleString()}만원`
    : `${num.toLocaleString()}원`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const BRANDS = [
  '전체',
  '혼다',
  '야마하',
  '가와사키',
  '스즈키',
  'BMW',
  '할리',
  '베스파',
  '기타',
];

type CCFilter = 'ALL' | 'OVER125' | 'UNDER125';
// ✅ [수정] JUNGGEOMDAN -> JOONGUM 으로 변경 (DB 데이터와 통일)
type SourceFilter = 'ALL' | 'MOTOIEUM' | 'BATUMAE' | 'JOONGUM';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'market' | 'community' | 'map'>(
    'market'
  );

  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);

  const [selectedBrand, setSelectedBrand] = useState('전체');
  const [ccFilter, setCcFilter] = useState<CCFilter>('ALL');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('ALL');

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setUser(session?.user || null));
  }, []);

  // 데이터 불러오기
  useEffect(() => {
    if (activeTab === 'market') {
      const fetchMarket = async () => {
        setLoading(true);
        const { data } = await supabase
          .from('market')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) {
          setMarketItems(data);
          // 초기 로딩 시 필터링 로직을 한 번 태우기 위해 여기서는 setFilteredItems를 직접 호출하지 않거나
          // 아래 useEffect가 의존성에 의해 실행되도록 둠.
        }
        setLoading(false);
      };
      fetchMarket();
    }
  }, [activeTab]);

  // 🔥 [핵심 수정] 통합 필터링 로직
  useEffect(() => {
    if (activeTab !== 'market') return;
    let result = marketItems;

    // 1. 출처 필터 (DB값 'joongum'과 정확히 매칭)
    if (sourceFilter === 'BATUMAE') {
      result = result.filter((item) => item.source === 'batumae');
    } else if (sourceFilter === 'JOONGUM') {
      // ✅ 여기서 'junggeomdan'이 아니라 'joongum'을 찾아야 함!
      result = result.filter((item) => item.source === 'joongum');
    } else if (sourceFilter === 'MOTOIEUM') {
      // 바튜매도 아니고 중검단도 아닌 것들
      result = result.filter(
        (item) => item.source !== 'batumae' && item.source !== 'joongum'
      );
    }

    // 2. 배기량 필터
    if (ccFilter === 'OVER125') {
      result = result.filter(
        (item) =>
          item.content?.includes('over125') || item.title.includes('125cc초과')
      );
    } else if (ccFilter === 'UNDER125') {
      result = result.filter(
        (item) =>
          item.content?.includes('under125') || item.title.includes('125cc미만')
      );
    }

    // 3. 브랜드 필터
    if (selectedBrand !== '전체') {
      if (selectedBrand === '기타') {
        const majorBrands = [
          '혼다',
          '야마하',
          '가와사키',
          '스즈키',
          'BMW',
          '할리',
          '할리데이비슨',
          '베스파',
        ];
        result = result.filter((item) => {
          const text = (item.title + item.content).toLowerCase();
          return !majorBrands.some((brand) =>
            text.includes(brand.toLowerCase())
          );
        });
      } else {
        const brandKey =
          selectedBrand === '할리' ? '할리데이비슨' : selectedBrand;
        result = result.filter(
          (item) =>
            item.title.toLowerCase().includes(brandKey.toLowerCase()) ||
            item.content?.toLowerCase().includes(brandKey.toLowerCase())
        );
      }
    }
    setFilteredItems(result);
  }, [selectedBrand, ccFilter, sourceFilter, marketItems, activeTab]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 md:h-16 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1
              className="text-xl md:text-2xl font-black italic text-blue-600 cursor-pointer"
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
                className="bg-gray-100 px-3 py-1.5 rounded-full text-xs font-bold"
              >
                MY
              </button>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 pb-24">
        {activeTab === 'market' && (
          <>
            <div className="bg-gray-900 rounded-2xl p-6 md:p-8 mb-6 text-white relative overflow-hidden shadow-lg">
              <div className="relative z-10">
                <h2 className="text-xl md:text-3xl font-bold mb-2">
                  원하는 바이크를 찾아보세요
                </h2>
                <div className="bg-white rounded-lg p-1 flex max-w-md shadow-lg mt-4">
                  <input
                    className="flex-1 px-3 text-gray-900 text-sm outline-none"
                    placeholder="모델명 검색 (예: 슈퍼커브)"
                  />
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold">
                    검색
                  </button>
                </div>
              </div>
            </div>

            {/* 필터 영역 */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit">
                <FilterTab
                  label="전체"
                  active={sourceFilter === 'ALL'}
                  onClick={() => setSourceFilter('ALL')}
                />
                <FilterTab
                  label="모토이음"
                  active={sourceFilter === 'MOTOIEUM'}
                  onClick={() => setSourceFilter('MOTOIEUM')}
                />
                <FilterTab
                  label="바튜매"
                  active={sourceFilter === 'BATUMAE'}
                  onClick={() => setSourceFilter('BATUMAE')}
                />
                <FilterTab
                  label="중검단"
                  active={sourceFilter === 'JOONGUM'}
                  onClick={() => setSourceFilter('JOONGUM')}
                />
              </div>

              <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit">
                <FilterTab
                  label="전체 배기량"
                  active={ccFilter === 'ALL'}
                  onClick={() => setCcFilter('ALL')}
                />
                <FilterTab
                  label="125cc 초과"
                  active={ccFilter === 'OVER125'}
                  onClick={() => setCcFilter('OVER125')}
                />
                <FilterTab
                  label="125cc 이하"
                  active={ccFilter === 'UNDER125'}
                  onClick={() => setCcFilter('UNDER125')}
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {BRANDS.map((brand) => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition ${
                    selectedBrand === brand
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>

            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              🔥 추천 매물{' '}
              <span className="text-blue-600 text-sm">
                {filteredItems.length}개
              </span>
            </h3>

            {loading ? (
              <div className="text-center py-20">로딩 중...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      // 중검단이나 바튜매 데이터는 새 창으로, 그 외는 내부 이동
                      if (
                        item.source === 'joongum' ||
                        item.source === 'batumae'
                      ) {
                        window.open(item.external_link, '_blank');
                      } else {
                        // 상세 페이지가 있다면 이동 (현재는 외부링크 우선)
                        if (item.external_link)
                          window.open(item.external_link, '_blank');
                      }
                    }}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition cursor-pointer overflow-hidden flex flex-col group relative"
                  >
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {item.image_url &&
                      item.image_url !==
                        'https://cafe.naver.com/favicon.ico' ? (
                        <img
                          src={item.image_url}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
                          🏍️
                        </div>
                      )}

                      {/* 🔥 [수정됨] 출처 뱃지 디자인 및 로직 */}
                      <div className="absolute top-2 left-2 flex gap-1 z-10">
                        {item.source === 'joongum' ? (
                          <span className="bg-yellow-100 text-black px-2 py-1 rounded text-xs font-bold shadow-md">
                            ✅ 중검단
                          </span>
                        ) : item.source === 'batumae' ? (
                          <span className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-bold">
                            🏍️ 바튜매
                          </span>
                        ) : (
                          <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold shadow-md">
                            ⚡ MOTOIEUM
                          </span>
                        )}
                      </div>

                      <button
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-red-500 transition shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('찜하기 기능은 준비 중입니다!');
                        }}
                      >
                        <Heart className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>

                    <div className="p-3 flex flex-col flex-1">
                      <h4 className="font-bold text-gray-900 text-sm md:text-base line-clamp-2 mb-2 h-10 md:h-12 leading-snug">
                        {/* 바튜매 제목에서 불필요한 태그 제거 */}
                        {item.title
                          .replace('[바튜매]', '')
                          .replace('[중검단]', '')
                          .trim()}
                      </h4>

                      <div className="flex flex-wrap gap-2 text-xs md:text-sm font-bold text-gray-500 mb-3">
                        <span className="bg-gray-50 px-2 py-1 rounded border border-gray-100">
                          {item.year
                            ? item.year.includes('년')
                              ? item.year
                              : `${item.year}년식`
                            : '연식미상'}
                        </span>
                        <span className="bg-gray-50 px-2 py-1 rounded border border-gray-100">
                          {item.mileage
                            ? item.mileage.includes('km')
                              ? item.mileage
                              : `${item.mileage}km`
                            : '0km'}
                        </span>
                      </div>

                      <div className="mt-auto flex justify-between items-end">
                        <span className="text-lg md:text-xl font-extrabold text-blue-600">
                          {formatPrice(item.price)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'map' && <KakaoMap user={user} />}
        {activeTab === 'community' && (
          <div className="text-center py-20 text-gray-400">
            커뮤니티 준비 중...
          </div>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50 pb-safe">
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
          // displayMarkers(data); // 마커가 너무 많으면 지도 보기 힘들 수 있으니 주석 처리 가능
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          alert('검색 결과가 없습니다.');
          setSearchResults([]);
        }
      });
    });
  };

  const moveToPlace = (place: any) => {
    if (!mapRef.current) return;
    const moveLatLon = new window.kakao.maps.LatLng(place.y, place.x);
    mapRef.current.panTo(moveLatLon);
    setSelectedPlace(place);

    // 마커 추가
    new window.kakao.maps.Marker({
      map: mapRef.current,
      position: moveLatLon,
    });

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
      className={`flex flex-col items-center w-full ${
        active ? 'text-blue-600' : 'text-gray-400'
      }`}
    >
      <span className="text-xl mb-0.5">{icon}</span>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}
function FilterTab({ label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
        active
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-500 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}
