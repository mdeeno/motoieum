'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { IoMdArrowBack } from 'react-icons/io';

export default function ChatListPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      setUserId(user.id);

      // 내가 포함된(구매자 or 판매자) 채팅방 가져오기
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(
          `
          *,
          posts (
            title,
            image_url,
            price
          )
        `
        )
        // Supabase OR 필터 문법
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      else setRooms(data || []);
      setLoading(false);
    };

    fetchRooms();
  }, []);

  return (
    <div className="min-h-screen bg-white mx-auto md:max-w-2xl shadow-xl">
      <header className="p-4 border-b flex items-center gap-2 sticky top-0 bg-white z-10">
        <button
          onClick={() => router.push('/market')}
          className="text-2xl hover:bg-gray-100 p-2 rounded-full"
        >
          <IoMdArrowBack />
        </button>
        <h1 className="font-bold text-lg">채팅 목록</h1>
      </header>

      <div className="p-4 space-y-2">
        {loading ? (
          <p className="text-center text-gray-400 mt-10">로딩 중...</p>
        ) : rooms.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            <p>대화 중인 채팅방이 없어요.</p>
          </div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => router.push(`/chat/${room.id}`)}
              className="flex items-center gap-4 p-4 border rounded-2xl cursor-pointer hover:bg-gray-50 transition active:scale-[0.98]"
            >
              <div className="w-14 h-14 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                {room.posts?.image_url ? (
                  <img
                    src={room.posts.image_url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-gray-400">
                    No Img
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">
                  {room.posts?.title || '삭제된 게시글'}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {room.seller_id === userId
                    ? '구매 희망자와 대화 중'
                    : '판매자와 대화 중'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
