// web/app/market/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase'; // 경로가 ../../../ 인 점 주의!

type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

export default function MarketDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id; // URL에서 글 번호 가져오기

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      // Supabase에서 id가 일치하는 글 1개만 가져오기
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('글 가져오기 실패:', error);
      } else {
        setPost(data);
      }
      setLoading(false);
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 text-white">로딩 중...</div>;
  }

  if (!post) {
    return (
      <div className="text-center py-20 text-white">글을 찾을 수 없습니다.</div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 상단 헤더 (뒤로가기) */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b z-20 px-4 h-14 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-2xl p-2 hover:bg-gray-100 rounded-full cursor-pointer text-black"
        >
          ←
        </button>
        <h1 className="font-bold text-lg text-black">상품 상세</h1>
      </header>

      {/* 상품 이미지 영역 (지금은 임시 박스) */}
      <div className="w-full h-[40vh] bg-gray-200 flex items-center justify-center text-gray-400 text-lg font-bold">
        상품 이미지 영역 (ID: {post.id})
      </div>

      {/* 상세 내용 */}
      <div className="max-w-3xl mx-auto p-5">
        {/* 작성자 프로필 (임시) */}
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
            <div>
              <div className="font-bold text-gray-900">익명의 라이더</div>
              <div className="text-xs text-gray-500">
                {new Date(post.created_at).toLocaleDateString()} 작성
              </div>
            </div>
          </div>
        </div>

        {/* 제목 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {post.title}
          </h1>
          <div className="flex gap-2 text-sm text-gray-500">
            <span>중고 거래</span> · <span>조회수 0</span>
          </div>
        </div>

        {/* 본문 내용 */}
        <div className="text-gray-800 leading-relaxed min-h-[200px] whitespace-pre-line">
          {post.content}
        </div>
      </div>

      {/* 하단 고정 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-area-pb z-30">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button className="text-2xl text-gray-400 hover:text-red-500 transition cursor-pointer">
              ♥
            </button>
            <div className="border-l pl-4 h-10 flex flex-col justify-center">
              <span className="text-xs text-gray-500 font-bold">가격</span>
              <span className="text-xl font-extrabold text-gray-900">
                가격 미정
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
