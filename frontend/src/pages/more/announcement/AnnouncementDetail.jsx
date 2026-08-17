import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../../stores/useThemeStore';
import { getAssetUrl } from '../../../utils/AssetHelper';
import { formatDisplayDate } from '../../../utils/DateFormatter';
import { supabase } from '../../../utils/SupabaseClient';
import { useAnnouncementDetail } from '../../../hooks/queries/useAnnouncementQueries';
import { useDeleteAnnouncement } from '../../../hooks/queries/useAdminQueries';

import Header from '../../../components/common/Header';
import AnnouncementDialog from '../../../components/more/announcement/AnnouncementDialog';

export default function AnnouncementDetail() {

  const navigate = useNavigate();
  const currentTheme = useTheme((state) => state.currentTheme);
  const { announcement_id } = useParams();

  // 기존 useState(announcement), useState(loading), fetchAnnouncements, useEffect 제거하고 이 한 줄로 대체
  const { data: announcement, isLoading, isError } = useAnnouncementDetail(announcement_id);
  const deleteAnnouncement = useDeleteAnnouncement(); // mutation 추가

  // isAdmin은 공지 API 응답이 아니라 세션 정보라 그대로 유지
  const [isAdmin, setIsAdmin] = useState(false);
   useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const role = session?.user?.user_metadata?.role;
      setIsAdmin(role === 'admin');
    });
  }, []);

  const handleDelete = () => {
    if (!window.confirm('공지사항을 삭제하시겠습니까?')) return;
    deleteAnnouncement.mutate(
      { announcementId: announcement_id },
      { onSuccess: () => navigate('/more/announcement/list') }
    );
  };

  return (
    <div
      className="w-full h-full overflow-hidden flex flex-col pt-[16%] items-center"
      style={{
        backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})`,
        backgroundSize: '100% 100%',
      }}
    >
      <Header
        title="공지사항"
        backPath="/more/announcement/list"
      />
      {isLoading ? (
        <div className="flex justify-center h-[10%] mt-[50%] text-3xl text-gray-600 font-bold animate-bounce">
          불러오는 중...
        </div>
      ) : isError ? (
        <div className='flex justify-center mt-[50%] text-sm text-gray-500 font-bold'>
          공지사항을 불러오지 못했습니다
        </div>
      ) : (
        <div className='w-[95%]'>
          { announcement && (
            <AnnouncementDialog
              title={announcement.title}
              content={announcement.content}
              category={announcement.category}
              date={formatDisplayDate(announcement.updated_at || announcement.created_at)}
              viewCount={announcement.view_count}
              isAdmin={isAdmin}
              onEdit={() => navigate(`/more/announcement/edit/${announcement_id}`)}
              onDelete={handleDelete}
              currentTheme={currentTheme}
            />
          )}
        </div>
      )}
    </div>
  );

}