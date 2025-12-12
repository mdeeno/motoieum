'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function MyPage() {
  const [profile, setProfile] = useState<any>(null);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchMyData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      // 1. 프로필 정보
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profile);

      // 2. 찜한 목록 가져오기 (관계형 쿼리)
      const { data: likes } = await supabase
        .from('likes')
        .select(
          `
          post_id,
          posts ( * )
        `
        )
        .eq('user_id', user.id);

      if (likes) {
        setLikedPosts(likes.map((like: any) => like.posts));
      }
    };
    fetchMyData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-6 mb-4">
        <h1 className="text-2xl font-bold mb-2">
          안녕하세요, {profile?.nickname || '라이더'}님! 🏍️
        </h1>
        <p className="text-gray-500 text-sm">{profile?.email}</p>
      </div>

      <div className="p-4">
        <h2 className="font-bold text-lg mb-4">❤️ 찜한 목록</h2>
        <div className="grid grid-cols-2 gap-4">
          {likedPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => router.push(`/market/${post.id}`)}
              className="bg-white p-3 rounded-xl shadow-sm cursor-pointer"
            >
              <div className="h-32 bg-gray-100 rounded-lg mb-2 overflow-hidden">
                {post.image_url && (
                  <img
                    src={post.image_url}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="font-bold text-sm truncate">{post.title}</div>
              <div className="text-orange-500 font-bold">
                {post.price?.toLocaleString()}원
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🟢 모바일 탭바 연결 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-20 safe-area-pb z-40">
        <button onClick={() => router.push('/market')}>🏷️ 장터</button>
        <button onClick={() => router.push('/market')}>💬 커뮤니티</button>
        <button onClick={() => router.push('/market')}>🗺️ 지도</button>
        <button className="text-blue-600 font-bold">👤 마이</button>
      </nav>
    </div>
  );
}
