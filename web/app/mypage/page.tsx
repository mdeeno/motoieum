'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 데이터 목록
  const [myMarketItems, setMyMarketItems] = useState<any[]>([]);
  const [myCommunityPosts, setMyCommunityPosts] = useState<any[]>([]);
  const [myBookmarks, setMyBookmarks] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      // 1. 로그인 체크
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        router.replace('/login');
        return;
      }
      setUser(session.user);

      // 2. 내 판매글
      const { data: marketData } = await supabase
        .from('market')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      setMyMarketItems(marketData || []);

      // 3. 내 커뮤니티 글
      const { data: communityData } = await supabase
        .from('community')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      setMyCommunityPosts(communityData || []);

      // 4. 내 즐겨찾기
      const { data: bookmarkData } = await supabase
        .from('map_bookmarks')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      setMyBookmarks(bookmarkData || []);

      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await supabase.auth.signOut();
      router.replace('/');
    }
  };

  const handleDelete = async (table: string, id: number) => {
    if (!confirm('정말 삭제하시겠습니까? 복구할 수 없습니다.')) return;

    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      alert('삭제 실패: ' + error.message);
    } else {
      if (table === 'market')
        setMyMarketItems((prev) => prev.filter((item) => item.id !== id));
      if (table === 'community')
        setMyCommunityPosts((prev) => prev.filter((item) => item.id !== id));
      if (table === 'map_bookmarks')
        setMyBookmarks((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: '2-digit',
      month: 'numeric',
      day: 'numeric',
    });
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-500 font-medium">
        데이터를 불러오는 중입니다...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-6 min-h-screen bg-gray-50">
      {/* 🏠 헤더 & 프로필 카드 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-10">
        {/* 상단 네비게이션 */}
        <div className="flex justify-between items-start mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold transition"
          >
            <span>🏠</span> 홈으로
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-500 underline"
          >
            로그아웃
          </button>
        </div>

        {/* 유저 정보 */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center text-3xl shadow-inner">
            😎
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 mb-1">
              반갑습니다!
            </h1>
            <p className="text-gray-500 font-medium">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {/* 1. 내 판매 내역 */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <h2 className="text-xl font-bold text-gray-900">🏷️ 내 판매 내역</h2>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">
              {myMarketItems.length}
            </span>
          </div>

          {myMarketItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-400 border border-dashed border-gray-300">
              판매 중인 매물이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myMarketItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition group relative flex flex-col h-full cursor-pointer"
                  onClick={() => router.push(`/market/${item.id}`)}
                >
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
                        🏍️
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-black/70 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm">
                      판매중
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-1 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-blue-600 font-extrabold text-xl mb-2">
                      {parseInt(item.price) >= 10000
                        ? `${Math.floor(
                            parseInt(item.price) / 10000
                          ).toLocaleString()}만원`
                        : `${parseInt(item.price).toLocaleString()}원`}
                    </p>
                    <div className="mt-auto flex justify-between items-end text-xs text-gray-400 font-medium">
                      <span>{item.location}</span>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete('market', item.id);
                    }}
                    className="absolute top-3 right-3 bg-white/90 p-2 rounded-full text-gray-400 hover:text-red-500 shadow-sm hover:bg-white transition"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 2. 내 커뮤니티 글 */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <h2 className="text-xl font-bold text-gray-900">
              💬 내 커뮤니티 글
            </h2>
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
              {myCommunityPosts.length}
            </span>
          </div>

          {myCommunityPosts.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-400 border border-dashed border-gray-300">
              작성한 글이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myCommunityPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-blue-300 transition relative group cursor-pointer"
                  onClick={() => router.push(`/community/${post.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-bold">
                      {post.category || '자유'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1 group-hover:text-blue-600 transition">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {post.content}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete('community', post.id);
                    }}
                    className="absolute bottom-4 right-4 text-gray-300 hover:text-red-500 p-1 transition"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. 내 장소 즐겨찾기 */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <h2 className="text-xl font-bold text-gray-900">
              ⭐ 내 장소 즐겨찾기
            </h2>
            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-bold">
              {myBookmarks.length}
            </span>
          </div>

          {myBookmarks.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-400 border border-dashed border-gray-300">
              저장한 장소가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myBookmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition relative flex flex-col h-full"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-xl shrink-0">
                      📍
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 line-clamp-1">
                        {bm.place_name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {bm.address}
                      </p>
                    </div>
                  </div>
                  {bm.phone && (
                    <p className="text-sm text-blue-600 font-medium mt-auto mb-1">
                      📞 {bm.phone}
                    </p>
                  )}
                  <a
                    href={bm.place_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block w-full bg-gray-50 text-center py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-yellow-400 hover:text-white transition"
                  >
                    카카오맵 보기
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete('map_bookmarks', bm.id);
                    }}
                    className="absolute top-3 right-3 text-gray-300 hover:text-red-500 p-1 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. 📞 문의하기 / 관리자 컨택 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 px-2">
            📞 고객지원
          </h2>
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg">
            <div>
              <h3 className="font-bold text-lg mb-1">무엇을 도와드릴까요?</h3>
              <p className="text-gray-300 text-sm opacity-80">
                이용 중 불편한 점이나 관리자에게 하실 말씀이 있다면 연락주세요.
              </p>
            </div>
            {/* 👇 여기에 새 메일 주소 적용! */}
            <a
              href="mailto:motoieum@gmail.com"
              className="bg-white text-gray-900 px-5 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition whitespace-nowrap"
            >
              문의하기
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
