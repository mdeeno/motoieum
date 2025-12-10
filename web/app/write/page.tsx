// web/app/write/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase'; // 경로 확인 (빨간줄 뜨면 수정)
import { useRouter } from 'next/navigation';

export default function WritePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return alert('제목과 내용을 모두 입력해주세요.');

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('posts')
        .insert([{ title, content }]);

      if (error) {
        console.error('에러 발생:', error);
        alert('글 저장에 실패했습니다 😢');
      } else {
        alert('글이 성공적으로 등록되었습니다! 🎉');
        router.push('/market'); // 저장 후 목록 페이지로 이동
      }
    } catch (err) {
      console.error(err);
      alert('알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">중고 거래 글쓰기</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="제목 (예: 혼다 슈퍼커브 팝니다)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          // 👇 여기에 bg-white를 추가했습니다!
          className="border p-3 rounded-lg w-full text-black bg-white"
        />
        <textarea
          placeholder="내용 (가격, 연식, 상태 등을 적어주세요)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          // 👇 여기에도 bg-white를 추가했습니다!
          className="border p-3 rounded-lg w-full h-40 text-black resize-none bg-white"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-orange-500 text-white p-3 rounded-lg font-bold hover:bg-orange-600 disabled:bg-gray-400 transition"
        >
          {isLoading ? '저장 중...' : '작성 완료'}
        </button>
      </form>
    </div>
  );
}
