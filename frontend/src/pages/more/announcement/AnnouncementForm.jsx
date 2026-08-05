import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../../stores/useThemeStore';
import { getAssetUrl } from '../../../utils/AssetHelper';
import { useAnnouncementDetail } from '../../../hooks/queries/useAnnouncementQueries';
import { useCreateAnnouncement, useUpdateAnnouncement } from '../../../hooks/queries/useAdminQueries';

import Header from '../../../components/common/Header';
import AnnouncementDialog from '../../../components/more/announcement/AnnouncementDialog';
import toast from 'react-hot-toast';

export default function AnnouncementForm() {
  const navigate = useNavigate();
  const { announcement_id } = useParams();
  const currentTheme = useTheme((state) => state.currentTheme);

  // announcement_id가 있으면 수정, 없으면 작성
  const mode = announcement_id ? 'edit' : 'create';

  const { data: announcement, isLoading } = useAnnouncementDetail(mode === 'edit' ? announcement_id : undefined);
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement(announcement_id);

  // useAnnouncementDetail이 enabled 옵션으로 mode==='edit'일 때만 자동으로 불러옴

  const handleSubmit = ({ title, content, category }) => {
    if (!title || !content) {
      toast("제목과 내용은 필수입니다", {});
      return;
    }
    if (mode === 'edit') {
      updateAnnouncement.mutate(
        { title, content, category },
        {onSuccess: (data) => navigate(`/more/announcement/detail/${data.announcement_id}`, {replace: true})}
      );
    } else {
      createAnnouncement.mutate(
        { title, content, category },
        {onSuccess: (data) => navigate(`/more/announcement/detail/${data.announcement_id}`, { replace: true })}
      );
    }
  };

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
        {mode === 'create' || (mode === 'edit' && !isLoading && announcement) ? (
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