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

  // 입력값 상태
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [content, setContent] = useState(''); // 상세 내용
  const [imageFile, setImageFile] = useState<File | null>(null); // 업로드할 파일
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // 미리보기 URL

  // 1. 로그인 체크
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        alert('로그인이 필요합니다!');
        router.replace('/login');
      }
    });
  }, []);

  // 2. 이미지 선택 시 미리보기 처리
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // 3. 등록하기 (이미지 업로드 -> DB 저장)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !location || !content) {
      alert('내용을 모두 입력해주세요!');
      return;
    }

    setLoading(true);

    let publicUrl = null;

    try {
      // 3-1. 이미지가 있다면 Supabase Storage에 업로드
      if (imageFile) {
        const fileName = `${Date.now()}_${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('images') // 아까 만든 버킷 이름
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        // 이미지 주소 가져오기
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);

        publicUrl = urlData.publicUrl;
      }

      // 3-2. DB에 게시글 저장
      const { error: dbError } = await supabase.from('market').insert([
        {
          title,
          price,
          location,
          content, // 상세 내용 저장
          image_url: publicUrl, // 업로드된 이미지 주소 저장
          status: '판매중',
        },
      ]);

      if (dbError) throw dbError;

      alert('매물이 성공적으로 등록되었습니다! 🎉');
      router.push('/');
    } catch (error) {
      console.error(error);
      alert('등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white min-h-screen">
      <div className="flex items-center mb-8">
        <button
          onClick={() => router.back()}
          className="text-2xl mr-4 cursor-pointer text-gray-500 hover:text-black"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold">내 오토바이 팔기</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 📸 이미지 업로드 UI 복구 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            사진 등록
          </label>
          <div className="flex items-center gap-4">
            <label className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition text-gray-400 hover:text-blue-500">
              {/* 카메라 아이콘 (SVG) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 mb-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                />
              </svg>
              <span className="text-xs font-bold">사진 추가</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>

            {/* 미리보기 이미지 */}
            {previewUrl && (
              <div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-200 relative shadow-sm">
                <img
                  src={previewUrl}
                  alt="미리보기"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setImageFile(null);
                  }}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 22년식 슈퍼커브 팝니다"
            className="w-full border border-gray-300 rounded-xl p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
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
            className="w-full border border-gray-300 rounded-xl p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
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
            className="w-full border border-gray-300 rounded-xl p-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
          />
        </div>

        {/* 📝 상세 내용 입력창 복구 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            상세 내용
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="물건에 대한 자세한 설명을 적어주세요. (구매 시기, 튜닝 내역, 흠집 등)"
            className="w-full border border-gray-300 rounded-xl p-4 h-40 resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-lg hover:bg-blue-700 transition disabled:bg-gray-300 mt-4 shadow-lg shadow-blue-200"
        >
          {loading ? '등록 중...' : '매물 등록하기'}
        </button>
      </form>
    </div>
  );
}
