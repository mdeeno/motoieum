'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function KakaoMap({ user }: { user: any }) {
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

      {/* 현재 위치 버튼 등 나머지 UI 생략 없이 그대로 포함됨 */}
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
