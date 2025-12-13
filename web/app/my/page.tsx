// web/app/my/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
// 아이콘
import { IoMdArrowBack, IoMdSettings, IoMdLogOut } from 'react-icons/io';
import {
  FaHeart,
  FaRegCommentDots,
  FaList,
  FaMotorcycle,
  FaComments,
} from 'react-icons/fa';

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        router.push('/login');
        return;
      }
      setUser(user);

      // ✅ 내가 쓴 글 가져오기 (좋아요, 댓글 개수 포함)
      // likes(count), comments(count)를 쓰면 개수만 가져올 수 있습니다.
      const { data, error } = await supabase
        .from('posts')
        .select(
          `
          *,
          likes(count),
          comments(count)
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('데이터 로딩 에러:', error);
        // 에러 발생 시(관계 설정 안됨 등) 기본 글만이라도 가져오기 시도
        const { data: backupData } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setMyPosts(backupData || []);
      } else {
        setMyPosts(data || []);
      }

      setLoading(false);
    };
    getData();
  }, []);

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await supabase.auth.signOut();
      router.push('/market');
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        로딩 중...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 mx-auto md:max-w-2xl shadow-xl">
      {/* 헤더 */}
      <header className="bg-white p-4 flex items-center justify-between sticky top-0 border-b z-10">
        <button
          onClick={() => router.back()}
          className="text-2xl hover:bg-gray-100 p-2 rounded-full transition"
        >
          <IoMdArrowBack />
        </button>
        <h1 className="font-bold text-lg">내 정보</h1>
        <button className="text-2xl text-gray-400 hover:text-gray-600 p-2">
          <IoMdSettings />
        </button>
      </header>

      <div className="p-5">
        {/* 1. 프로필 카드 */}
        <div className="flex items-center gap-5 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full overflow-hidden border-2 border-white shadow-md">
            <img
              src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.id}`}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-bold text-xl text-gray-900 mb-1">
              {user?.email?.split('@')[0]}님
            </h2>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full font-bold">
                LV.1 라이더
              </span>
              <p className="text-gray-400 text-xs">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* 2. 메뉴 탭 */}
        <div className="flex items-center gap-2 mb-4">
          <FaList className="text-blue-600" />
          <h3 className="font-bold text-lg text-gray-800">
            내 활동 내역 ({myPosts.length})
          </h3>
        </div>

        {/* 3. 리스트 영역 */}
        <div className="space-y-4">
          {myPosts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-400 mb-2">작성한 글이 없어요.</p>
              <button
                onClick={() => router.push('/write')}
                className="text-blue-600 font-bold text-sm hover:underline"
              >
                첫 글 쓰러 가기
              </button>
            </div>
          ) : (
            myPosts.map((post) => {
              // 좋아요/댓글 수 안전하게 가져오기 (배열 형태임)
              const likeCount = post.likes ? post.likes[0]?.count : 0;
              const commentCount = post.comments ? post.comments[0]?.count : 0;
              const isCommunity = post.category === 'community';

              return (
                <div
                  key={post.id}
                  onClick={() => router.push(`/market/${post.id}`)}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-4 cursor-pointer hover:shadow-md transition active:scale-[0.98]"
                >
                  {/* 썸네일 영역: 커뮤니티글이면서 이미지가 없으면 아이콘 표시 */}
                  <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative flex items-center justify-center">
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-300 text-2xl">
                        {isCommunity ? <FaComments /> : <FaMotorcycle />}
                      </div>
                    )}
                  </div>

                  {/* 내용 영역 */}
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    {/* 뱃지 표시 */}
                    <div className="flex items-center gap-2 mb-1">
                      {isCommunity ? (
                        <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-bold">
                          커뮤니티
                        </span>
                      ) : (
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">
                          장터
                        </span>
                      )}
                      <span className="text-xs text-gray-400 line-clamp-1">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-900 line-clamp-1 text-base mb-1">
                      {post.title}
                    </h4>

                    {/* ✅ 여기가 핵심 수정 사항 */}
                    {isCommunity ? (
                      // 🟢 커뮤니티 글일 때: 좋아요/댓글 수 표시
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <FaHeart className="text-red-400" /> {likeCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaRegCommentDots className="text-blue-400" />{' '}
                          {commentCount || 0}
                        </span>
                      </div>
                    ) : (
                      // 🔵 장터 글일 때: 가격 표시
                      <p className="font-extrabold text-black text-lg">
                        {post.price
                          ? `${post.price.toLocaleString()}원`
                          : '가격제안'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. 하단 로그아웃 버튼 */}
        <div className="mt-10 border-t pt-6">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-3 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition font-medium"
          >
            <IoMdLogOut size={20} />
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
