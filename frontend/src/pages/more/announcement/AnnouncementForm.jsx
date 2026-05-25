import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../../store/useThemeStore';
import { getAssetUrl } from '../../../utils/AssetHelper';
import { authFetch } from '../../../utils/AuthHelper';
import Header from '../../../components/common/Header';
import AnnouncementDialog from '../../../components/more/announcement/AnnouncementDialog';
import toast from 'react-hot-toast';

export default function AnnouncementForm() {
  const navigate = useNavigate();
  const { announcement_id } = useParams();
  const currentTheme = useTheme((state) => state.currentTheme);

  // announcement_id가 있으면 수정, 없으면 작성
  const mode = announcement_id ? 'edit' : 'create';

  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(false);

  // 수정 모드일 때 기존 데이터 불러오기
  const fetchAnnouncement = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/announcements/${announcement_id}/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('데이터를 가져오지 못했습니다.');

      const data = await response.json();
      setAnnouncement(data);
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async ({ title, content, category }) => {
    if (!title || !content) {
      toast("제목과 내용은 필수입니다", {});
      return;
    }

    try {
      const url = mode === 'edit'
        ? `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/announcements/${announcement_id}/`
        : `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/announcements/`;

      const data = await authFetch(url, {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        body: JSON.stringify({ title, content, category }),
      });
      // 작성/수정 완료 후 상세 페이지로 이동 시 히스토리 스택 교체
      navigate(`/more/announcement/detail/${data.announcement_id}`, { replace: true });
    } catch (error) {
      console.error('Submit Error:', error);
    }
  };

  useEffect(() => {
    if (mode === 'edit') fetchAnnouncement();
  }, []);

  return (
    <div
      className="w-full h-full overflow-hidden flex flex-col pt-[16%]"
      style={{
        backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})`,
        backgroundSize: '100% 100%',
      }}
    >
      <Header title={mode === 'edit' ? '수정' : '작성'} />

      <div className="flex-1 flex flex-col items-center px-[2.5%] pt-[4%]">
        {/* 수정 모드일 때 데이터 로딩 후 렌더링 */}
        {mode === 'create' || (mode === 'edit' && announcement) ? (
          <AnnouncementDialog
            mode={mode}
            title={announcement?.title}
            content={announcement?.content}
            category={announcement?.category}
            onSubmit={handleSubmit}
            currentTheme={currentTheme}
          />
        ) : (
          <div className="flex justify-center mt-[50%] text-3xl text-gray-600 font-bold animate-bounce">
            불러오는 중...
          </div>
        )}
      </div>
    </div>
  );
}