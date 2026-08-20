import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import DetailDiaryDialog from "../../components/diary/DetailDiaryDialog";
import { useTheme } from "../../stores/useThemeStore";
import { getAssetUrl } from "../../utils/AssetHelper";
import { useDiaryDetail } from "../../hooks/queries/useDiaryQueries";

export default function DiaryDetail() {
  const navigate = useNavigate(); // 페이지 이동을 도와주는 도구
  const location = useLocation(); // 현재 페이지에 전달된 정보를 가져오는 도구
  const currentTheme = useTheme((state) => state.currentTheme); // 현재 설정된 테마 (겨울, 여름 등)

  // 이전 페이지(목록 등)에서 전달해준 '일기 고유 번호'를 가져옵니다.
  const diaryId = location.state?.diaryId;

  // 볼 일기의 번호(ID)가 없다면, 메인 화면으로 쫓아냅니다.
  useEffect(() => {
    if (!diaryId) navigate("/", { replace: true });
  }, [diaryId, navigate]);

  // ── [상태] 서버에서 받아온 일기 데이터 (React Query 캐시) ─────────────────
  const { data, isLoading, isError, refetch } = useDiaryDetail(diaryId);

  // 서버 응답을 화면에서 쓰기 좋은 형태로 변환
  const diaryData = {
    date: data?.created_at?.split("T")[0] ?? "", // 날짜 형식 정리 (예: 2024-03-21)
    content: data?.content ?? "",
    imageUrl: data?.image_url ?? "",

    selectedEmoji: data?.emotion_item?.image_url ?? null,
    selectedFrame: data?.theme_item?.image_url ?? null,

    // 스티커들은 여러 개일 수 있으니 목록을 하나씩 돌면서 변환합니다.
    stickers: (data?.sticker ?? []).map((s, i) => ({
      id: s.item_id,
      img: s.image_url ?? '',
      instanceId: `${s.item_id}-${i}`,    // 화면에서 구분하기 위한 고유 키 (렌더 중 Date.now() 호출 금지라 결정론적 값 사용)
      x: s.pos_x ?? null,                 // 저장된 가로 위치
      y: s.pos_y ?? null,                 // 저장된 세로 위치
    })),
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

  // diaryId가 없는 동안은(위 useEffect가 리다이렉트 처리 중) 아무것도 그리지 않음
  if (!diaryId) return null;

  // ── [화면 1] 데이터를 불러오는 동안 보여주는 화면 (로딩중) ────────────────────
  if (isLoading) {
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
  if (isError) {
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
          <span className="text-white text-lg">일기를 불러오지 못했습니다.</span>
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
        onRefresh={refetch}
      />
    </div>
  );
}
