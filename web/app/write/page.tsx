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
  const [year, setYear] = useState(''); // 🟢 연식
  const [mileage, setMileage] = useState(''); // 🟢 주행거리

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
            year, // 🟢 DB 저장
            mileage, // 🟢 DB 저장
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

  return (
    <div className="max-w-xl mx-auto p-6 bg-white min-h-screen">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="text-2xl mr-4 text-gray-500"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold">글쓰기</h1>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('market')}
          className={`flex-1 py-3 rounded-lg font-bold text-sm transition ${
            activeTab === 'market'
              ? 'bg-white shadow text-blue-600'
              : 'text-gray-500'
          }`}
        >
          중고장터
        </button>
        <button
          onClick={() => setActiveTab('community')}
          className={`flex-1 py-3 rounded-lg font-bold text-sm transition ${
            activeTab === 'community'
              ? 'bg-white shadow text-blue-600'
              : 'text-gray-500'
          }`}
        >
          커뮤니티
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'community' && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              말머리
            </label>
            <div className="flex gap-2">
              {['자유', '질문', '정보', '모임'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCommunityCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border ${
                    communityCategory === cat
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-500 border-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            사진 등록
          </label>
          <div className="flex items-center gap-4">
            <label className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 text-gray-400">
              <span className="text-2xl">📷</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
            {previewUrl && (
              <div className="w-20 h-20 rounded-xl overflow-hidden relative border">
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

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            제목
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              activeTab === 'market'
                ? '예: 22년식 슈퍼커브 팝니다'
                : '제목을 입력해주세요'
            }
            className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-blue-500"
          />
        </div>

        {activeTab === 'market' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {/* 🟢 연식 & 주행거리 입력 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  제작 연식
                </label>
                <input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="예: 2022년식"
                  className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  주행거리
                </label>
                <input
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="예: 5,000km"
                  className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                가격
              </label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="예: 150만원"
                className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                거래 지역
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="예: 서울 성동구"
                className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-blue-500"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            상세 내용
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력해주세요."
            className="w-full border border-gray-300 rounded-xl p-4 h-40 resize-none outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-lg hover:bg-blue-700 transition disabled:bg-gray-300 mt-6 shadow-lg shadow-blue-200"
        >
          {loading ? '등록 중...' : '등록 완료'}
        </button>
      </form>
    </div>
  );
}
