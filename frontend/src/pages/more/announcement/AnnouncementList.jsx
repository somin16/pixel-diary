import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../store/useThemeStore';
import { getAssetUrl } from '../../../utils/AssetHelper';
import { formatDisplayDate } from '../../../utils/DateFormatter';
import { supabase } from '../../../utils/SupabaseClient';
import AnnouncementCard from '../../../components/more/announcement/AnnouncementCard';
import FloatingActionButton from '../../../components/home/FloatingActionButton';
import Header from '../../../components/common/Header';

export default function AnnouncementList() {
  const navigate = useNavigate();
  const currentTheme = useTheme((state) => state.currentTheme);

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);

      const [{ data: { session } }, response] = await Promise.all([
        supabase.auth.getSession(),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/announcements/`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      ]);

      const role = session?.user?.user_metadata?.role;
      setIsAdmin(role === 'admin');

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`서버 응답 에러 (${response.status}):`, errorBody);
        throw new Error('서버에서 데이터를 가져오지 못했습니다.');
      }

      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
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
        {loading ? (
          <div className="flex h-[10%] justify-center mt-[50%] text-3xl text-gray-600 font-bold animate-bounce">
            불러오는 중...
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
            onClick={() => navigate("/more/announcement/write")}
          />
        </div>
      )}
    </div>
  );
}