// web/app/market/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

// 데이터 타입 정의
type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

export default function MarketPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const router = useRouter();

  // Supabase에서 글 목록 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false }); // 최신순

      if (error) {
        console.error('에러:', error);
      } else {
        setPosts(data || []);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <header className="bg-white p-4 sticky top-0 border-b z-10 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">중고 장터</h1>
        <button
          onClick={() => router.push('/write')}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-600 transition"
        >
          + 글쓰기
        </button>
      </header>

      {/* 글 목록 리스트 */}
      <div className="max-w-md mx-auto p-4 flex flex-col gap-3">
        {posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>아직 등록된 물건이 없어요.</p>
            <p className="text-sm mt-2">첫 번째 판매자가 되어보세요!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              onClick={() => router.push(`/market/${post.id}`)} // 클릭 시 상세 페이지 이동
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-orange-200 transition"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {post.title}
              </h2>
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {post.content}
              </p>
              <div className="text-xs text-gray-400 flex justify-between items-center">
                <span>
                  {new Date(post.created_at).toLocaleDateString()} 등록
                </span>
                <span className="text-orange-500 font-bold">상세보기 &gt;</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
