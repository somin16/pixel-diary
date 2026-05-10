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

            // 관리자 여부 확인
            const { data: { session } } = await supabase.auth.getSession();
            const role = session?.user?.user_metadata?.role;
            setIsAdmin(role === 'admin');

            // 공지사항 목록 조회 (토큰 불필요)
            const [response] = await Promise.all([
                fetch(`${import.meta.env.VITE_BACKEND_URL}api/v1/announcements/`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                }),
                // 무조건 1초(1000ms)는 기다림
                new Promise(resolve => setTimeout(resolve, 1000))
            ]);

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
            />

            {/* 목록 */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-[2%] pb-[30%]">
                {loading ? (
                    <div className="flex justify-center mt-[50%] text-xl text-gray-600 font-bold animate-bounce">
                        불러오는 중...
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {announcements.map((announcement) => (
                            <AnnouncementCard
                                key={announcement.announcement_id}
                                title={announcement.title}
                                contentPreview={announcement.content_preview}
                                category={announcement.category}
                                date={formatDisplayDate(announcement.created_at)}
                                viewCount={announcement.view_count}
                                onClick={() => navigate(`/announcement/${announcement.announcement_id}`)}
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
                    onClick={() => navigate("/announcement/create")}
                />
                </div>
            )}
        </div>
    );
}