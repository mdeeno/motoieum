// web/app/write/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { IoMdHome } from 'react-icons/io';

export default function WritePage() {
  const [category, setCategory] = useState('market');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');
  const [contactLink, setContactLink] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요한 서비스입니다!');
        router.replace('/login');
      } else setUser(user);
    };
    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return alert('제목과 내용을 입력해주세요.');
    if (category === 'market' && !price)
      return alert('판매 가격을 입력해주세요.');
    if (!user) return alert('로그인 정보가 없습니다.');
    setIsLoading(true);
    try {
      let imageUrl = null;
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error } = await supabase.storage
          .from('images')
          .upload(fileName, image);
        if (error) throw error;
        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }
      const { error } = await supabase.from('posts').insert([
        {
          category,
          title,
          content,
          price: category === 'market' && price ? parseInt(price) : null,
          contact_url: contactLink,
          image_url: imageUrl,
          user_id: user.id,
        },
      ]);
      if (error) throw error;
      alert('등록되었습니다! 🎉');
      router.push('/market');
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user)
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        로딩 중...
      </div>
    );

  return (
    <div className="p-6 mx-auto min-h-screen bg-gray-50 max-w-md md:max-w-2xl shadow-xl">
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
          글쓰기
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
      >
        {/* 🔵 게시판 선택 버튼 (색상 변경: Orange -> Blue) */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCategory('market')}
            className={`flex-1 p-3 rounded-xl font-bold border-2 transition ${
              category === 'market'
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : 'border-gray-200 text-gray-400 hover:bg-gray-50'
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
                : 'border-gray-200 text-gray-400 hover:bg-gray-50'
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
          className="border p-4 rounded-xl w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
        />

        {category === 'market' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <input
              type="number"
              placeholder="가격 (원)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border p-4 rounded-xl w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            <input
              type="text"
              placeholder="오픈채팅 주소 (선택)"
              value={contactLink}
              onChange={(e) => setContactLink(e.target.value)}
              className="border p-4 rounded-xl w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
        )}

        <textarea
          placeholder="내용을 입력하세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border p-4 rounded-xl w-full h-48 text-black resize-none bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
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
            className="border-2 border-dashed p-4 rounded-xl text-gray-400 hover:text-blue-500 hover:border-blue-500 font-bold transition bg-gray-50"
          >
            {image ? `📸 ${image.name}` : '+ 사진 추가하기'}
          </button>
        </div>

        {/* 🔵 등록 완료 버튼 (색상 변경: Orange -> Blue) */}
        <button
          type="submit"
          disabled={isLoading}
          className="p-4 rounded-xl font-bold text-white transition shadow-lg mt-2 bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? '저장 중...' : '등록 완료'}
        </button>
      </form>
    </div>
  );
}
