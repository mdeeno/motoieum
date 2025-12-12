// web/app/edit/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter, useParams } from 'next/navigation';

export default function EditPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');
  const [contactLink, setContactLink] = useState('');
  const [category, setCategory] = useState('market');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  // 기존 글 데이터 불러오기
  useEffect(() => {
    const fetchPost = async () => {
      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        alert('글을 불러오지 못했습니다.');
        router.back();
      } else {
        setTitle(post.title);
        setContent(post.content);
        setCategory(post.category);
        setPrice(post.price ? String(post.price) : '');
        setContactLink(post.contact_url || '');
      }
    };
    fetchPost();
  }, [id, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ✏️ 글 수정(Update) 로직
      const { error } = await supabase
        .from('posts')
        .update({
          title,
          content,
          price: category === 'market' && price ? parseInt(price) : null,
          contact_url: contactLink,
        })
        .eq('id', id); // 현재 글 ID만 수정

      if (error) throw error;
      alert('수정되었습니다! ✨');
      router.push(`/market/${id}`); // 상세 페이지로 돌아가기
    } catch (err) {
      console.error(err);
      alert('수정 실패 😢');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">글 수정하기</h1>
      <form onSubmit={handleUpdate} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-3 rounded-lg w-full text-black bg-white"
        />

        {category === 'market' && (
          <>
            <input
              type="number"
              placeholder="가격 (원)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border p-3 rounded-lg w-full text-black bg-white"
            />
            <input
              type="text"
              placeholder="오픈채팅 주소"
              value={contactLink}
              onChange={(e) => setContactLink(e.target.value)}
              className="border p-3 rounded-lg w-full text-black bg-white"
            />
          </>
        )}

        <textarea
          placeholder="내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border p-3 rounded-lg w-full h-60 text-black resize-none bg-white"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-300 text-gray-700 p-4 rounded-xl font-bold"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-2 w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700"
          >
            {isLoading ? '수정 중...' : '수정 완료'}
          </button>
        </div>
      </form>
    </div>
  );
}
