'use client';

import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function WritePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState(''); // 💰 가격 입력값 (문자로 받음)
  const [image, setImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return alert('제목과 내용을 모두 입력해주세요.');

    setIsLoading(true);

    try {
      let imageUrl = null;

      // 1. 이미지 업로드
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      // 2. 글 저장 (가격 포함)
      const { error } = await supabase.from('posts').insert([
        {
          title,
          content,
          price: price ? parseInt(price) : null, // 숫자로 변환해서 저장
          image_url: imageUrl,
        },
      ]);

      if (error) {
        console.error(error);
        alert('글 저장에 실패했습니다.');
      } else {
        alert('글이 등록되었습니다! 🎉');
        router.push('/market');
      }
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">
        중고 거래 글쓰기
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="제목 (예: 22년식 슈퍼커브 팝니다)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-3 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        />

        {/* 💰 가격 입력창 */}
        <input
          type="number"
          placeholder="가격 (원) - 숫자만 입력"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border p-3 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        />

        <textarea
          placeholder="내용 (연식, 키로수, 튜닝 내역 등)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border p-3 rounded-lg w-full h-40 text-black resize-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        />

        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.length) setImage(e.target.files[0]);
            }}
            className="hidden"
            ref={fileInputRef}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed p-4 rounded-lg transition text-center font-bold
                    ${
                      image
                        ? 'border-orange-500 text-orange-500 bg-orange-50'
                        : 'border-gray-300 text-gray-400 hover:border-orange-400 hover:text-orange-400'
                    }
                `}
          >
            {image ? `📸 ${image.name} 선택됨` : '+ 사진 추가하기'}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-orange-500 text-white p-4 rounded-xl font-bold hover:bg-orange-600 disabled:bg-gray-300 transition shadow-lg mt-2"
        >
          {isLoading ? '저장 중...' : '작성 완료'}
        </button>
      </form>
    </div>
  );
}
