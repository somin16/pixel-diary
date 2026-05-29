import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBackNavigate } from "../../hooks/useBackNavigate";
import { authFetch } from "../../utils/AuthHelper";
import { useTheme } from "../../store/useThemeStore";
import { getAssetUrl } from "../../utils/AssetHelper";
import DiaryOptionSelector from "../../components/diary/DiaryOptionSelector";
import ImageZoomOverlay from "../../components/diary/ImageZoomOverlay";
import DecoPanel from "../../components/diary/DecoPanel";
import DetailDiaryDialog from "../../components/diary/DetailDiaryDialog";
import ImageButton from "../../components/common/ImageButton";
import { App } from '@capacitor/app';
import { Capacitor } from "@capacitor/core";

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
  const { goBack, goTo } = useBackNavigate();
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
  const [tags, setTags] = useState([]); // AI 그림 옵션 태그들 (추가: 일반, 제거: '-' 접두사)
  const [convertedPrompt, setConvertedPrompt] = useState({
    positive_prompt: '',
    negative_prompt: '',
  }); // POST/PATCH /api/v1/prompt/ 에서 받은 변환된 프롬프트
  // ref: 비동기 함수 내에서도 항상 최신 prompt에 접근하기 위해 별도 유지
  const convertedPromptRef = useRef({ positive_prompt: '', negative_prompt: '' });
  const [savedDiaryId, setSavedDiaryId] = useState(diaryId); // 저장된 일기의 ID
  const [stickers, setStickers] = useState([]); // 화면에 붙인 스티커 목록
  const [duplicateDateInfo, setDuplicateDateInfo] = useState(null); // 이미 작성된 일기가 있는지 확인하기위한 상태 
  const [savedImageId, setSavedImageId] = useState(null); // 백엔드 DiaryView.post()에서 image_id를 받아 ai_image.diary_id를 업데이트함

  // emoji: 서버 저장용 번호(ID)와 화면 표시용 이미지이름(Img)을 따로 관리
  const [selectedEmojiId, setSelectedEmojiId] = useState(null);
  const [selectedEmojiImg, setSelectedEmojiImg] = useState(null);

  // ── [기본 액자 설정 및 최근 사용한 액자 기억하기 로직 ] ────────────────
  const lastUsedFrameImg = localStorage.getItem('lastUsedFrame');

  // 2. 초기값: 저장된 이미지가 있으면 그 ID를 쓰고, 없으면 테마 기본 ID 사용
  const [selectedFrameId, setSelectedFrameId] = useState(null); // id는 선택 시 세팅됨
  const [selectedFrameImg, setSelectedFrameImg] = useState(lastUsedFrameImg ?? null); // 마지막 사용 액자 or 기본 프레임

  // 저장 실패 다이얼로그용 상태
  const [saveError, setSaveError] = useState(null); // null | 'duplicate' | 'unknown'

  // ── [기능] 수정 모드일 때 기존에 썼던 일기 내용을 서버에서 가져오기 ────────────────
  useEffect(() => {
    if (!isEditMode || !diaryId) return;
    fetchDiaryForEdit();
  }, [isEditMode, diaryId]);

  // ── [기능] 하드웨어 뒤로가기 시 임시 이미지 삭제 ──────────────────────────
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener('backButton', async () => {
      await handleClose(); // X 버튼이랑 동일한 로직
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [savedImageId]); // savedImageId 바뀔 때마다 최신 handleClose 반영

  const fetchDiaryForEdit = async () => {
    try {
      const data = await authFetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/diaries/${diaryId}/`
      );

      // 서버에서 받은 데이터를 각각의 상태 변수에 채워 넣습니다.
      setSelectedDate(data.created_at?.split("T")[0] ?? today);
      setContent(data.content ?? "");
      setImageUrl(data.image_url ?? "");

      // 감정 이모지 복원
      if (data.emotion_item?.item_id) {
        setSelectedEmojiId(data.emotion_item.item_id);
        setSelectedEmojiImg(data.emotion_item?.image_url ?? null);
      }
      // 액자 복원
      if (data.theme_item?.item_id) {
        setSelectedFrameId(data.theme_item.item_id);
        setSelectedFrameImg(data.theme_item?.image_url ?? defaultFrame.img);
      }
      // 스티커 목록 복원
      if (data.sticker?.length) {
        setStickers(data.sticker.map((s, i) => ({
          id: s.item_id,
          img: s.image_url ?? '',
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
  // 3단계: 옵션 선택 전 일기 내용을 영어 프롬프트로 변환 (POST /api/v1/prompt/)
  async function handleSelectOption() {
    try {
      const data = await authFetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/prompt/`,
        {
          method: 'POST',
          body: JSON.stringify({ diary: content }),
        }
      );
      const next = { positive_prompt: data.positive_prompt, negative_prompt: data.negative_prompt };
      convertedPromptRef.current = next;
      setConvertedPrompt(next);
    } catch (error) {
      console.error('프롬프트 변환 실패:', error);
      const fallback = { positive_prompt: content, negative_prompt: '' };
      convertedPromptRef.current = fallback;
      setConvertedPrompt(fallback);
    }
    setStep(3);
  }

  // 옵션 없이 바로 그리기: 일기 내용 그대로 변환 후 생성
  async function handleDrawWithoutOption() {
    setIsGenerating(true);
    setStep(4);
    try {
      const promptData = await authFetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/prompt/`,
        {
          method: 'POST',
          body: JSON.stringify({ diary: content }),
        }
      );
      await _generateImage(promptData.positive_prompt, promptData.negative_prompt);
    } catch (error) {
      console.error('이미지 생성 실패:', error);
      setStep(2);
    } finally {
      setIsGenerating(false);
    }
  }

  // 태그 변경 시 state만 업데이트 (PATCH는 옵션 적용하기 버튼에서 처리)
  function handleTagsChange(newTags) {
    setTags(newTags);
  }

  // AI 그림 생성 함수 (옵션 적용하기 버튼)
  async function handleGenerateImage() {
    setIsGenerating(true);
    setStep(4);
    try {
      if (!convertedPromptRef.current.positive_prompt) {
        // 프롬프트 없으면 POST
        const data = await authFetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/prompt/`,
          {
            method: 'POST',
            body: JSON.stringify({ diary: content }),
          }
        );
        const next = { positive_prompt: data.positive_prompt, negative_prompt: data.negative_prompt };
        convertedPromptRef.current = next;
        setConvertedPrompt(next);
      }

      if (tags.length > 0) {
        // 태그 있으면 PATCH
        const requestTags = tags.filter(t => !t.startsWith('-')).join(', ');
        const removeTags = tags.filter(t => t.startsWith('-')).map(t => t.substring(1)).join(', ');
        console.log("--------그림 새로 그리는 중-----------------------------")
        console.log("추가:",requestTags);
        console.log("제거:",removeTags);
        const data = await authFetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/prompt/`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              prompt: convertedPromptRef.current.positive_prompt,
              request: requestTags,
              remove: removeTags,
            }),
          }
        );
        const next = { positive_prompt: data.positive_prompt, negative_prompt: data.negative_prompt };
        convertedPromptRef.current = next;
        setConvertedPrompt(next);
      }

      await _generateImage(convertedPromptRef.current.positive_prompt, convertedPromptRef.current.negative_prompt);
    } catch (error) {
      console.error('이미지 생성 실패:', error);
      setStep(3);
    } finally {
      setIsGenerating(false);
    }
  }

  // 실제 ai-generate API 호출 (내부 공통 함수)
  async function _generateImage(positivePrompt, negativePrompt) {
    console.log("---------------------------------------------------------") // 나중에 배포전에 지울거에요
    console.log("긍정프롬프트:",positivePrompt);
    console.log("부정프롬프트:",negativePrompt);
    console.log("----------------------------------------------------------")
    const data = await authFetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/v1/ai-generate/`,
      {
        method: 'POST',
        body: JSON.stringify({
          positive_prompt: positivePrompt || content,
          negative_prompt: negativePrompt || '',
        }),
      }
    );
    setImageUrl(data.image_url);
    setSavedImageId(data.image_id);
    setStep(5);
  }

  function handleRegenerateImage() {
    setTags([]); // 이전 태그 초기화
    setStep(3);
  }

  function handleDecorate() { setStep(6); } // "좋아, 이제 스티커로 꾸밀래!"

  // ── [기능] 최종 저장: 일기 본문 + 꾸미기 정보 ──────────────────────────────
  async function handleFinalSave() {
    try {
      // 1. 먼저 일기 본문(글)을 저장하거나 수정합니다.
      let finalDiaryId = savedDiaryId;
      if (!isEditMode || !finalDiaryId) {
        // 새 일기 작성
        const data = await authFetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/diaries/`,
          { method: "POST", body: JSON.stringify({ content, image_id: savedImageId ?? "", }) } // AI 생성 이미지의 image_id 같이 전송
          // 백엔드에서 ai_image 테이블의 diary_id를 업데이트하고 is_temp를 false로 변경함
        );
        finalDiaryId = data.diary_id;
      } else {
        // 기존 일기 수정
        await authFetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/diaries/${finalDiaryId}/`,
          { method: "PATCH", body: JSON.stringify({ content }) }
        );
      }

      // 2. 그 다음 꾸미기 정보(액자, 이모지, 스티커 위치 등)를 저장합니다.
      await authFetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/diaries/${finalDiaryId}/deco/`,
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

      // 4. 저장 완료 후 임시 이미지 삭제
      if (savedImageId) {
        try {
          await authFetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/ai-generate/`,
            { method: 'DELETE' }
          );
        } catch (error) {
          console.error('임시 이미지 삭제 실패:', error);
        }
      }

      // 완료 후 상세 페이지로 이동!
      await goTo(`/diary/${selectedDate}`, {
        replace: true,
        state: {
          diaryId: finalDiaryId,
          fromEdit: true,  // 수정 후 진입했다는 표시
        },
      });
    } catch (error) {
      // 409 충돌(날짜 중복)인 경우 사용자에게 알림
      const statusCode = error.status || error.response?.status;

      if (statusCode === 409) {
        setSaveError('duplicate'); // 중복 알림 다이얼로그 띄우기
        console.error("일기 중복 감지 완료");
      } else {
        setSaveError('unknown');
        console.error("기타 서버 에러 발생:", error.message);
      }
    }
  }


  // ── [기능] 기타 조작 함수들 ──────────────────────────────────────────────

  // 날짜가 바뀌면 주소를 업데이트합니다.
  async function handleDateChange(newDate) {
    const urlDate = newDate.replace(/\.\s?/g, '-').replace(/-$/, '');

    // 캐시에서 해당 날짜 일기 존재 여부 확인
    const cached = sessionStorage.getItem('diary_list');
    const diaries = cached ? JSON.parse(cached) : [];
    const found = diaries.find(d => d.created_at?.split("T")[0] === urlDate);

    if (found) {
      // 이미 일기 있음 → 다이얼로그 띄우기 (날짜 변경은 하지 않음)
      setDuplicateDateInfo({ date: urlDate, diaryId: found.diary_id });
      return;
    }

    // 없으면 기존 로직대로 날짜 변경
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
      setStickers((prev) => [...prev, { ...item, id: item.item_id, instanceId: Date.now(), x: null, y: null }]);
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

  // 뒤로 가기 시 임시 이미지 삭제 API 호출
  // 저장하지 않고 나가면 백엔드에서 is_temp=true인 이미지를 Storage + DB에서 삭제함
  async function handleClose() {
    // 생성된 이미지가 있고 아직 저장 안 한 경우에만 삭제 요청
    if (savedImageId) {
      try {
        await authFetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/ai-generate/`,
          { method: 'DELETE' }
        );
      } catch (error) {
        // 삭제 실패해도 사용자 경험에 영향 없도록 조용히 처리
        console.error('임시 이미지 삭제 실패:', error);
      }
    }
    await goBack();
  }

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
    setSavedImageId(null);
    setStep(1);

    // 단순히 defaultFrame으로 돌리지 말고 localStorage 확인
    const lastImg = localStorage.getItem('lastUsedFrame') ?? defaultFrame.img;
    setSelectedFrameImg(lastImg);
    setSelectedFrameId(defaultFrame.id);
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
        duplicateDateInfo={duplicateDateInfo}
        onDuplicateConfirm={() => {
          const { date, diaryId } = duplicateDateInfo; // 먼저 꺼내두기
          setDuplicateDateInfo(null);
          navigate(`/diary/${date}`, {
            replace: true,
            state: { diaryId }
          });
        }}
        onDuplicateCancel={() => setDuplicateDateInfo(null)}   // 취소 버튼 → 다이얼로그 닫기
        saveError={saveError}
        setSaveError={(s) => setSaveError(s)}
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
        <DiaryOptionSelector onClose={handleCloseOverlay2} currentTheme={currentTheme} tags={tags} onTagsChange={handleTagsChange}
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