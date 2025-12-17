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
  const [activeTab, setActiveTab] = useState<'market' | 'community'>('market');
  const [communityCategory, setCommunityCategory] = useState('자유');

  // 공통
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 장터 전용
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [year, setYear] = useState(''); // 연식
  const [mileage, setMileage] = useState(''); // 주행거리

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === 'market') {
        if (!title || !price || !location || !content || !year || !mileage)
          throw new Error('내용을 모두 입력해주세요.');
      } else {
        if (!title || !content) throw new Error('제목과 내용을 입력해주세요.');
      }

      let publicUrl = null;
      if (imageFile) {
        const fileName = `${Date.now()}_${activeTab}_${imageFile.name}`;
        const { error } = await supabase.storage
          .from('images')
          .upload(fileName, imageFile);
        if (error) throw error;
        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      if (activeTab === 'market') {
        const { error } = await supabase.from('market').insert([
          {
            title,
            price,
            location,
            content,
            image_url: publicUrl,
            status: '판매중',
            year,
            mileage,
          },
        ]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('community').insert([
          {
            title,
            content,
            category: communityCategory,
            image_url: publicUrl,
          },
        ]);
        if (error) throw error;
      }

      alert('등록되었습니다!');
      router.push('/');
    } catch (error: any) {
      alert(error.message || '등록 실패');
    } finally {
      setLoading(false);
    }
  };

  // 🎨 스타일 정의
  const labelStyle = 'block text-sm font-bold text-gray-900 mb-2';
  const inputStyle =
    'w-full border border-gray-400 rounded-xl p-4 text-gray-900 placeholder-gray-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition';

  return (
    <div className="max-w-xl mx-auto p-6 bg-white min-h-screen">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="text-2xl mr-4 text-gray-600 hover:text-black transition"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-900">글쓰기</h1>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
        <button
          onClick={() => setActiveTab('market')}
          className={`flex-1 py-3 rounded-lg font-bold text-sm transition ${
            activeTab === 'market'
              ? 'bg-white shadow-sm text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          중고장터
        </button>
        <button
          onClick={() => setActiveTab('community')}
          className={`flex-1 py-3 rounded-lg font-bold text-sm transition ${
            activeTab === 'community'
              ? 'bg-white shadow-sm text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          커뮤니티
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {activeTab === 'community' && (
          <>
            <div>
              <label className={labelStyle}>말머리</label>
              <div className="flex gap-2">
                {['자유', '질문', '정보', '모임'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCommunityCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-bold border transition ${
                      communityCategory === cat
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            {/* 커뮤니티 제목 입력 (스타일 적용) */}
            <div>
              <label className={labelStyle}>제목</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력해주세요"
                className={inputStyle}
              />
            </div>
          </>
        )}

        {/* 장터 탭일 때만 보이는 입력 필드들 */}
        {activeTab === 'market' && (
          <>
            <div>
              <label className={labelStyle}>사진 등록</label>
              <div className="flex items-center gap-4">
                <label className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-400 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:text-blue-500 text-gray-500 transition group">
                  <span className="text-3xl mb-1 group-hover:scale-110 transition">
                    📷
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
                {previewUrl && (
                  <div className="w-24 h-24 rounded-xl overflow-hidden relative border border-gray-300 shadow-sm">
                    <img
                      src={previewUrl}
                      className="w-full h-full object-cover"
                      alt="미리보기"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        setImageFile(null);
                      }}
                      className="absolute top-1 right-1 bg-black/60 text-white w-6 h-6 flex items-center justify-center rounded-full text-sm hover:bg-black transition"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className={labelStyle}>제목</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 22년식 슈퍼커브 팝니다"
                className={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>제작 연식</label>
                <input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="예: 2023"
                  className={inputStyle}
                />
              </div>
              <div>
                <label className={labelStyle}>주행거리</label>
                <input
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="예: 12000"
                  className={inputStyle}
                />
              </div>
            </div>
            <div>
              <label className={labelStyle}>가격</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="예: 2200000 (숫자만 입력)"
                className={inputStyle}
              />
            </div>
            <div>
              <label className={labelStyle}>거래 지역</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="예: 서울 성동구"
                className={inputStyle}
              />
            </div>
          </>
        )}

        {/* 공통 상세 내용 입력 (스타일 적용) */}
        <div>
          <label className={labelStyle}>상세 내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력해주세요."
            className={`${inputStyle} h-48 resize-none`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-lg hover:bg-blue-700 transition disabled:bg-gray-300 mt-8 shadow-md"
        >
          {loading ? '등록 중...' : '등록 완료'}
        </button>
      </form>
    </div>
  );
}
