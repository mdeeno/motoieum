'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  Heart,
  MapPin,
  MessageSquare,
  Tag,
  Search,
  PlusCircle,
  Navigation,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- 타입 정의 ---
interface MarketItem {
  id: number;
  title: string;
  content: string;
  price: string;
  image_url: string;
  external_link: string;
  source: string;
  year: string;
  mileage: string;
  created_at: string;
}

interface KakaoPlace {
  place_name: string;
  road_address_name: string;
  address_name: string;
  phone: string;
  place_url: string;
  x: string;
  y: string;
}

declare global {
  interface Window {
    kakao: any;
  }
}

const ITEMS_PER_PAGE = 12;
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

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'market' | 'community' | 'map'>(
    'market'
  );
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState('전체');
  const [ccFilter, setCcFilter] = useState<'ALL' | 'OVER125' | 'UNDER125'>(
    'ALL'
  );
  const [sourceFilter, setSourceFilter] = useState<
    'ALL' | 'MOTOIEUM' | 'BATUMAE' | 'JOONGUM'
  >('ALL');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setUser(session?.user || null));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (activeTab === 'market') {
        const { data } = await supabase
          .from('market')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) setMarketItems(data as MarketItem[]);
      } else if (activeTab === 'community') {
        const { data } = await supabase
          .from('posts')
          .select('*, profiles(username)')
          .order('created_at', { ascending: false });
        if (data) setCommunityPosts(data);
      }
      setLoading(false);
    };
    fetchData();
  }, [activeTab]);

  const handleFilterChange = useCallback((type: string, value: string) => {
    if (type === 'brand') setSelectedBrand(value);
    if (type === 'cc') setCcFilter(value as any);
    if (type === 'source') setSourceFilter(value as any);
    setPage(1);
  }, []);

  const filteredItems = useMemo(() => {
    let result = [...marketItems];
    if (sourceFilter !== 'ALL') {
      result = result.filter((item) => {
        if (sourceFilter === 'BATUMAE') return item.source === 'batumae';
        if (sourceFilter === 'JOONGUM') return item.source === 'joongum';
        return item.source !== 'batumae' && item.source !== 'joongum';
      });
    }
    if (ccFilter !== 'ALL') {
      result = result.filter((item) => {
        const safeTitle = item.title || '';
        const safeContent = item.content || '';
        if (item.source !== 'joongum') {
          return ccFilter === 'OVER125'
            ? safeContent.includes('over125') || safeTitle.includes('125cc초과')
            : safeContent.includes('under125') ||
                safeTitle.includes('125cc미만');
        }
        const compressed = safeContent
          .replace(/<[^>]*>/g, '')
          .replace(/,/g, '')
          .replace(/\s+/g, '');
        const match = compressed.match(/배기량.*?(\d+)cc/i);
        if (match) {
          const cc = parseInt(match[1], 10);
          return ccFilter === 'OVER125' ? cc > 125 : cc <= 125;
        }
        return false;
      });
    }
    if (selectedBrand !== '전체') {
      const brandKey =
        selectedBrand === '할리' ? '할리데이비슨' : selectedBrand;
      result = result.filter((item) =>
        (item.title + (item.content || ''))
          .toLowerCase()
          .includes(brandKey.toLowerCase())
      );
    }
    return result;
  }, [marketItems, sourceFilter, ccFilter, selectedBrand]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, page * ITEMS_PER_PAGE),
    [filteredItems, page]
  );

  useEffect(() => {
    const node = observerTarget.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          visibleItems.length < filteredItems.length
        ) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visibleItems.length, filteredItems.length]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm px-4 h-16 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h1
            className="text-2xl font-black italic text-blue-600 cursor-pointer"
            onClick={() => setActiveTab('market')}
          >
            MOTOIEUM
          </h1>
          <nav className="hidden md:flex gap-1">
            <NavButton
              label="중고장터"
              icon={<Tag size={16} />}
              active={activeTab === 'market'}
              onClick={() => setActiveTab('market')}
            />
            <NavButton
              label="커뮤니티"
              icon={<MessageSquare size={16} />}
              active={activeTab === 'community'}
              onClick={() => setActiveTab('community')}
            />
            <NavButton
              label="정비지도"
              icon={<MapPin size={16} />}
              active={activeTab === 'map'}
              onClick={() => setActiveTab('map')}
            />
          </nav>
        </div>
        <button
          onClick={() => router.push(user ? '/mypage' : '/login')}
          className="bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-bold shadow-md hover:bg-blue-700 transition"
        >
          {user ? 'MY' : '로그인'}
        </button>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 pb-24">
        {activeTab === 'market' && (
          <>
            <div className="bg-gray-900 rounded-2xl p-8 mb-6 text-white relative overflow-hidden shadow-lg">
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2 italic">
                  Ride Your Dream
                </h2>
                <p className="text-gray-400">
                  전국의 바이크 매물을 한눈에 확인하세요
                </p>
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] text-gray-800 opacity-20 transform -rotate-12 select-none pointer-events-none">
                <h1 className="text-9xl font-black">BIKE</h1>
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              {/* ✅ 글쓰기 버튼 정렬 복구 */}
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex flex-wrap gap-2 items-center bg-white p-2 rounded-xl shadow-sm border w-fit">
                  {['ALL', 'MOTOIEUM', 'BATUMAE', 'JOONGUM'].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleFilterChange('source', s)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        sourceFilter === s
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-500'
                      }`}
                    >
                      {s === 'ALL'
                        ? '전체'
                        : s === 'JOONGUM'
                        ? '중검단'
                        : s === 'BATUMAE'
                        ? '바튜매'
                        : '모토이음'}
                    </button>
                  ))}
                </div>
                {/* 사라졌던 글쓰기 버튼 복구 */}
                <button
                  onClick={() => router.push('/market/write')}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition"
                >
                  <PlusCircle size={20} /> 매물 등록
                </button>
              </div>

              <div className="flex flex-wrap gap-2 items-center bg-white p-2 rounded-xl shadow-sm border w-fit">
                {['ALL', 'OVER125', 'UNDER125'].map((c) => (
                  <button
                    key={c}
                    onClick={() => handleFilterChange('cc', c)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      ccFilter === c
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-500'
                    }`}
                  >
                    {c === 'ALL'
                      ? '전체 배기량'
                      : c === 'OVER125'
                      ? '125cc 초과'
                      : '125cc 이하'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                {BRANDS.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => handleFilterChange('brand', brand)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                      selectedBrand === brand
                        ? 'bg-black text-white'
                        : 'bg-white text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20 text-gray-400 font-bold animate-pulse">
                매물을 불러오는 중...
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {visibleItems.map((item) => {
                  // ✅ 금액: 원 단위를 만원 단위로 가공
                  const rawPrice = Number(item.price.replace(/[^\d]/g, ''));
                  const displayPrice =
                    isNaN(rawPrice) || rawPrice === 0
                      ? item.price
                      : `${Math.floor(rawPrice / 10000)}만원`;

                  // ✅ 주행거리: 숫자만 추출 후 콤마 + km 추가
                  const displayMileage = item.mileage
                    ? `${Number(
                        item.mileage.replace(/[^\d]/g, '')
                      ).toLocaleString()}km`
                    : '0km';

                  return (
                    <div
                      key={item.id}
                      onClick={() => window.open(item.external_link, '_blank')}
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col group"
                    >
                      <div className="aspect-square bg-gray-100 relative">
                        <img
                          src={
                            item.image_url.includes('favicon')
                              ? 'https://cafe.naver.com/favicon.ico'
                              : `https://wsrv.nl/?url=${encodeURIComponent(
                                  item.image_url
                                )}`
                          }
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          alt={item.title}
                        />
                        <div className="absolute top-3 left-3">
                          <span
                            className={`px-2 py-1 rounded-md text-[10px] font-bold text-white shadow-md ${
                              item.source === 'joongum'
                                ? 'bg-yellow-500'
                                : 'bg-blue-600'
                            }`}
                          >
                            {item.source === 'joongum'
                              ? '✅ 중검단'
                              : item.source === 'batumae'
                              ? '🏍️ 바튜매'
                              : '⚡ 모토이음'}
                          </span>
                        </div>
                        <button
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/70 hover:bg-white text-gray-400 hover:text-red-500 transition shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Heart size={16} />
                        </button>
                      </div>

                      <div className="p-4 flex flex-col flex-1">
                        <h4 className="font-bold text-gray-900 text-sm line-clamp-2 h-10 leading-snug mb-1">
                          {item.title}
                        </h4>

                        <div className="flex gap-2 text-[10px] text-gray-400 mb-3">
                          <span>
                            {item.year ? `${item.year}년식` : '연식미상'}
                          </span>
                          <span>•</span>
                          <span>{displayMileage}</span>
                        </div>

                        <div className="mt-auto flex justify-between items-end">
                          <div className="flex flex-col">
                            <span className="text-blue-600 font-black text-lg">
                              {displayPrice}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {item.created_at.split('T')[0]}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={observerTarget} className="h-10" />
          </>
        )}

        {activeTab === 'community' && (
          <div className="max-w-3xl mx-auto w-full animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black italic">COMMUNITY</h2>
              <button
                onClick={() => router.push('/community/write')}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg"
              >
                <PlusCircle size={20} /> 글쓰기
              </button>
            </div>
            <div className="space-y-4">
              {communityPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => router.push(`/community/${post.id}`)}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer"
                >
                  <h3 className="font-bold text-lg mb-2">{post.title}</h3>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span className="font-bold text-gray-900">
                      {post.profiles?.username || '익명라이더'}
                    </span>
                    <span>{post.created_at.split('T')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'map' && <KakaoMap user={user} />}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-20 z-50">
        <MobileNavIcon
          icon={<Tag size={24} />}
          label="장터"
          active={activeTab === 'market'}
          onClick={() => setActiveTab('market')}
        />
        <MobileNavIcon
          icon={<MessageSquare size={24} />}
          label="톡"
          active={activeTab === 'community'}
          onClick={() => setActiveTab('community')}
        />
        <MobileNavIcon
          icon={<MapPin size={24} />}
          label="지도"
          active={activeTab === 'map'}
          onClick={() => setActiveTab('map')}
        />
      </nav>
    </div>
  );
}

// --- 🗺️ 지도 컴포넌트 (로딩 로직 최적화) ---
function KakaoMap({ user }: { user: any }) {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<KakaoPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<KakaoPlace | null>(null);

  useEffect(() => {
    const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    const existingScript = document.getElementById('kakao-map-sdk');

    // 스크립트가 없으면 생성
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'kakao-map-sdk';
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services&autoload=false`;
      document.head.appendChild(script);
    }

    const initMap = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          const container = document.getElementById('map');
          if (container && !mapRef.current) {
            const options = {
              center: new window.kakao.maps.LatLng(37.5665, 126.978),
              level: 3,
            };
            mapRef.current = new window.kakao.maps.Map(container, options);
          }
        });
      }
    };

    // 객체 확인 인터벌
    const checkTimer = setInterval(() => {
      if (window.kakao && window.kakao.maps) {
        initMap();
        clearInterval(checkTimer);
      }
    }, 200);

    return () => clearInterval(checkTimer);
  }, []);

  const searchPlaces = (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.kakao || !window.kakao.maps || !keyword.trim()) return;
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(keyword, (data: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setSearchResults(data);
        const bounds = new window.kakao.maps.LatLngBounds();
        data.forEach((p: any) =>
          bounds.extend(new window.kakao.maps.LatLng(p.y, p.x))
        );
        mapRef.current.setBounds(bounds);
      }
    });
  };

  const handlePlaceClick = (place: KakaoPlace) => {
    setSelectedPlace(place);
    const coords = new window.kakao.maps.LatLng(place.y, place.x);
    mapRef.current.panTo(coords);
    new window.kakao.maps.Marker({ map: mapRef.current, position: coords });
  };

  return (
    <div className="relative w-full h-[75vh] md:h-[70vh] rounded-3xl overflow-hidden border shadow-2xl bg-white">
      <div
        id="map"
        className="w-full h-full"
        style={{ minHeight: '500px', backgroundColor: '#f8fafc' }}
      />

      <div className="absolute top-6 left-6 right-6 z-10 flex flex-col gap-2 max-w-md">
        <form
          onSubmit={searchPlaces}
          className="flex gap-2 bg-white/95 backdrop-blur p-2 rounded-2xl shadow-2xl border border-blue-50"
        >
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 px-4 outline-none text-sm font-bold bg-transparent"
            placeholder="정비소, 바이크 세차장 검색..."
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-3 rounded-xl hover:scale-105 transition shadow-lg"
          >
            <Search size={20} />
          </button>
        </form>

        {searchResults.length > 0 && !selectedPlace && (
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl max-h-72 overflow-y-auto border border-gray-100 p-2 scrollbar-hide">
            {searchResults.map((place, idx) => (
              <div
                key={idx}
                onClick={() => handlePlaceClick(place)}
                className="p-4 hover:bg-blue-50 cursor-pointer border-b last:border-0 rounded-xl transition-colors"
              >
                <div className="font-bold text-sm text-gray-800">
                  {place.place_name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {place.road_address_name || place.address_name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPlace && (
        <div className="absolute bottom-6 left-6 right-6 z-20 bg-white rounded-3xl shadow-2xl p-6 border-t-4 border-blue-600 animate-slide-up">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {selectedPlace.place_name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedPlace.road_address_name || selectedPlace.address_name}
              </p>
              <p className="text-sm text-blue-600 font-bold mt-1">
                📞 {selectedPlace.phone || '번호 정보 없음'}
              </p>
            </div>
            <button
              onClick={() => setSelectedPlace(null)}
              className="text-gray-400 hover:text-gray-900 text-3xl transition-transform hover:rotate-90"
            >
              &times;
            </button>
          </div>
          <div className="flex gap-3">
            <a
              href={`https://map.kakao.com/link/to/${selectedPlace.place_name},${selectedPlace.y},${selectedPlace.x}`}
              target="_blank"
              className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold text-center flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700"
            >
              <Navigation size={18} /> 길찾기
            </a>
            <button
              onClick={() => alert('즐겨찾기에 저장되었습니다!')}
              className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold hover:bg-gray-200 transition"
            >
              즐겨찾기
            </button>
          </div>
        </div>
      )}

      {!user && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[3px] z-30 flex items-center justify-center">
          <div className="bg-white px-8 py-6 rounded-3xl shadow-2xl border border-blue-50 text-center scale-110">
            <p className="font-black text-gray-800 text-lg mb-2">
              지도를 이용하려면
            </p>
            <p className="text-sm text-gray-500 mb-4">
              로그인이 필요한 서비스입니다
            </p>
            <button
              onClick={() => router.push('/login')}
              className="text-blue-600 text-sm font-black border-b-2 border-blue-600 pb-0.5"
            >
              로그인 하러가기 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NavButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: any;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
        active
          ? 'text-blue-600 bg-blue-50 shadow-sm'
          : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function MobileNavIcon({
  icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <div className={`${active ? 'text-blue-600' : 'text-gray-400'}`}>
        {icon}
      </div>
      <span
        className={`text-[10px] font-bold ${
          active ? 'text-blue-600' : 'text-gray-400'
        }`}
      >
        {label}
      </span>
    </button>
  );
}
