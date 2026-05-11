import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../../store/useThemeStore';
import { getAssetUrl } from '../../../utils/AssetHelper';
import { formatDisplayDate } from '../../../utils/DateFormatter';
import { supabase } from '../../../utils/SupabaseClient';

import Header from '../../../components/common/Header';
import AnnouncementDialog from '../../../components/more/announcement/AnnouncementDialog';

export default function AnnouncementDetail() {

    const navigate = useNavigate();

    const currentTheme = useTheme((state) => state.currentTheme);

    const { announcement_id } = useParams();
    const [announcement, setAnnouncement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);

            const [{ data: { session } }, response] = await Promise.all([
                supabase.auth.getSession(),
                fetch(`${import.meta.env.VITE_BACKEND_URL}api/v1/announcements/${announcement_id}/`, {
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
            setAnnouncement(data);
        } catch (error) {
            console.error('Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            // 삭제 전 확인
            if (!window.confirm('공지사항을 삭제하시겠습니까?')) return;

            const { data: { session } } = await supabase.auth.getSession();
            const access_token = session?.access_token;

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}api/v1/admin/announcements/${announcement_id}/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                },
            });

            if (!response.ok) throw new Error('삭제 중 오류가 발생했습니다.');

            // 삭제 성공 시 목록으로 이동
            navigate('/more/announcement/list');
        } catch (error) {
            console.error('Delete Error:', error);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

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
            />
            {loading ? (
                <div className="flex justify-center h-[10%] mt-[50%] text-3xl text-gray-600 font-bold animate-bounce">
                    불러오는 중...
                </div>
            ) : (
                <div className='w-[95%]'>
                    {!loading && announcement && (
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