'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function WritePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 입력값
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');

  // 1. 로그인 체크 (페이지 들어오자마자 검사)
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        alert('글을 작성하려면 로그인이 필요합니다!');
        router.replace('/login');
      }
    };
    checkUser();
  }, []);

  // 2. 글 등록하기
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !location) {
      alert('내용을 모두 입력해주세요.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('market').insert([
      {
        title,
        price,
        location,
        status: '판매중', // 기본 상태
      },
    ]);

    if (error) {
      console.error(error);
      alert('등록에 실패했습니다.');
    } else {
      alert('성공적으로 등록되었습니다!');
      router.push('/'); // 메인으로 이동
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white min-h-screen">
      {/* 상단 네비게이션 */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => router.back()}
          className="text-2xl mr-4 cursor-pointer"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold">내 오토바이 팔기</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 22년식 슈퍼커브 팝니다"
            className="w-full border border-gray-300 rounded-xl p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            가격
          </label>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="예: 150만원"
            className="w-full border border-gray-300 rounded-xl p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            거래 지역
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="예: 서울 성동구"
            className="w-full border border-gray-300 rounded-xl p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-lg hover:bg-blue-700 transition disabled:bg-gray-300 mt-10"
        >
          {loading ? '등록 중...' : '매물 등록하기'}
        </button>
      </form>
    </div>
  );
}
