'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  image_url: string | null;
  price: number | null; // 💰 가격 타입
};

export default function MarketDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) console.error(error);
      else setPost(data);
      setLoading(false);
    };

    fetchPost();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">
        로딩 중...
      </div>
    );
  if (!post)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">
        글을 찾을 수 없습니다.
      </div>
    );

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 헤더 */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b z-20 px-4 h-14 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-2xl p-2 hover:bg-gray-100 rounded-full cursor-pointer text-black"
        >
          ←
        </button>
        <h1 className="font-bold text-lg text-black">상품 상세</h1>
      </header>

      {/* 상품 이미지 */}
      <div className="w-full h-[40vh] bg-gray-100 flex items-center justify-center overflow-hidden">
        {post.image_url ? (
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400 font-bold">
            이미지가 없는 게시글입니다.
          </div>
        )}
      </div>

      {/* 상세 내용 */}
      <div className="max-w-3xl mx-auto p-5">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          <div>
            <div className="font-bold text-gray-900">익명의 판매자</div>
            <div className="text-xs text-gray-500">
              {new Date(post.created_at).toLocaleDateString()} 작성
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{post.title}</h1>
        <div className="text-gray-800 leading-relaxed min-h-[100px] whitespace-pre-line">
          {post.content}
        </div>
      </div>

      {/* 🟢 하단 고정 구매바 (가격 표시) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-area-pb z-30">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button className="text-2xl text-gray-400 hover:text-red-500 transition cursor-pointer">
              ♥
            </button>
            <div className="border-l pl-4 h-10 flex flex-col justify-center">
              <span className="text-xs text-gray-500 font-bold">가격</span>
              {/* 💰 가격 표시 (천단위 콤마) */}
              <span className="text-xl font-extrabold text-gray-900">
                {post.price ? `${post.price.toLocaleString()}원` : '가격 제안'}
              </span>
            </div>
          </div>
          <button className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition cursor-pointer">
            채팅으로 거래하기
          </button>
        </div>
      </div>
    </div>
  );
}
