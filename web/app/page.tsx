'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import KakaoMap from '../components/KakaoMap';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
];

type CCFilter = 'ALL' | 'OVER125' | 'UNDER125';
// 🔥 출처 필터 타입 추가
type SourceFilter = 'ALL' | 'MOTOIEUM' | 'BATUMAE' | 'JUNGGEOMDAN';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'market' | 'community' | 'map'>(
    'market'
  );

  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);

  const [selectedBrand, setSelectedBrand] = useState('전체');
  const [ccFilter, setCcFilter] = useState<CCFilter>('ALL');
  // 🔥 출처 필터 상태 추가
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('ALL');

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setUser(session?.user || null));
  }, []);

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
          setFilteredItems(data);
        }
        setLoading(false);
      };
      fetchMarket();
    }
  }, [activeTab]);

  // 통합 필터링 로직
  useEffect(() => {
    if (activeTab !== 'market') return;
    let result = marketItems;

    // 1. 출처 필터 (NEW)
    if (sourceFilter === 'BATUMAE') {
      result = result.filter((item) => item.source === 'batumae');
    } else if (sourceFilter === 'JUNGGEOMDAN') {
      result = result.filter((item) => item.source === 'junggeomdan');
    } else if (sourceFilter === 'MOTOIEUM') {
      // 모토이음은 외부 소스가 아닌 것들
      result = result.filter(
        (item) => item.source !== 'batumae' && item.source !== 'junggeomdan'
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
      const brandKey =
        selectedBrand === '할리' ? '할리데이비슨' : selectedBrand;
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(brandKey.toLowerCase()) ||
          item.content?.toLowerCase().includes(brandKey.toLowerCase())
      );
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

            {/* 🔥 출처 & 배기량 필터 영역 (위아래로 배치) */}
            <div className="flex flex-col gap-3 mb-4">
              {/* 1. 출처 필터 (NEW) */}
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
                  active={sourceFilter === 'JUNGGEOMDAN'}
                  onClick={() => setSourceFilter('JUNGGEOMDAN')}
                />
              </div>

              {/* 2. 배기량 필터 */}
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
                    onClick={() => window.open(item.external_link)}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition cursor-pointer overflow-hidden flex flex-col group"
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
                      <div className="absolute top-2 left-2 flex gap-1">
                        <span className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-bold">
                          {item.source === 'junggeomdan' ? '중검단' : '바튜매'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 flex flex-col flex-1">
                      <h4 className="font-bold text-gray-900 text-sm md:text-base line-clamp-2 mb-2 h-10 md:h-12 leading-snug">
                        {item.title.replace('[바튜매]', '').trim()}
                      </h4>
                      <div className="flex flex-wrap gap-2 text-sm font-bold text-gray-600 mb-3">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                          {item.year || '연식미상'}
                        </span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                          {item.mileage || '0km'}
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
