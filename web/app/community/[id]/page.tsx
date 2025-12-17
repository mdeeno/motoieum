'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CommunityDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('community')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        alert('글을 불러오지 못했습니다.');
        router.push('/');
      } else {
        setPost(data);
      }
      setLoading(false);
    };

    fetchPost();
  }, [id, router]);

  if (loading) return <div className="text-center py-20">로딩 중...</div>;
  if (!post) return <div className="text-center py-20">글이 없습니다.</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 min-h-screen bg-white">
      {/* 상단 네비게이션 */}
      <div className="flex items-center mb-6 border-b pb-4">
        <button
          onClick={() => router.back()}
          className="text-2xl mr-4 text-gray-500 hover:text-black transition"
        >
          ←
        </button>
        <h1 className="text-xl font-bold">커뮤니티</h1>
      </div>

      {/* 게시글 본문 */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
            {post.category || '자유'}
          </span>
          <span className="text-gray-400 text-sm">
            {new Date(post.created_at).toLocaleString()}
          </span>
        </div>

        <h1 className="text-3xl font-black text-gray-900 leading-tight">
          {post.title}
        </h1>

        {post.image_url && (
          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <img
              src={post.image_url}
              alt="게시글 이미지"
              className="w-full object-cover"
            />
          </div>
        )}

        <div className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap min-h-[200px]">
          {post.content}
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-20"></div>
    </div>
  );
}
