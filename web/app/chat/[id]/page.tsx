// web/app/chat/[id]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { IoMdSend, IoMdHome, IoMdArrowBack } from 'react-icons/io'; // 뒤로가기 아이콘 추가

export default function ChatRoom() {
  const { id } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const [userData, messagesData] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('messages')
          .select('*')
          .eq('room_id', id)
          .order('created_at', { ascending: true }),
      ]);

      if (!userData.data.user) {
        alert('로그인이 필요합니다.');
        return router.push('/login');
      }
      setUser(userData.data.user);

      if (messagesData.error) console.error(messagesData.error);
      else setMessages(messagesData.data || []);

      setLoading(false);

      const channel = supabase
        .channel(`room-${id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `room_id=eq.${id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };
    init();
  }, [id, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const msgToSend = newMessage;
    setNewMessage('');

    const { error } = await supabase.from('messages').insert([
      {
        room_id: id,
        sender_id: user.id,
        content: msgToSend,
      },
    ]);

    if (error) {
      setNewMessage(msgToSend);
      alert('전송 실패');
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        로딩 중...
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-gray-50 mx-auto md:max-w-2xl shadow-xl">
      {/* 헤더 */}
      <header className="bg-white p-4 border-b flex items-center gap-2 sticky top-0 z-10">
        {/* 1. 뒤로가기 버튼: 아이콘 변경 & 검은색으로 진하게 */}
        <button
          onClick={() => router.back()}
          className="text-2xl p-2 hover:bg-gray-100 rounded-full transition text-black"
        >
          <IoMdArrowBack />
        </button>
        <button
          onClick={() => router.push('/market')}
          className="text-2xl p-2 hover:bg-gray-100 rounded-full text-gray-600 transition"
        >
          <IoMdHome />
        </button>
        <h1 className="font-bold text-lg ml-2 text-black">채팅방</h1>
      </header>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 bg-white">
        {/* 4. 안내 문구: 더 잘 보이게 수정 (연한 회색 -> 진한 회색 + 중앙 정렬) */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full pb-20 opacity-80">
            <div className="text-4xl mb-3">👋</div>
            <div className="text-gray-600 font-bold text-lg">
              대화를 시작해보세요!
            </div>
            <div className="text-gray-400 text-sm mt-1">
              거래 약속을 잡을 수 있어요.
            </div>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 (하단 고정) */}
      <div className="fixed bottom-0 left-0 right-0 md:max-w-2xl md:mx-auto bg-white border-t p-3 safe-area-pb z-20">
        <form onSubmit={sendMessage} className="flex gap-2 w-full items-center">
          {/* 3. 입력 글자: text-black 적용 */}
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-gray-100 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm text-black transition placeholder-gray-400"
            placeholder="메시지를 입력하세요..."
          />
          {/* 2. 전송 버튼: 비활성 상태도 잘 보이게 (진한 회색) */}
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 disabled:bg-gray-400 text-white rounded-full w-11 h-11 flex items-center justify-center shadow-md transition transform active:scale-95 hover:bg-blue-700"
          >
            <IoMdSend size={20} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
