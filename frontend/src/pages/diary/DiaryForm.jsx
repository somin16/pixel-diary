import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DetailDiaryDialog from "../../components/diary/DetailDiaryDialog";
import { useTheme } from "../../store/useThemeStore";
import { getAssetUrl } from "../../utils/AssetHelper";
import ImageButton from "../../components/common/ImageButton";
import DiaryOptionSelector from "../../components/diary/DiaryOptionSelector";
import ImageZoomOverlay from "../../components/diary/ImageZoomOverlay";
import DecoPanel from "../../components/diary/DecoPanel";

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
 * ─ 상태 소유 원칙 ─────────────────────────────────────────────
 *   이 컴포넌트가 모든 일기 데이터 상태를 소유하고,
 *   DetailDiaryDialog / DecoPanel 등 자식 컴포넌트에 props로 내려줌.
 *   자식은 변경 핸들러(onXxx)를 호출해 이 컴포넌트의 상태를 업데이트.
 * ──────────────────────────────────────────────────────────────
 */

// ── 테마별 기본 프레임 매핑 ─────────────────────────────────────────────────
// 테마 추가 시 여기에만 항목 추가하면 됨
const THEME_DEFAULT_FRAMES = {
    winter_light: 'winter_light_frame_x3',
    // summer_dark: 'summer_dark_frame_x3',
};

export default function DiaryForm() {

    const navigate     = useNavigate();
    const location     = useLocation();
    const isEditMode   = location.pathname.includes('edit');
    const currentTheme = useTheme((state) => state.currentTheme);
    const today        = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    // ── 상태 관리 ────────────────────────────────────────────────────────────

    const [step, setStep]               = useState(isEditMode ? 6 : 1);           // 현재 단계 (1~7)
    const [content, setContent]         = useState('');          // 일기 본문 텍스트
    const [imageUrl, setImageUrl]       = useState('');          // AI 생성 이미지 URL
    const [selectedDate, setSelectedDate] = useState(today);     // 선택된 날짜 "YYYY-MM-DD"
    const [isGenerating, setIsGenerating] = useState(false);     // AI 이미지 생성 중 여부
    const [decoMode, setDecoMode]       = useState(null);        // DecoPanel 모드 (frame/sticker/emoji/null)
    const [isDecoOpen, setIsDecoOpen]   = useState(false);       // DecoPanel 열림 여부 (true: 0%, false: 88%)
    const [tags, setTags]               = useState([]);          // 옵션 태그 

    // ── 프레임 상태 ──────────────────────────────────────────────────────────
    // 초기값 우선순위: localStorage 마지막 사용 프레임 > 테마 기본 프레임
    // 사용자가 프레임 선택 시 localStorage에 저장 → 다음 일기 작성 시 자동 복원
    const [selectedFrame, setSelectedFrame] = useState(
        localStorage.getItem('lastUsedFrame') ?? THEME_DEFAULT_FRAMES[currentTheme] ?? 'winter_light_frame_x3'
    );

    // ── 이모지 상태 ──────────────────────────────────────────────────────────
    // 문자열 이모지가 아닌 이미지 파일명으로 관리 (예: 'emoji_smile')
    // DetailDiaryDialog에서 getDecoAssetUrl('emojis', selectedEmoji)로 이미지 렌더링
    const [selectedEmoji, setSelectedEmoji] = useState(null);

    // ── 스티커 상태 ──────────────────────────────────────────────────────────
    // 구조: [{ id, img, instanceId, x, y }, ...]
    //   - id:          스티커 종류 ID (예: 's_01')
    //   - img:         이미지 파일명 (예: 'sticker_cat')
    //   - instanceId:  같은 스티커 여러 개 구분용 타임스탬프 (Date.now())
    //   - x, y:        일기장 컨테이너 기준 위치 (%), 드래그로 변경됨
    //                  초기값은 null → DetailDiaryDialog에서 기본값 40%로 처리
    const [stickers, setStickers] = useState([]);


    // ── 수정 모드: 기존 일기 데이터 불러오기 ────────────────────────────────
    useEffect(() => {
        if (!isEditMode || !selectedDate) return;

        const fetchDiaryData = async () => {
            try {
                // TODO: Supabase 연동 시 아래 주석 해제
                // const { data, error } = await supabase
                //   .from('diaries').select('*').eq('date', selectedDate).single();

                // 현재는 더미 데이터로 테스트
                const dummyData = {
                    date:          "2026-05-02",
                    content:       "더미 데이터 입니당, 펭귄 일기 수정 중! 🐧",
                    imageUrl:      "https://zrrizmmqdgfjmnejaqkt.supabase.co/storage/v1/object/public/diary-images/diary_5ccb34ef-2fb5-4861-8b5e-fbb1c11e6bfd.png",
                    // 나중에 DB에서 꾸미기 데이터도 함께 불러와야 함
                    selectedEmoji: {id: 'emoji_01', img: 'emoji_01'},
                    selectedFrame: {id: 'frame_01', img: 'winter_light_frame_x3'},
                    stickers:      [
                        { id: 'sticker_01', img: 'sticker_01', x:50, y:28 },
                        { id: 'sticker_01', img: 'sticker_01', x:14, y:28 }
                    ],
                };

                setSelectedDate(dummyData.date);
                setContent(dummyData.content);
                setImageUrl(dummyData.imageUrl);

                // 꾸미기 데이터: 저장된 값이 있을 때만 덮어씌움
                // 없으면 현재 기본값(localStorage 프레임, null 이모지) 유지
                if (dummyData.selectedEmoji) setSelectedEmoji(dummyData.selectedEmoji.img);
                if (dummyData.selectedFrame) setSelectedFrame(dummyData.selectedFrame.img);
                if (dummyData.stickers && dummyData.stickers.length > 0) {
                const loadedStickers = dummyData.stickers.map((s) => ({
                    ...s,
                    instanceId: Date.now() + Math.random(), // 고유 키 생성 (중복 방지)
                    x: s.x ?? null, // 기존 좌표가 없으면 null (중앙 배치)
                    y: s.y ?? null
                }));
                setStickers(loadedStickers);
            }

            } catch (error) {
                console.error("데이터 로드 실패:", error);
            }
        };

        fetchDiaryData();
    }, [isEditMode]);


    // ── Step 이동 핸들러 ────────────────────────────────────────────────────

    // Step 2 → Step 3: 옵션 적용 선택
    function handleSelectOption() { setStep(3); }

    // Step 2 → Step 4: 그냥 그리기 (옵션 없이 바로 생성)
    function handleDrawWithoutOption() { handleGenerateImage(); }

    // Step 3 → Step 4: AI 이미지 생성 요청
    async function handleGenerateImage() {
        setIsGenerating(true);
        setStep(4); // 로딩 단계
        try {
            // TODO: API 연동 시 아래 주석 해제
            // const url = await api.fetchAiImage(content);
            setImageUrl('https://zrrizmmqdgfjmnejaqkt.supabase.co/storage/v1/object/public/diary-images/diary_5ccb34ef-2fb5-4861-8b5e-fbb1c11e6bfd.png');
            await new Promise((resolve) => setTimeout(resolve, 2000)); // 데모용 딜레이
            setStep(5); // 결과 확인 단계
        } catch (error) {
            console.error('이미지 생성 실패:', error);
            setStep(3); // 실패 시 옵션 선택으로 복귀
        } finally {
            setIsGenerating(false);
        }
    }

    // Step 5 → Step 3: 다시 그리기
    function handleRegenerateImage() { setStep(3); }

    // Step 5 → Step 6: 꾸미기 모드 진입
    function handleDecorate() { setStep(6); }

    // Step 6 → 저장 후 상세보기로 이동
    async function handleFinalSave() {
        const finalData = {
            date:          selectedDate,
            content,
            imageUrl,
            selectedFrame,  // 저장할 프레임 파일명
            selectedEmoji,  // 저장할 이모지 파일명
            stickers,       // 저장할 스티커 배열 (x, y 위치 포함)
        };
        console.log('DB에 저장될 최종 데이터:', finalData);
        // TODO: API 연동 시 아래 주석 해제
        // await api.saveDiary(finalData);
        navigate(`/diary/${selectedDate}`, { replace: true });
    }


    // ── 기타 핸들러 ─────────────────────────────────────────────────────────

    // 날짜 변경: URL도 함께 업데이트
    function handleDateChange(newDate) {
        // newDate: "2026. 05. 02" 형식 (DetailDiaryDialog에서 변환해서 전달)
        const urlDate = newDate.replace(/\.\s?/g, '-').replace(/-$/, '');
        setSelectedDate(urlDate);
        navigate(isEditMode ? `/diary/edit/${urlDate}` : `/diary/write/${urlDate}`, { replace: true });
    }

    // DecoPanel 아이템 선택 핸들러
    const handleSelectItem = (type, item) => {
        console.log(`선택된 타입: ${type}, 아이템:`, item);

        if (type === 'sticker') {
            // 스티커: 여러 개 추가 가능 → 배열에 추가
            // x, y는 null로 초기화 → DetailDiaryDialog에서 기본 위치(40%)로 배치됨
            setStickers((prev) => [...prev, { ...item, instanceId: Date.now(), x: null, y: null }]);

        } else if (type === 'emoji') {
            // 이모지: 하나만 선택 → 파일명으로 교체
            setSelectedEmoji(item.img);

        } else if (type === 'frame') {
            // 프레임: 하나만 선택 → 파일명으로 교체
            // localStorage에 저장해 다음 일기 작성 시 자동 복원
            setSelectedFrame(item.img);
            localStorage.setItem('lastUsedFrame', item.img);
        }
    };

    function handleClose()         { navigate(-1); }         // 뒤로가기
    function handleCloseOverlay()  { setStep(6); }           // Step 5 X → Step 6
    function handleCloseOverlay2() { setStep(1); }           // Step 2,3 X → Step 1

    // 처음부터: 이미지 초기화 후 Step 1로
    function handleRestartFromBeginning() {
        setImageUrl('');
        setStickers([]);
        setSelectedEmoji(null);
        setContent('');
        setStep(1);
    }


    // ── 렌더링 ──────────────────────────────────────────────────────────────
    return (
        <div
             className={`relative w-full h-full ${step === 1 ? '' : 'overflow-hidden'}`}
            style={{
                backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'background_x3')})`,
                backgroundSize: 'cover',
            }}
        >
            {/* 배경 블러 오버레이 */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />

            {/*
                ── 메인 다이얼로그 ──
                - 모든 일기 데이터 상태를 props로 전달
                - 스티커 위치 변경: onStickersChange → setStickers 직접 연결
                  (DetailDiaryDialog가 드래그 계산 후 새 배열을 통째로 전달)
            */}
            <DetailDiaryDialog
                currentTheme={currentTheme}
                mode={step === 6 ? 'decorate' : (isEditMode ? 'edit' : 'create')}
                step={step}
                date={selectedDate}
                content={content}
                imageUrl={imageUrl}
                selectedFrame={selectedFrame}
                selectedEmoji={selectedEmoji}
                stickers={stickers}
                onStickersChange={setStickers}  // 드래그로 스티커 위치 변경 시 상태 갱신
                onContentChange={setContent}
                onStepChange={(s) => setStep(s)}
                onClose={handleClose}
                onDateChange={handleDateChange}
                footer={
                    <>
                        {/* Step 1: 본문 작성 완료 → 그림 선택으로 */}

                        {/* Step 6: 꾸미기 완료 → 처음부터 or 저장 */}
                        {step === 6 && (
                            <div className="w-full h-full flex justify-center gap-[2%]">
                                <ImageButton
                                    label="처음부터"
                                    onClick={handleRestartFromBeginning}
                                    className="w-[30%] aspect-[120/48]"
                                    imageSrc={getAssetUrl(currentTheme, 'buttons', 'red_button_x3')}
                                    textOption="text-sm text-white"
                                />
                                <ImageButton
                                    label="다시 그리기"
                                    onClick={handleRegenerateImage}
                                    className="w-[30%] aspect-[120/48]"
                                    imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')}
                                    textOption="text-sm text-white"
                                />
                                <ImageButton
                                    label="저장하기"
                                    onClick={handleFinalSave}
                                    className="w-[30%] aspect-[120/48]"
                                    imageSrc={getAssetUrl(currentTheme, 'buttons', 'green_button_x3')}
                                    textOption="text-sm text-white"
                                />
                            </div>
                        )}
                    </>
                }
            />

            {/* Step 2: 그림 칸 클릭 시 옵션 선택 오버레이 */}
            {step === 2 && (
                <ImageZoomOverlay
                    onClose={handleCloseOverlay2}
                    imageUrl={imageUrl}
                    footer={
                        <div className="w-full h-full flex flex-col justify-end items-center gap-[8%]">
                            <ImageButton label="그냥 그리기"   
                            onClick={handleDrawWithoutOption} 
                            className="w-[60%] aspect-[237/72]" 
                            imageSrc={getAssetUrl(currentTheme, 'buttons', 'babypink_button_x3')}  
                            textOption="text-2xl text-[#FF7396]" />
                            <ImageButton label="옵션 적용하기" 
                            onClick={handleSelectOption}       
                            className="w-[60%] aspect-[237/72]" 
                            imageSrc={getAssetUrl(currentTheme, 'buttons', 'skyblue_button_x3')}  
                            textOption="text-2xl text-[#4C8AE8]" />
                        </div>
                    }
                />
            )}

            {/* Step 3: AI 옵션 선택 */}
            {step === 3 && (
                <DiaryOptionSelector
                    onClose={handleCloseOverlay2}
                    currentTheme={currentTheme}
                    tags={tags}
                    onTagsChange={setTags}
                    footer={
                        <ImageButton label="옵션 적용하기" 
                        onClick={handleGenerateImage} 
                        className="w-[60%] aspect-[237/72]" 
                        imageSrc={getAssetUrl(currentTheme, 'buttons', 'skyblue_button_x3')} 
                        textOption="text-2xl text-[#4C8AE8]" />
                    }
                />
            )}

            {/* Step 4: AI 생성 중 로딩 오버레이 */}
            {isGenerating && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 animate-spin bg-white/30 rounded-full border-4 border-dashed" />
                        <span className="text-xl">AI Drawing...</span>
                    </div>
                </div>
            )}

            {/* Step 5: 결과 확인 (다시 그리기 / 꾸미기 선택) */}
            {step === 5 && (
                <ImageZoomOverlay
                    onClose={handleCloseOverlay}
                    imageUrl={imageUrl}
                    footer={
                        <div className="w-full h-full flex flex-col justify-end items-center mb-[10%] gap-[8%]">
                            <ImageButton label="다시 그리기" 
                            onClick={handleRegenerateImage} 
                            className="w-[60%] aspect-[237/72]" 
                            imageSrc={getAssetUrl(currentTheme, 'buttons', 'babypink_button_x3')} 
                            textOption="text-2xl text-[#FF7396]" />
                            <ImageButton label="꾸미기"      
                            onClick={handleDecorate}         
                            className="w-[60%] aspect-[237/72]" 
                            imageSrc={getAssetUrl(currentTheme, 'buttons', 'skyblue_button_x3')}  
                            textOption="text-2xl text-[#4C8AE8]" />
                        </div>
                    }
                />
            )}

            {/* Step 6: 꾸미기 패널 (프레임/스티커/이모지 선택) */}
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