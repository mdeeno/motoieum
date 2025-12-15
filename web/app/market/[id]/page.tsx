'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MarketDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserAndFetch = async () => {
      // 1. 로그인 체크
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert('상세 내용은 로그인 후 확인할 수 있습니다! 🔒');
        router.push('/login');
        return;
      }

      // 2. 데이터 가져오기 (로그인 된 경우만)
      if (id) {
        const { data, error } = await supabase
          .from('market')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          alert('삭제되었거나 존재하지 않는 게시글입니다.');
          router.back();
        } else {
          setItem(data);
        }
      }
      setLoading(false);
    };

    checkUserAndFetch();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        불러오는 중...
      </div>
    );
  if (!item) return null;

  return (
    <div className="max-w-3xl mx-auto bg-white min-h-screen flex flex-col">
      {/* 상단 헤더 */}
      <div className="p-4 border-b flex items-center sticky top-0 bg-white z-10">
        <button
          onClick={() => router.back()}
          className="text-gray-500 font-bold mr-4"
        >
          ←
        </button>
        <span className="font-bold text-lg">매물 상세</span>
      </div>

      <div className="p-4 pb-24">
        {/* 이미지 영역 */}
        <div className="w-full h-80 bg-gray-100 rounded-2xl overflow-hidden mb-6 flex items-center justify-center relative">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <span className="text-4xl mb-2">📷</span>
              <span>이미지 없음</span>
            </div>
          )}
        </div>

        {/* 작성자 정보 (간단 프로필) */}
        <div className="flex items-center gap-3 mb-6 border-b pb-6">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div>
            <div className="font-bold text-sm">라이더님</div>
            <div className="text-xs text-gray-500">{item.location}</div>
          </div>
        </div>

        {/* 내용 영역 */}
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-2 leading-tight">
            {item.title}
          </h1>
          <div className="text-xs text-gray-400 mb-6">
            {new Date(item.created_at).toLocaleDateString()} · {item.status}
          </div>

          <div className="text-gray-700 min-h-[100px] whitespace-pre-wrap leading-relaxed">
            {/* 상세 내용이 DB에 있다면 여기에 item.description 출력. 지금은 제목으로 대체 */}
            {item.title}에 대한 상세 설명입니다.
            <br />
            거래를 원하시면 아래 버튼을 눌러주세요!
          </div>
        </div>
      </div>

      {/* 하단 구매 버튼 바 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t safe-area-pb shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="font-extrabold text-2xl text-gray-900">
            {item.price}
          </div>
          <button className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl text-lg hover:bg-blue-700 transition">
            채팅으로 거래하기
          </button>
        </div>
      </div>
    </div>
  );
}
