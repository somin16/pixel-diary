import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import DetailDiaryDialog from "../../components/diary/DetailDiaryDialog";
import { useTheme } from "../../store/useThemeStore";
import { getAssetUrl, ITEM_IMG_MAP } from "../../utils/AssetHelper";
import { authFetch } from "../../utils/AuthHelper";

export default function DiaryDetail() {
    const navigate = useNavigate(); // 페이지 이동을 도와주는 도구
    const location = useLocation(); // 현재 페이지에 전달된 정보를 가져오는 도구
    const currentTheme = useTheme((state) => state.currentTheme); // 현재 설정된 테마 (겨울, 여름 등)

    // 이전 페이지(목록 등)에서 전달해준 '일기 고유 번호'를 가져옵니다.
    const diaryId = location.state?.diaryId;

    // ── [상태 변수] 화면에 보여줄 일기 데이터를 담아두는 바구니 ──────────────────
    const [diaryData, setDiaryData] = useState({
        date: "",          // 날짜
        content: "",       // 일기 내용
        imageUrl: "",      // AI가 그려준 그림 주소
        selectedEmoji: null,  // 선택했던 이모지
        selectedFrame: null,  // 선택했던 액자
        stickers: [],      // 붙여놓은 스티커들
    });
    const [loading, setLoading] = useState(true); // 데이터를 가져오는 중인지 확인하는 상태
    const [error, setError] = useState(null);     // 에러가 발생했는지 확인하는 상태

    // ── [시작점] 페이지가 열리자마자 실행되는 부분 ──────────────────────────────
    useEffect(() => {
        // 만약 볼 일기의 번호(ID)가 없다면, 메인 화면으로 쫓아냅니다.
        if (!diaryId) {
            navigate("/", { replace: true });
            return;
        }
        // 번호가 있다면 서버에 일기 데이터를 달라고 요청합니다.
        fetchDiary();
    }, [diaryId]);

    // ── [기능] 서버에서 일기 데이터를 가져오는 함수 ─────────────────────────────
    const fetchDiary = async () => {
        try {
            setLoading(true); // "로딩 시작!"
            const data = await authFetch(
                `${import.meta.env.VITE_BACKEND_URL}api/v1/diaries/${diaryId}/`
            );

            // 4. 받아온 데이터를 우리 화면에 맞게 변환해서 바구니(state)에 담습니다.
            setDiaryData({
                date: data.created_at?.split("T")[0] ?? "", // 날짜 형식 정리 (예: 2024-03-21)
                content: data.content ?? "",
                imageUrl: data.image_url ?? "",

                // [변환] 서버의 숫자 ID를 위에서 만든 '지도(ITEM_IMG_MAP)'를 보고 파일명으로 바꿉니다.
                selectedEmoji: data.emotion_item
                    ? ITEM_IMG_MAP[data.emotion_item.item_id] ?? null
                    : null,
                selectedFrame: data.theme_item
                    ? ITEM_IMG_MAP[data.theme_item.item_id] ?? null
                    : null,

                // 스티커들은 여러 개일 수 있으니 목록을 하나씩 돌면서 변환합니다.
                stickers: (data.sticker ?? []).map((s, i) => ({
                    id: s.item_id,
                    img: ITEM_IMG_MAP[s.item_id] ?? '', // 숫자 ID를 이미지 이름으로!
                    instanceId: Date.now() + i,         // 화면에서 구분하기 위한 임시 번호
                    x: s.pos_x ?? null,                 // 저장된 가로 위치
                    y: s.pos_y ?? null,                 // 저장된 세로 위치
                })),
            });
        } catch (err) {
            console.error("fetchDiary Error:", err);
            setError(err.message); // 에러가 나면 사용자에게 보여줄 메시지 저장
        } finally {
            setLoading(false); // "로딩 끝!"
        }
    };

    // 닫기 버튼을 누르면 일기 목록 페이지로 이동합니다.
    function handleClose() {
        // location.state에 fromEdit 플래그가 있으면 목록(홈)으로 바로 이동
        if (location.state?.fromEdit) {
            navigate('/', { replace: true });
        } else {
            navigate(-1);
        }
    }

    // ── [화면 1] 데이터를 불러오는 동안 보여주는 화면 (로딩중) ────────────────────
    if (loading) {
        return (
            <div
                className="relative w-full h-full overflow-hidden flex items-center justify-center"
                style={{
                    backgroundImage: `url(${getAssetUrl(currentTheme, "backgrounds", "background_x3")})`,
                    backgroundSize: "100% 100%",
                }}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
                <span className="relative z-10 text-white text-lg animate-bounce">일기를 불러오는 중...</span>
            </div>
        );
    }

    // ── [화면 2] 데이터를 가져오다 에러가 났을 때 보여주는 화면 ────────────────────
    if (error) {
        return (
            <div
                className="relative w-full h-full overflow-hidden flex items-center justify-center"
                style={{
                    backgroundImage: `url(${getAssetUrl(currentTheme, "backgrounds", "background_x3")})`,
                    backgroundSize: "100% 100%",
                }}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <span className="text-white text-lg">{error}</span>
                    <button onClick={handleClose} className="text-white underline text-sm">
                        목록으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    // ── [화면 3] 정상적으로 데이터를 가져왔을 때 보여주는 진짜 일기 화면 ────────────
    return (
        <div
            className="relative w-full h-full overflow-hidden"
            style={{
                backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'background_x3')})`,
                backgroundSize: '100% 100%',
            }}
        >
            {/* 배경을 어둡게 하고 흐리게 만드는 효과 */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />

            {/* 실제 일기장 모양의 팝업(컴포넌트)을 띄우고 데이터를 전달합니다. */}
            <DetailDiaryDialog
                currentTheme={currentTheme}
                mode="view" // "보기 모드"로 설정
                diaryId={diaryId}
                date={diaryData.date}
                imageUrl={diaryData.imageUrl}
                content={diaryData.content}
                selectedEmoji={diaryData.selectedEmoji}
                selectedFrame={diaryData.selectedFrame}
                stickers={diaryData.stickers}
                onClose={handleClose}
                onRefresh={fetchDiary}
            />
        </div>
    );
}