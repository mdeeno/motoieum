'use client';

import { useState, useEffect } from 'react';
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

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'market' | 'community' | 'map'>(
    'market'
  );
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMarketItems = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('market')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setMarketItems(data || []);
      setLoading(false);
    };
    fetchMarketItems();
  }, []);

  const handleItemClick = (item: any) => {
    if (
      (item.source === 'junggeomdan' || item.source === 'batumae') &&
      item.external_link
    ) {
      window.open(item.external_link, '_blank');
    } else {
      router.push(`/market/${item.id}`);
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
            <button
              onClick={() => router.push('/login')}
              className="hidden md:block px-5 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-gray-800 transition"
            >
              로그인
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 pb-28 md:pb-8">
        {activeTab === 'market' && (
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-gray-800 px-2">
              🔥 실시간 인기 매물
            </h2>

            {loading ? (
              <div className="text-center py-20 text-gray-400">로딩 중...</div>
            ) : marketItems.length === 0 ? (
              <div className="text-center py-20 text-gray-400 border-2 border-dashed rounded-xl bg-gray-50">
                매물이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {marketItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition p-4 cursor-pointer overflow-hidden relative"
                  >
                    <div className="h-40 bg-gray-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden text-gray-400 relative">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-2xl">🏍️</span>
                          <span className="text-xs">이미지 없음</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {item.source === 'junggeomdan' ? (
                          <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                            ✅ 중검단
                          </span>
                        ) : item.source === 'batumae' ? (
                          <span className="bg-gray-800 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                            🏍️ 바튜매
                          </span>
                        ) : (
                          <span className="bg-blue-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                            ⚡ MOTOIEUM
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">
                      {item.title}
                    </h3>

                    {/* 🟢 연식 & 주행거리 표시 */}
                    <div className="flex gap-2 text-xs text-gray-500 mb-2 font-medium">
                      {item.year && (
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                          {item.year}
                        </span>
                      )}
                      {item.mileage && (
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                          {item.mileage}
                        </span>
                      )}
                      {!item.year && !item.mileage && (
                        <span>{item.location}</span>
                      )}
                    </div>

                    <div className="font-extrabold text-xl text-blue-600">
                      {item.price}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'community' && (
          <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
            커뮤니티 준비 중...
          </div>
        )}
        {activeTab === 'map' && <KakaoMap />}
      </main>

      {activeTab === 'market' && (
        <button
          onClick={() => router.push('/write')}
          className="fixed bottom-24 right-5 md:bottom-12 md:right-12 bg-blue-600 text-white w-14 h-14 rounded-full shadow-2xl text-3xl flex items-center justify-center hover:bg-blue-500 active:scale-90 transition z-50 cursor-pointer"
        >
          +
        </button>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-20 safe-area-pb z-40 rounded-t-2xl shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
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
    </div>
  );
}

function KakaoMap() {
  useEffect(() => {
    const container = document.getElementById('map');
    if (window.kakao && window.kakao.maps) {
      const options = {
        center: new window.kakao.maps.LatLng(37.566826, 126.9786567),
        level: 3,
      };
      const map = new window.kakao.maps.Map(container, options);
      new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(37.566826, 126.9786567),
      }).setMap(map);
    }
  }, []);
  return (
    <div id="map" className="w-full h-[60vh] rounded-3xl bg-gray-100"></div>
  );
}

function HeaderTab({ label, isActive, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
        isActive ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
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
      className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
    >
      <span
        className={`text-2xl transition-all ${
          isActive ? '-translate-y-1' : 'opacity-50 grayscale'
        }`}
      >
        {icon}
      </span>
      <span
        className={`text-[10px] font-bold mt-1 ${
          isActive ? 'text-blue-600' : 'text-gray-400'
        }`}
      >
        {label}
      </span>
    </button>
  );
}
