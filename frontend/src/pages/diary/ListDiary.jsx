import { useState, useEffect } from 'react';
import { useTheme } from '../../store/useThemeStore';
import { getAssetUrl } from "../../utils/AssetHelper";
import { formatDisplayDate } from '../../utils/DateFormatter';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/SupabaseClient';
import ListDiaryItem from '../../components/diary/ListDiaryItem';

// 일기 목록 화면 diary/ListGallery.jsx
export default function ListDiary() {
    // 경로 이동 훅
    const navigate = useNavigate();

    // 현재 테마
    const currentTheme = useTheme((state) => state.currentTheme);

    // 실제 데이터를 담을 [상태] 일기 데이터, 데이터 로딩
    const [diaries, setDiaries] = useState([]);
    const [loading, setLoading] = useState(true);

    // 일기 목록 조회 API 호출 함수
    const fetchDiaries = async () => {
        try {
            setLoading(true);

            // supabase에서 현재 로그인된 세션의 access토큰 가져오기
            const { data: { session } } = await supabase.auth.getSession();
            const access_token = session?.access_token;

            //  Promise.all을 사용하여 병렬 처리
            // [API 호출, 최소 대기 시간] 두 가지를 동시에 시작
            const [response] = await Promise.all([
                fetch(`${import.meta.env.VITE_BACKEND_URL}api/v1/diaries/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${access_token}`
                    }
                }),
                // 무조건 1초(1000ms)는 기다림
                new Promise(resolve => setTimeout(resolve, 1000))
            ]);

            if (!response.ok) {
                // HTML이 오더라도 텍스트로 읽어서 에러를 파악합니다.
                const errorBody = await response.text(); 
                console.error(`서버 응답 에러 (${response.status}):`, errorBody);
                throw new Error('서버에서 데이터를 가져오지 못했습니다.');
            }

            const data = await response.json();
            setDiaries(data.diaries || []);
        } catch (error) {
            console.error('Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    // 컴포넌트 마운트 시 실행
    useEffect(() => {
        fetchDiaries();
    }, []);

    return (
        <div
            className="w-full h-screen overflow-hidden flex flex-col"
            style={{
                backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'background_x3')})`,
                backgroundSize: '100% 100%',
            }}
        >
            <div className='flex-1 overflow-y-auto no-scrollbar pb-[120%]'>
                {loading ? (
                    <div className="flex justify-center mt-[50%] text-3xl text-[#4A4A4A] font-bold animate-bounce">일기를 불러오는 중...</div>
                ) : (
                    /* 3열 그리드 설정 */
                    < div 
                        className="grid grid-cols-3 gap-x-[3%] gap-y-[4%] p-[2%] items-start"
                        style={{ gridAutoRows: 'min-content'}}>
                        {diaries.map((diary) => (
                            <ListDiaryItem // diary/ListDiaryItem 컴포넌트 사용
                                key={diary.diary_id}
                                // imageUrl={image_url} 현재 일기 목록 조회 API에서는 response값에 포함X 
                                currentTheme={currentTheme}
                                date={formatDisplayDate(diary.created_at)}
                                onClick={() => navigate(`/diary/${diary.created_at.split('T')[0]}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}