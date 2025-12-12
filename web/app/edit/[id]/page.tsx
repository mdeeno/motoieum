// web/app/edit/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { IoMdHome } from 'react-icons/io';

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
      const { error } = await supabase
        .from('posts')
        .update({
          title,
          content,
          price: category === 'market' && price ? parseInt(price) : null,
          contact_url: contactLink,
        })
        .eq('id', id);

      if (error) throw error;
      alert('수정되었습니다! ✨');
      router.push(`/market/${id}`);
    } catch (err) {
      console.error(err);
      alert('수정 실패 😢');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 mx-auto min-h-screen bg-gray-50 max-w-md md:max-w-2xl shadow-xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50 pt-2 pb-4 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="text-2xl hover:bg-gray-200 rounded-full p-2 transition"
          >
            ←
          </button>
          <button
            onClick={() => router.push('/market')}
            className="text-2xl hover:bg-gray-200 rounded-full p-2 text-gray-600 transition"
          >
            <IoMdHome />
          </button>
        </div>
        <h1 className="text-xl font-bold text-gray-900 absolute left-1/2 transform -translate-x-1/2">
          글 수정하기
        </h1>
      </div>

      <form
        onSubmit={handleUpdate}
        className="flex flex-col gap-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
      >
        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-4 rounded-xl w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
        />

        {category === 'market' && (
          <>
            <input
              type="number"
              placeholder="가격 (원)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border p-4 rounded-xl w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            <input
              type="text"
              placeholder="오픈채팅 주소"
              value={contactLink}
              onChange={(e) => setContactLink(e.target.value)}
              className="border p-4 rounded-xl w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </>
        )}

        <textarea
          placeholder="내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border p-4 rounded-xl w-full h-60 text-black resize-none bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
        />

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-200 text-gray-700 p-4 rounded-xl font-bold hover:bg-gray-300 transition"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-2 w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg"
          >
            {isLoading ? '수정 중...' : '수정 완료'}
          </button>
        </div>
      </form>
    </div>
  );
}
