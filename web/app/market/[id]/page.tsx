// web/app/market/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
// 아이콘
import {
  FaHeart,
  FaRegHeart,
  FaRegCommentDots,
  FaThumbsUp,
  FaRegThumbsUp,
  FaThumbsDown,
  FaRegThumbsDown,
  FaCamera,
  FaArrowUp,
} from 'react-icons/fa';
import { MdReportProblem } from 'react-icons/md';
import { IoMdHome, IoMdArrowBack } from 'react-icons/io';
import { FiShare2 } from 'react-icons/fi';

export default function MarketDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [post, setPost] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 장터용 상태
  const [isLiked, setIsLiked] = useState(false);

  // 커뮤니티용 상태
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [myReaction, setMyReaction] = useState<'like' | 'dislike' | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        // [수정 1] profiles 조인을 제거하고 post만 먼저 가져옵니다 (400 에러 방지)
        const postReq = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single();

        const userReq = await supabase.auth.getUser();

        if (postReq.error) throw postReq.error;

        // [수정 2] 닉네임을 가져오기 위해 profiles를 따로 조회합니다 (수동 연결)
        let profileData = null;
        if (postReq.data?.user_id) {
          const { data } = await supabase
            .from('profiles')
            .select('nickname')
            .eq('id', postReq.data.user_id)
            .single();
          profileData = data;
        }

        // 데이터 합치기
        const finalPost = {
          ...postReq.data,
          profiles: profileData, // profiles 객체를 수동으로 넣어줌
        };

        setPost(finalPost);
        const user = userReq.data.user;
        setCurrentUser(user);

        // 추가 데이터 로딩
        if (finalPost) {
          if (finalPost.category === 'community') {
            const [likes, dislikes, commentsData] = await Promise.all([
              supabase
                .from('likes')
                .select('*', { count: 'exact' })
                .eq('post_id', id),
              supabase
                .from('dislikes')
                .select('*', { count: 'exact' })
                .eq('post_id', id),
              // [수정 3] 댓글도 profiles 조인 제거 (에러 방지)
              supabase
                .from('comments')
                .select('*')
                .eq('post_id', id)
                .order('created_at', { ascending: true }),
            ]);

            setLikeCount(likes.count || 0);
            setDislikeCount(dislikes.count || 0);

            // [수정 4] 댓글 작성자 닉네임 따로 매핑 (간단하게 구현)
            // 실제 서비스에서는 DB Foreign Key를 거는 게 좋습니다.
            // 지금은 에러 방지를 위해 닉네임 없이 보여주거나 기본값 처리
            const safeComments = commentsData.data || [];
            setComments(safeComments);

            if (user) {
              const myLike = likes.data?.find(
                (l: any) => l.user_id === user.id
              );
              const myDislike = dislikes.data?.find(
                (d: any) => d.user_id === user.id
              );
              if (myLike) setMyReaction('like');
              else if (myDislike) setMyReaction('dislike');
            }
          } else {
            // 장터 데이터 로딩
            if (user) {
              const { data: like } = await supabase
                .from('likes')
                .select('*')
                .eq('user_id', user.id)
                .eq('post_id', id)
                .single();
              setIsLiked(!!like);
            }
          }
        }
      } catch (error: any) {
        console.error('데이터 로딩 실패:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // 공통 기능
  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) {
      alert('삭제되었습니다!');
      router.push('/market');
    }
  };
  const handleEdit = () => router.push(`/edit/${id}`);

  const handleReport = async () => {
    if (!currentUser) return alert('로그인이 필요합니다!');
    if (confirm('이 게시글을 신고하시겠습니까?')) {
      await supabase
        .from('reports')
        .insert([
          { user_id: currentUser.id, post_id: id, reason: '사용자 신고' },
        ]);
      alert('신고가 접수되었습니다. 관리자가 검토하겠습니다.');
    }
  };

  // 장터: 찜하기
  const toggleHeart = async () => {
    if (!currentUser) return alert('로그인이 필요합니다!');
    const previousState = isLiked;
    setIsLiked(!previousState);
    if (previousState)
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('post_id', id);
    else
      await supabase
        .from('likes')
        .insert([{ user_id: currentUser.id, post_id: id }]);
  };

  // 커뮤니티: 좋아요/싫어요 로직
  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!currentUser) return alert('로그인이 필요합니다!');

    if (myReaction === type) {
      if (type === 'like') {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('post_id', id);
        setLikeCount((prev) => prev - 1);
      } else {
        await supabase
          .from('dislikes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('post_id', id);
        setDislikeCount((prev) => prev - 1);
      }
      setMyReaction(null);
    } else {
      if (myReaction === 'like') {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('post_id', id);
        setLikeCount((prev) => prev - 1);
      } else if (myReaction === 'dislike') {
        await supabase
          .from('dislikes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('post_id', id);
        setDislikeCount((prev) => prev - 1);
      }

      if (type === 'like') {
        await supabase
          .from('likes')
          .insert([{ user_id: currentUser.id, post_id: id }]);
        setLikeCount((prev) => prev + 1);
      } else {
        await supabase
          .from('dislikes')
          .insert([{ user_id: currentUser.id, post_id: id }]);
        setDislikeCount((prev) => prev + 1);
      }
      setMyReaction(type);
    }
  };

  // 커뮤니티: 댓글
  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert('로그인이 필요합니다!');
    if (!newComment.trim()) return;

    const { error } = await supabase
      .from('comments')
      .insert([{ user_id: currentUser.id, post_id: id, content: newComment }]);
    if (!error) {
      setNewComment('');
      window.location.reload();
    }
  };

  // 장터: 채팅
  const startChat = async () => {
    if (!currentUser) return alert('로그인이 필요합니다!');
    if (currentUser.id === post.user_id) return alert('본인 물건입니다.');
    try {
      const { data: room } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('post_id', id)
        .eq('buyer_id', currentUser.id)
        .single();
      if (room) router.push(`/chat/${room.id}`);
      else {
        const { data: newRoom } = await supabase
          .from('chat_rooms')
          .insert([
            { post_id: id, buyer_id: currentUser.id, seller_id: post.user_id },
          ])
          .select()
          .single();
        router.push(`/chat/${newRoom.id}`);
      }
    } catch (err: any) {
      if (err.code !== 'PGRST116') alert(`오류: ${err.message}`);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        로딩 중...
      </div>
    );
  if (!post)
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        글을 찾을 수 없습니다. (ID 확인 필요)
      </div>
    );

  const isMyPost = currentUser?.id === post.user_id;
  const isCommunity = post.category === 'community';

  return (
    <div className="min-h-screen bg-white pb-24 mx-auto md:max-w-2xl shadow-xl relative">
      {/* 🟢 헤더 */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-sm border-b z-50 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1">
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
        </div>

        <h1 className="font-bold text-lg absolute left-1/2 transform -translate-x-1/2">
          {isCommunity ? '질문 / 답변' : '상품 상세'}
        </h1>

        <div className="flex items-center gap-1">
          {isMyPost && (
            <>
              <button
                onClick={handleEdit}
                className="text-blue-600 text-sm font-bold px-2 py-1 hover:bg-blue-50 rounded-lg"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                className="text-red-600 text-sm font-bold px-2 py-1 hover:bg-red-50 rounded-lg"
              >
                삭제
              </button>
            </>
          )}
          {isCommunity && (
            <button className="p-2 text-xl text-gray-600">
              <FiShare2 />
            </button>
          )}
        </div>
      </header>

      {/* 🗣️ [커뮤니티 UI] */}
      {isCommunity ? (
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
              <img
                src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${post.user_id}`}
                alt="avatar"
              />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900 flex items-center gap-1">
                {/* 닉네임이 없으면 '익명의 라이더'로 표시 */}
                {post.profiles?.nickname || '익명의 라이더'}
                <span className="text-xs text-gray-400 font-normal">
                  · {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="text-xs text-gray-500">LV.1 라이더</div>
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h1>
          <div className="text-gray-800 leading-relaxed min-h-[60px] whitespace-pre-line text-base mb-6">
            {post.content}
          </div>

          {post.image_url && (
            <div className="rounded-xl overflow-hidden mb-6 border border-gray-100">
              <img src={post.image_url} className="w-full object-cover" />
            </div>
          )}

          <div className="flex items-center gap-4 text-gray-500 text-sm border-b pb-4 mb-4">
            <button
              onClick={() => handleReaction('like')}
              className={`flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded-lg transition ${
                myReaction === 'like' ? 'text-blue-600 font-bold' : ''
              }`}
            >
              {myReaction === 'like' ? <FaThumbsUp /> : <FaRegThumbsUp />}
              <span>{likeCount}</span>
            </button>
            <button
              onClick={() => handleReaction('dislike')}
              className={`flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded-lg transition ${
                myReaction === 'dislike' ? 'text-red-500 font-bold' : ''
              }`}
            >
              {myReaction === 'dislike' ? (
                <FaThumbsDown />
              ) : (
                <FaRegThumbsDown />
              )}
              <span>{dislikeCount}</span>
            </button>
            <div className="flex items-center gap-1 px-2 py-1">
              <FaRegCommentDots />
              <span>{comments.length}</span>
            </div>
            <div className="flex-1"></div>
            <button
              onClick={handleReport}
              className="text-gray-400 hover:text-red-500 px-2 py-1"
            >
              <MdReportProblem size={18} />
            </button>
          </div>

          {/* 댓글 리스트 */}
          <div className="space-y-5 pb-20">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full overflow-hidden shrink-0 border border-gray-200">
                  <img
                    src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${c.user_id}`}
                    alt="avatar"
                  />
                </div>
                <div className="flex-1 bg-gray-50 p-3 rounded-xl rounded-tl-none border border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-gray-700">
                      {c.profiles?.nickname || '익명의 유저'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{c.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="fixed bottom-0 left-0 right-0 mx-auto md:max-w-2xl bg-white border-t p-3 safe-area-pb z-50">
            <form onSubmit={submitComment} className="flex items-center gap-3">
              <button
                type="button"
                className="text-gray-400 text-xl p-1 hover:text-blue-600 transition"
              >
                <FaCamera />
              </button>
              <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="댓글을 남겨보세요."
                  className="bg-transparent w-full text-sm focus:outline-none placeholder-gray-400 text-black"
                />
              </div>
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="bg-gray-200 text-gray-500 rounded-full w-9 h-9 flex items-center justify-center transition hover:bg-blue-600 hover:text-white disabled:bg-gray-100 disabled:text-gray-300"
              >
                <FaArrowUp />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* 🛒 [장터 UI] */
        <>
          <div className="w-full h-[40vh] bg-gray-100 flex items-center justify-center overflow-hidden">
            {post.image_url ? (
              <img
                src={post.image_url}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 font-bold">이미지 없음</div>
            )}
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl">
                🏍️
              </div>
              <div>
                <div className="font-bold text-gray-900">
                  {/* 장터 글쓴이 닉네임 */}
                  {post.profiles?.nickname || '익명의 판매자'}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(post.created_at).toLocaleDateString()} 작성
                </div>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            <div className="text-gray-800 leading-relaxed min-h-[100px] whitespace-pre-line text-base">
              {post.content}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 mx-auto md:max-w-2xl bg-white border-t p-4 safe-area-pb z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-5 pl-2">
                <button
                  onClick={toggleHeart}
                  className={`text-3xl transition transform active:scale-75 ${
                    isLiked
                      ? 'text-red-500 drop-shadow-sm'
                      : 'text-gray-400 hover:text-gray-500'
                  }`}
                >
                  {isLiked ? <FaHeart /> : <FaRegHeart />}
                </button>
                <div className="border-l-2 pl-5 h-10 flex flex-col justify-center">
                  <span className="text-xs text-gray-500 font-bold mb-0.5">
                    판매 가격
                  </span>
                  <span className="font-extrabold text-xl text-gray-900 leading-none">
                    {post.price
                      ? `${post.price.toLocaleString()}원`
                      : '가격 제안'}
                  </span>
                </div>
              </div>
              <button
                onClick={startChat}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:shadow-blue-300 active:scale-95 transition-all"
              >
                채팅하기
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
