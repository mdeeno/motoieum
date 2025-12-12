// web/app/market/[id]/page.tsx
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
  price: number | null;
  contact_url: string | null;
  user_id: string | null;
};

export default function MarketDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [post, setPost] = useState<Post | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const { data: postData } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();
      setPost(postData);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) {
      alert('삭제되었습니다!');
      router.push('/market');
    }
  };

  // ✏️ 수정 페이지로 이동
  const handleEdit = () => {
    router.push(`/edit/${id}`);
  };

  const handleChat = () => {
    if (!post?.contact_url)
      return alert('판매자가 연락처 링크를 등록하지 않았습니다 😢');
    let url = post.contact_url.trim();
    if (!url.startsWith('http')) url = `https://${url}`;
    window.open(url, '_blank');
  };

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

  const isMyPost =
    currentUser && post.user_id && currentUser.id === post.user_id;

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b z-20 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-2xl p-2 hover:bg-gray-100 rounded-full text-black"
          >
            ←
          </button>
          <h1 className="font-bold text-lg text-black">상품 상세</h1>
        </div>

        {/* 🚨 내 글일 때만: 수정/삭제 버튼 표시 */}
        {isMyPost && (
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="text-blue-500 p-2 text-sm font-bold border border-blue-200 rounded-lg hover:bg-blue-50 transition"
            >
              ✏️ 수정
            </button>
            <button
              onClick={handleDelete}
              className="text-red-500 p-2 text-sm font-bold border border-red-200 rounded-lg hover:bg-red-50 transition"
            >
              🗑️ 삭제
            </button>
          </div>
        )}
      </header>

      <div className="w-full h-[40vh] bg-gray-100 flex items-center justify-center overflow-hidden">
        {post.image_url ? (
          <img src={post.image_url} className="w-full h-full object-cover" />
        ) : (
          <div className="text-gray-400 font-bold">이미지 없음</div>
        )}
      </div>

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

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-area-pb z-30">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button className="text-2xl text-gray-400 hover:text-red-500">
              ♥
            </button>
            <div className="border-l pl-4 h-10 flex flex-col justify-center">
              <span className="text-xs text-gray-500 font-bold">가격</span>
              <span className="text-xl font-extrabold text-gray-900">
                {post.price ? `${post.price.toLocaleString()}원` : '가격 제안'}
              </span>
            </div>
          </div>
          <button
            onClick={handleChat}
            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition"
          >
            채팅으로 거래하기
          </button>
        </div>
      </div>
    </div>
  );
}
