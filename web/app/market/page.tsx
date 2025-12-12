// web/app/market/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  image_url: string | null; // 📸 이미지 주소 타입 추가
};

export default function MarketPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

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
      <header className="bg-white p-4 sticky top-0 border-b z-10 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">중고 장터</h1>
        <button
          onClick={() => router.push('/write')}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-600 transition"
        >
          + 글쓰기
        </button>
      </header>

      <div className="max-w-md mx-auto p-4 flex flex-col gap-3">
        {posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>아직 등록된 물건이 없어요.</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              onClick={() => router.push(`/market/${post.id}`)}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md flex gap-4"
            >
              {/* 📸 썸네일 이미지 영역 */}
              <div className="w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                {post.image_url ? (
                  <img
                    src={post.image_url}
                    alt="상품 이미지"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    이미지 없음
                  </div>
                )}
              </div>

              {/* 글 내용 영역 */}
              <div className="flex flex-col justify-between flex-grow">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 line-clamp-1">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                    {post.content}
                  </p>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(post.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
