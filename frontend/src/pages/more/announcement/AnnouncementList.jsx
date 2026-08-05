import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../stores/useThemeStore';
import { getAssetUrl } from '../../../utils/AssetHelper';
import { formatDisplayDate } from '../../../utils/DateFormatter';
import { supabase } from '../../../utils/SupabaseClient';
import { useAnnouncements } from '../../../hooks/queries/useAnnouncementQueries';

import AnnouncementCard from '../../../components/more/announcement/AnnouncementCard';
import FloatingActionButton from '../../../components/home/FloatingActionButton';
import Header from '../../../components/common/Header';


export default function AnnouncementList() {
  const navigate = useNavigate();
  const currentTheme = useTheme((state) => state.currentTheme);

  const { data, isLoading, isError } = useAnnouncements();
  const announcements = data?.announcements || [];

  // isAdmin 체크는 React Query 대상이 아니라(공지 API 응답이 아니라 세션 정보라서) 그대로 유지
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const role = session?.user?.user_metadata?.role;
      setIsAdmin(role === 'admin');
    });
  }, []);

  return (
    <div
      className="w-full h-full overflow-hidden flex flex-col pt-[16%]"
      style={{
        backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})`,
        backgroundSize: '100% 100%',
      }}
    >
      <Header
        title="공지사항"
        backPath="/more"
      />

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex justify-center">
        {/* 기본은 10분마다 로딩, 서버에 확인해서 추가된 공지가 있을때만 다시 로딩, 한번 로딩 되면 약 10분간은 로딩X */}
        {isLoading ? (
          <div className="flex h-[10%] justify-center mt-[50%] text-3xl text-gray-600 font-bold animate-bounce">
            불러오는 중...
          </div>
        ) : isError ? (
          <div className='flex justify-center mt-[50%] text-sm text-gray-500 font-bold'>
            공지사항을 불러오지 못했습니다.
          </div>
        ) : (
          <div className="flex flex-col w-[95%]">
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.announcement_id}
                title={announcement.title}
                contentPreview={announcement.content_preview}
                category={announcement.category}
                date={formatDisplayDate(announcement.updated_at || announcement.created_at)}
                viewCount={announcement.view_count}
                onClick={() => navigate(`/more/announcement/detail/${announcement.announcement_id}`)}
                currentTheme={currentTheme}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB 버튼 : 관리자인 경우에만 FAB 버튼 표시 (공지사항 작성 페이지로 이동) */}
      {isAdmin && (
        <div className='absolute right-[5%] bottom-[5%]'>
          <FloatingActionButton
            ariaLabel='공지사항작성버튼'
            currentTheme={currentTheme}
            onClick={() => navigate("/more/announcement/write")}
          />
        </div>
      )}
    </div>
  );
}