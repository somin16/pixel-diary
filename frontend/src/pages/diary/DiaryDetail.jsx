import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import DetailDiaryDialog from "../../components/diary/DetailDiaryDialog";
import { useTheme } from "../../store/useThemeStore";
import { getAssetUrl } from "../../utils/AssetHelper";

/**
 * 일기 상세보기 페이지
 * mode="view" 고정 — 수정/삭제는 DetailDiaryDialog 내부 메뉴에서 처리
 */
export default function DiaryDetail() {

    const navigate = useNavigate();
    const currentTheme = useTheme((state) => state.currentTheme);

    // [상태]
    const [diaryData, setDiaryData] = useState({
        date: "",
        content: "",
        imageUrl: "",
        emoji: ""
    });

    // 데이터 로드 로직 (나중에 이 부분을 Supabase SELECT 문으로 교체)
    useEffect(() => {

        // --- 나중에 이 부분을 Supabase 연동 코드로 바꾸기 ---
        const fetchDiary = () => {
            // 지금은 더미 데이터를 상태에 넣습니다.
            setDiaryData({
                date: "2026-05-02",
                content: '오늘은 펭귄들과 함께 일기 앱을 만들었다. 에러 때문에 고생했지만 열심히 해결했다! 내일은 더 열심히 만들어야지. ❤️🩷🧡💛💚💙🩵💜🤎🖤🩶🤍💔❤️‍🔥❤️‍🩹❣️💕💞💓💗💖💘💝',
                imageUrl: 'https://zrrizmmqdgfjmnejaqkt.supabase.co/storage/v1/object/public/diary-images/diary_5ccb34ef-2fb5-4861-8b5e-fbb1c11e6bfd.png',
            });
        };
        fetchDiary();
    }, []);

    function handleClose() {
        navigate('/', { replace: true }); // 홈화면으로 이동, 뒤로가기 불가능
    }

    return (
        <div
            className="relative w-full h-full overflow-hidden"
            style={{
                backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'background_x3')})`,
                backgroundSize: '100% 100%',
            }}
        >
            {/* 배경 블러 오버레이 */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />

            <DetailDiaryDialog
                currentTheme={currentTheme}
                mode="view"
                date={diaryData.date}
                imageUrl={diaryData.imageUrl}
                content={diaryData.content}
                emoji={diaryData.emoji}
                frame={diaryData.frame}
                stickers={diaryData.stickers}
                onClose={handleClose}
            />
        </div>
    );
}