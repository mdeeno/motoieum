// web/app/write/page.tsx
'use client';

import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function WritePage() {
  const [category, setCategory] = useState('market'); // 📂 카테고리 (market/community)
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');
  const [contactLink, setContactLink] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return alert('제목과 내용을 입력해주세요.');
    // 장터글인데 가격이 없으면 경고
    if (category === 'market' && !price)
      return alert('판매 가격을 입력해주세요.');

    setIsLoading(true);

    try {
      let imageUrl = null;
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, image);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      const { error } = await supabase.from('posts').insert([
        {
          category, // 📂 카테고리 저장
          title,
          content,
          price: category === 'market' && price ? parseInt(price) : null, // 커뮤니티면 가격 없음
          contact_url: contactLink,
          image_url: imageUrl,
        },
      ]);

      if (error) throw error;
      alert('등록되었습니다!');
      router.push('/market');
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">글쓰기</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 📂 게시판 선택 */}
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setCategory('market')}
            className={`flex-1 p-3 rounded-xl font-bold border-2 transition ${
              category === 'market'
                ? 'border-orange-500 bg-orange-50 text-orange-600'
                : 'border-gray-200 text-gray-400'
            }`}
          >
            🏷️ 중고거래
          </button>
          <button
            type="button"
            onClick={() => setCategory('community')}
            className={`flex-1 p-3 rounded-xl font-bold border-2 transition ${
              category === 'community'
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : 'border-gray-200 text-gray-400'
            }`}
          >
            💬 커뮤니티
          </button>
        </div>

        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-3 rounded-lg w-full text-black bg-white"
        />

        {/* 장터글일 때만 가격/연락처 입력 */}
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
          className="border p-3 rounded-lg w-full h-40 text-black resize-none bg-white"
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
            className="border-2 border-dashed p-4 rounded-lg text-gray-500 hover:text-blue-500 font-bold"
          >
            {image ? `📸 ${image.name}` : '+ 사진 추가'}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`p-4 rounded-xl font-bold text-white transition ${
            category === 'market'
              ? 'bg-orange-500 hover:bg-orange-600'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? '저장 중...' : '등록 완료'}
        </button>
      </form>
    </div>
  );
}
