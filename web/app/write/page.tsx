'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { IoMdArrowBack, IoMdCamera } from 'react-icons/io';

export default function WritePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('market');
  const [isLoading, setIsLoading] = useState(false);

  // 이미지 관련 상태
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 이미지 선택 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return alert('제목과 내용은 필수입니다.');
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      // 1. 이미지 업로드 (있을 경우에만)
      let finalImageUrl = null;
      if (imageFile) {
        const fileName = `${Date.now()}_${Math.random()}`;

        // Supabase Storage에 업로드
        const { error: uploadError } = await supabase.storage
          .from('images') // 버킷 이름
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        // 업로드된 이미지의 공개 주소(URL) 가져오기
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);

        finalImageUrl = urlData.publicUrl;
      }

      // 2. 게시글 저장 (이미지 주소 포함)
      const { error } = await supabase.from('posts').insert([
        {
          title,
          content,
          price: category === 'market' && price ? Number(price) : null,
          category,
          user_id: user.id,
          image_url: finalImageUrl,
        },
      ]);

      if (error) throw error;
      router.push('/market');
    } catch (error: any) {
      alert(`업로드 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white mx-auto md:max-w-2xl shadow-xl pb-20">
      <header className="p-4 border-b flex items-center gap-2 sticky top-0 bg-white z-10">
        <button
          onClick={() => router.back()}
          className="text-2xl p-2 hover:bg-gray-100 rounded-full"
        >
          <IoMdArrowBack />
        </button>
        <h1 className="font-bold text-lg">글쓰기</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
        {/* 카테고리 선택 */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setCategory('market')}
            className={`flex-1 py-3 rounded-lg font-bold transition ${
              category === 'market'
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-400'
            }`}
          >
            중고거래
          </button>
          <button
            type="button"
            onClick={() => setCategory('community')}
            className={`flex-1 py-3 rounded-lg font-bold transition ${
              category === 'community'
                ? 'bg-white shadow text-green-600'
                : 'text-gray-400'
            }`}
          >
            커뮤니티
          </button>
        </div>

        {/* 📸 사진 업로드 UI */}
        <div>
          <label className="block mb-2 font-bold text-gray-700">
            사진 추가
          </label>
          <div className="flex items-center gap-4">
            <label className="w-20 h-20 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition text-gray-400">
              <IoMdCamera size={24} />
              <span className="text-xs">선택</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
            {previewUrl && (
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 relative">
                <img src={previewUrl} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setImageFile(null);
                  }}
                  className="absolute top-0 right-0 bg-black/50 text-white w-5 h-5 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          className="border-b p-3 text-lg font-bold focus:outline-none focus:border-blue-500"
        />

        {category === 'market' && (
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="가격 (원)"
            className="border-b p-3 font-bold focus:outline-none focus:border-blue-500"
          />
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            category === 'market'
              ? '물건에 대한 자세한 설명을 적어주세요.'
              : '궁금한 점이나 이야기를 자유롭게 적어주세요.'
          }
          className="bg-gray-50 p-4 rounded-xl h-60 resize-none focus:outline-none focus:ring-2 focus:ring-gray-200"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:bg-gray-300"
        >
          {isLoading ? '등록 중...' : '완료'}
        </button>
      </form>
    </div>
  );
}
