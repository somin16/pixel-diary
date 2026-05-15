import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import DetailDiaryDialog from "../../components/diary/DetailDiaryDialog";
import { useTheme } from "../../store/useThemeStore";
import { getAssetUrl, ITEM_IMG_MAP, THEME_DEFAULT_FRAMES } from "../../utils/AssetHelper";
import ImageButton from "../../components/common/ImageButton";
import DiaryOptionSelector from "../../components/diary/DiaryOptionSelector";
import ImageZoomOverlay from "../../components/diary/ImageZoomOverlay";
import DecoPanel from "../../components/diary/DecoPanel";
import { supabase } from "../../utils/SupabaseClient";
import { authFetch } from "../../utils/AuthHelper";

/**
 * 일기 작성 / 수정 페이지
 *
 * ─ Step 흐름 ──────────────────────────────────────────────────
 *   Step 1 (Write)    → 일기 본문 작성
 *   Step 2 (Select)   → 그림 칸 클릭 시 오버레이 (그냥 그리기 vs 옵션 적용)
 *   Step 3 (Option)   → AI 스타일/키워드 선택
 *   Step 4 (Drawing)  → AI 그림 생성 중 (로딩)
 *   Step 5 (Check)    → 결과 확인 (다시 그리기 → Step 3 리턴)
 *   Step 6 (Decorate) → 꾸미기 모드 (프레임/스티커/이모지 선택)
 *   Step 7 (Finish)   → 최종 저장 후 일기 목록으로 이동
 * ──────────────────────────────────────────────────────────────
 *
 */

export default function DiaryForm() {
    const navigate = useNavigate(); // 페이지 이동을 위한 도구
    const location = useLocation(); // 현재 페이지의 주소 정보를 가져오는 도구
    const isEditMode = location.pathname.includes('edit'); // 주소에 'edit'이 있으면 수정 모드!
    const currentTheme = useTheme((state) => state.currentTheme); // 현재 앱의 테마(겨울, 여름 등)
    const today = new Date().toLocaleDateString('en-CA'); // 오늘 날짜 (YYYY-MM-DD 형식)

    const diaryDate = location.state?.diaryDate ?? null; // 수정 중이라면 일기 날짜를 받아옴
    const diaryId = location.state?.diaryId ?? null; // 수정 중이라면 일기의 고유 번호를 받아옴
    const diaryContent = location.state?.diaryContent ?? null; // 수정 중이라면 일기 내용을 받아옴

    // ── [상태 변수] 화면에서 바뀌는 모든 정보들을 저장하는 곳 ────────────────────────
    const [step, setStep] = useState(isEditMode ? 1 : 1); // 현재 몇 번째 단계인지 (수정은 1단계 부터)
    const [content, setContent] = useState(diaryContent ?? ''); // 일기 글 내용
    const [imageUrl, setImageUrl] = useState(''); // AI가 그려준 그림 주소
    const [selectedDate, setSelectedDate] = useState(diaryDate ?? today); // 선택된 날짜
    const [isGenerating, setIsGenerating] = useState(false); // AI 그림 생성 중인지 여부
    const [decoMode, setDecoMode] = useState(null); // 꾸미기 모드 (스티커/액자/이모지)
    const [isDecoOpen, setIsDecoOpen] = useState(false); // 꾸미기 창이 열렸는지 여부
    const [tags, setTags] = useState([]); // AI 그림 옵션(태그)들
    const [savedDiaryId, setSavedDiaryId] = useState(diaryId); // 저장된 일기의 ID
    const [stickers, setStickers] = useState([]); // 화면에 붙인 스티커 목록

    // emoji: 서버 저장용 번호(ID)와 화면 표시용 이미지이름(Img)을 따로 관리
    const [selectedEmojiId, setSelectedEmojiId] = useState(null);
    const [selectedEmojiImg, setSelectedEmojiImg] = useState(null);

    // ── [기본 액자 설정 및 최근 사용한 액자 기억하기 로직 ] ────────────────
    const lastUsedFrameImg = localStorage.getItem('lastUsedFrame');
    const defaultFrame = THEME_DEFAULT_FRAMES[currentTheme] ?? { id: 20, img: 'winter_light_frame_x3' };

    // 1. 이미지명을 가지고 ID(숫자)를 찾아주는 도우미 변수
    const frameIdByImg = Object.keys(ITEM_IMG_MAP).find(key => ITEM_IMG_MAP[key] === lastUsedFrameImg);

    // 2. 초기값: 저장된 이미지가 있으면 그 ID를 쓰고, 없으면 테마 기본 ID 사용
    const [selectedFrameId, setSelectedFrameId] = useState(
        lastUsedFrameImg ? Number(frameIdByImg) : defaultFrame.id
    );
    const [selectedFrameImg, setSelectedFrameImg] = useState(
        lastUsedFrameImg ?? defaultFrame.img
    );


    // ── [기능] 수정 모드일 때 기존에 썼던 일기 내용을 서버에서 가져오기 ────────────────
    useEffect(() => {
        if (!isEditMode || !diaryId) return;
        fetchDiaryForEdit();
    }, [isEditMode, diaryId]);

    const fetchDiaryForEdit = async () => {
        try {
            const data = await authFetch(
                `${import.meta.env.VITE_BACKEND_URL}api/v1/diaries/${diaryId}/`
            );

            // 서버에서 받은 데이터를 각각의 상태 변수에 채워 넣습니다.
            setSelectedDate(data.created_at?.split("T")[0] ?? today);
            setContent(data.content ?? "");
            setImageUrl(data.image_url ?? "");

            // 감정 이모지 복원
            if (data.emotion_item?.item_id) {
                setSelectedEmojiId(data.emotion_item.item_id);
                setSelectedEmojiImg(ITEM_IMG_MAP[data.emotion_item.item_id] ?? null);
            }
            // 액자 복원
            if (data.theme_item?.item_id) {
                setSelectedFrameId(data.theme_item.item_id);
                setSelectedFrameImg(ITEM_IMG_MAP[data.theme_item.item_id] ?? defaultFrame.img);
            }
            // 스티커 목록 복원
            if (data.sticker?.length) {
                setStickers(data.sticker.map((s, i) => ({
                    id: s.item_id,
                    img: ITEM_IMG_MAP[s.item_id] ?? '',
                    instanceId: Date.now() + i, // 화면에서 구분하기 위한 고유 키
                    x: s.pos_x ?? null,
                    y: s.pos_y ?? null,
                })));
            }
        } catch (error) {
            console.error("수정 데이터 로드 실패:", error);
        }
    };


    // ── [기능] 단계별 화면 이동 처리 ───────────────────────────────────────────
    function handleSelectOption() { setStep(3); } // 3단계: 그림 옵션 선택으로 이동
    function handleDrawWithoutOption() { handleGenerateImage(); } // 옵션 없이 바로 그리기

    // AI 그림 생성 함수
    async function handleGenerateImage() {
        setIsGenerating(true); // "그리는 중..." 화면 띄우기
        setStep(4); // 4단계: 생성 대기 화면
        try {
            // 실제 서버 연동 시 사용될 코드 (주석 처리됨)
            // const data = await authFetch(...); 

            // 테스트를 위해 2초 기다린 후 가짜 이미지를 보여줍니다.
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setImageUrl('https://zrrizmmqdgfjmnejaqkt.supabase.co/storage/v1/object/public/diary-images/diary_5ccb34ef-2fb5-4861-8b5e-fbb1c11e6bfd.png');
            setStep(5); // 5단계: 완성된 그림 확인 화면으로 이동
        } catch (error) {
            console.error('이미지 생성 실패:', error);
            setStep(3); // 실패하면 옵션 선택창으로 되돌아감
        } finally {
            setIsGenerating(false);
        }
    }

    function handleRegenerateImage() { setStep(3); } // "마음에 안 들어, 다시 그릴래!"
    function handleDecorate() { setStep(6); } // "좋아, 이제 스티커로 꾸밀래!"

    // ── [기능] 최종 저장: 일기 본문 + 꾸미기 정보 ──────────────────────────────
    async function handleFinalSave() {
        try {
            // 1. 먼저 일기 본문(글)을 저장하거나 수정합니다.
            let finalDiaryId = savedDiaryId;
            if (!isEditMode || !finalDiaryId) {
                // 새 일기 작성
                const data = await authFetch(
                    `${import.meta.env.VITE_BACKEND_URL}api/v1/diaries/`,
                    { method: "POST", body: JSON.stringify({ content }) }
                );
                finalDiaryId = data.diary_id;
            } else {
                // 기존 일기 수정
                await authFetch(
                    `${import.meta.env.VITE_BACKEND_URL}api/v1/diaries/${finalDiaryId}/`,
                    { method: "PATCH", body: JSON.stringify({ content }) }
                );
            }

            // 2. 그 다음 꾸미기 정보(액자, 이모지, 스티커 위치 등)를 저장합니다.
            await authFetch(
                `${import.meta.env.VITE_BACKEND_URL}api/v1/diaries/${finalDiaryId}/deco/`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        emoji_id: selectedEmojiId,
                        diary_theme_id: selectedFrameId,
                        sticker: stickers.map((s) => ({
                            item_id: s.id,   // stickers의 id를 item_id로
                            pos_x: Math.round(s.x || 0), // null 방지 및 정수화
                            pos_y: Math.round(s.y || 0)  // null 방지 및 정수화
                        })),
                    }),
                }
            );

            // 3. 일기 목록 데이터가 바뀌었으니 저장된 캐시를 지웁니다.
            sessionStorage.removeItem('diary_list');

            // 완료 후 상세 페이지로 이동!
            navigate(`/diary/${selectedDate}`, {
                replace: true,
                state: { diaryId: finalDiaryId },
            });
        } catch (error) {
            console.error("저장 실패:", error);
        }
    }


    // ── [기능] 기타 조작 함수들 ──────────────────────────────────────────────

    // 날짜가 바뀌면 주소를 업데이트합니다.
    function handleDateChange(newDate) {
        const urlDate = newDate.replace(/\.\s?/g, '-').replace(/-$/, '');
        setSelectedDate(urlDate);
        navigate(isEditMode ? `/diary/edit/${urlDate}` : `/diary/write/${urlDate}`, {
            replace: true,
            state: { diaryId: savedDiaryId },
        });
    }

    // 꾸미기 패널에서 아이템을 클릭했을 때의 동작
    const handleSelectItem = (type, item) => {
        if (type === 'sticker') {
            // 스티커 추가: 기존 목록에 새 스티커를 더함
            setStickers((prev) => [...prev, { ...item, id: item.item_id || item_id, instanceId: Date.now(), x: null, y: null }]);
        } else if (type === 'emoji') {
            // 이모지 선택
            setSelectedEmojiId(item.item_id);
            setSelectedEmojiImg(item.img);
        } else if (type === 'frame') {
            // 액자 교체 및 기억하기
            setSelectedFrameId(item.item_id);
            setSelectedFrameImg(item.img);
            localStorage.setItem('lastUsedFrame', item.img);
        }
    };

    function handleClose() { navigate(-1); } // 뒤로 가기
    function handleCloseOverlay() { setStep(6); }   // 오버레이 닫고 꾸미기 단계로
    function handleCloseOverlay2() { setStep(1); }   // 오버레이 닫고 일기 쓰기 단계로

    // 모든 데이터를 초기화하고 처음부터 다시 시작
    function handleRestartFromBeginning() {
        setImageUrl('');
        setStickers([]);
        setSelectedEmojiId(null);
        setSelectedEmojiImg(null);
        setContent('');
        setSavedDiaryId(null);
        setStep(1);

        // 단순히 defaultFrame으로 돌리지 말고 localStorage 확인
        const lastImg = localStorage.getItem('lastUsedFrame') ?? defaultFrame.img;
        const lastId = Object.keys(ITEM_IMG_MAP).find(key => ITEM_IMG_MAP[key] === lastImg);

        setSelectedFrameImg(lastImg);
        setSelectedFrameId(Number(lastId) || defaultFrame.id);
    }


    // ── [화면] 실제 사용자에게 보여지는 부분 ─────────────────────────────────────
    return (
        <div
            className={`relative w-full h-full ${step === 1 ? '' : 'overflow-hidden'}`}
            style={{
                backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'background_x3')})`,
                backgroundSize: 'cover',
            }}
        >
            {/* 배경을 어둡게 처리하는 막 */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />

            {/* 일기장 본체 (종이 부분) */}
            <DetailDiaryDialog
                currentTheme={currentTheme}
                mode={step === 6 ? 'decorate' : (isEditMode ? 'edit' : 'create')}
                step={step}
                date={selectedDate}
                content={content}
                imageUrl={imageUrl}
                selectedFrame={selectedFrameImg}
                selectedEmoji={selectedEmojiImg}
                stickers={stickers}
                onStickersChange={setStickers}
                onContentChange={setContent}
                onStepChange={(s) => setStep(s)}
                onClose={handleClose}
                onDateChange={handleDateChange}
                footer={
                    <>
                        {/* 1단계 수정모드일때 글 내용만 저장하기 */}
                        {step === 1 && isEditMode && (
                            <div className="w-full h-full flex justify-center gap-[2%]">
                                <ImageButton label="꾸미기" onClick={handleDecorate} className="w-[30%] aspect-[120/48]" imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')} textOption="text-sm text-white" />
                                <ImageButton label="저장하기" onClick={handleFinalSave} className="w-[30%] aspect-[120/48]" imageSrc={getAssetUrl(currentTheme, 'buttons', 'green_button_x3')} textOption="text-sm text-white" />
                            </div>
                        )}

                        {/* 6단계 꾸미기 중일 때만 하단 버튼 3개 노출 */}
                        {step === 6 && (
                            <div className="w-full h-full flex justify-center gap-[2%]">
                                <ImageButton label="처음부터" onClick={handleRestartFromBeginning} className="w-[30%] aspect-[120/48]" imageSrc={getAssetUrl(currentTheme, 'buttons', 'red_button_x3')} textOption="text-sm text-white" />
                                <ImageButton label="다시 그리기" onClick={handleRegenerateImage} className="w-[30%] aspect-[120/48]" imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')} textOption="text-sm text-white" />
                                <ImageButton label="저장하기" onClick={handleFinalSave} className="w-[30%] aspect-[120/48]" imageSrc={getAssetUrl(currentTheme, 'buttons', 'green_button_x3')} textOption="text-sm text-white" />
                            </div>
                        )}
                    </>
                }
            />

            {/* 2단계: 그림 그리기 전 선택 팝업 */}
            {step === 2 && (
                <ImageZoomOverlay onClose={handleCloseOverlay2} imageUrl={imageUrl}
                    footer={
                        <div className="w-full h-full flex flex-col justify-end items-center gap-[8%]">
                            <ImageButton label="그냥 그리기" onClick={handleDrawWithoutOption} className="w-[60%] aspect-[237/72]" imageSrc={getAssetUrl(currentTheme, 'buttons', 'babypink_button_x3')} textOption="text-2xl text-[#FF7396]" />
                            <ImageButton label="옵션 적용하기" onClick={handleSelectOption} className="w-[60%] aspect-[237/72]" imageSrc={getAssetUrl(currentTheme, 'buttons', 'skyblue_button_x3')} textOption="text-2xl text-[#4C8AE8]" />
                        </div>
                    }
                />
            )}

            {/* 3단계: AI 그림 옵션(태그) 선택창 */}
            {step === 3 && (
                <DiaryOptionSelector onClose={handleCloseOverlay2} currentTheme={currentTheme} tags={tags} onTagsChange={setTags}
                    footer={
                        <ImageButton label="옵션 적용하기" onClick={handleGenerateImage} className="w-[60%] aspect-[237/72]" imageSrc={getAssetUrl(currentTheme, 'buttons', 'skyblue_button_x3')} textOption="text-2xl text-[#4C8AE8]" />
                    }
                />
            )}

            {/* AI 로딩 화면 (그림 그리는 중...) */}
            {isGenerating && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 animate-spin bg-white/30 rounded-full border-4 border-dashed" />
                        <span className="text-xl">AI Drawing...</span>
                    </div>
                </div>
            )}

            {/* 5단계: AI가 그려준 그림 확인 팝업 */}
            {step === 5 && (
                <ImageZoomOverlay onClose={handleCloseOverlay} imageUrl={imageUrl}
                    footer={
                        <div className="w-full h-full flex flex-col justify-end items-center mb-[10%] gap-[8%]">
                            <ImageButton label="다시 그리기" onClick={handleRegenerateImage} className="w-[60%] aspect-[237/72]" imageSrc={getAssetUrl(currentTheme, 'buttons', 'babypink_button_x3')} textOption="text-2xl text-[#FF7396]" />
                            <ImageButton label="꾸미기" onClick={handleDecorate} className="w-[60%] aspect-[237/72]" imageSrc={getAssetUrl(currentTheme, 'buttons', 'skyblue_button_x3')} textOption="text-2xl text-[#4C8AE8]" />
                        </div>
                    }
                />
            )}

            {/* 6단계: 하단 꾸미기 도구 모음 (스티커, 프레임 등) */}
            {step === 6 && (
                <DecoPanel
                    currentTheme={currentTheme}
                    mode={decoMode}
                    isOpen={isDecoOpen}
                    onSelectMode={(m, openState = true) => {
                        setDecoMode(m);
                        setIsDecoOpen(openState);
                    }}
                    onSelectItem={handleSelectItem}
                />
            )}
        </div>
    );
}