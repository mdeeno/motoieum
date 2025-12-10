// web/app/write/page.tsx
'use client';

import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function WritePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null); // 선택된 이미지 파일
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // 파일 선택창 제어용
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return alert('제목과 내용을 모두 입력해주세요.');

    setIsLoading(true);

    try {
      let imageUrl = null;

      // 1. 이미지가 선택되었다면 Supabase Storage에 업로드
      if (image) {
        const fileName = `${Date.now()}_${image.name}`; // 파일명 중복 방지 (시간_파일명)
        const { data, error: uploadError } = await supabase.storage
          .from('images') // 아까 만든 버킷 이름
          .upload(fileName, image);

        if (uploadError) {
          console.error('이미지 업로드 실패:', uploadError);
          alert('이미지 업로드에 실패했습니다.');
          setIsLoading(false);
          return;
        }

        // 2. 업로드된 이미지의 공개 주소(URL) 가져오기
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      // 3. 글 데이터 + 이미지 주소를 DB에 저장
      const { error } = await supabase
        .from('posts')
        .insert([{ title, content, image_url: imageUrl }]);

      if (error) {
        console.error('글 저장 실패:', error);
        alert('글 저장에 실패했습니다.');
      } else {
        alert('글이 등록되었습니다! 🎉');
        router.push('/market');
      }
    } catch (err) {
      console.error(err);
      alert('알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">
        중고 거래 글쓰기
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 제목 */}
        <input
          type="text"
          placeholder="제목 (예: 혼다 슈퍼커브 팝니다)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-3 rounded-lg w-full text-black bg-white"
        />

        {/* 내용 */}
        <textarea
          placeholder="내용 (가격, 연식, 상태 등을 적어주세요)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border p-3 rounded-lg w-full h-40 text-black resize-none bg-white"
        />

        {/* 📸 사진 업로드 버튼 */}
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.length) {
                setImage(e.target.files[0]);
              }
            }}
            className="hidden" // 못생긴 기본 파일창 숨기기
            ref={fileInputRef}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 p-4 rounded-lg text-gray-500 hover:border-orange-500 hover:text-orange-500 transition text-center"
          >
            {image ? `📸 ${image.name} 선택됨` : '+ 사진 추가하기'}
          </button>
        </div>

        {/* 저장 버튼 */}
        <button
          type="submit"
          disabled={isLoading}
          className="bg-orange-500 text-white p-3 rounded-lg font-bold hover:bg-orange-600 disabled:bg-gray-400 transition"
        >
          {isLoading ? '저장 중...' : '작성 완료'}
        </button>
      </form>
    </div>
  );
}
