import { useState, useRef, useCallback } from "react";
import { getAssetUrl } from "../../utils/AssetHelper";
import CloseButton from "../common/CloseButton";
import { useNavigate } from "react-router-dom";
import { formatDisplayDate } from "../../utils/DateFormatter";
import { useDeleteDiary, useDeleteDeco } from "../../hooks/queries/useDiaryQueries";
import DeleteDialog from "./dialog/DeleteDialog";
import ResultDialog from "../common/dialog/ResultDialog";
import DuplicateDateDialog from "./dialog/DuplicateDateDialog";
import SaveErrorDialog from "./dialog/SaveErrorDialog";
import toast from "react-hot-toast";
import { useBackNavigate } from "../../hooks/useBackNavigate";
import html2canvas from 'html2canvas';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * @typedef {Object} StickerItem
 * @property {string} id          - 스티커 고유 ID (예: 's_01')
 * @property {string} img         - 스티커 이미지 파일명 (예: 'sticker_cat')
 * @property {number} instanceId  - 같은 스티커 여러 개 구분용 타임스탬프 (Date.now())
 * @property {number} x           - 일기장 컨테이너 기준 좌측에서의 위치 (%)
 * @property {number} y           - 일기장 컨테이너 기준 상단에서의 위치 (%)
 */

/**
 * @typedef {Object} DetailDiaryDialogProps
 * @property {'view' | 'create' | 'edit' | 'decorate'} mode
 *   - 'view'     : 상세보기 (읽기 전용, 수정/삭제/공유 메뉴 표시)
 *   - 'create'   : 일기 작성 (본문 편집 + 그림 생성 흐름)
 *   - 'edit'     : 일기 수정 (작성과 동일하나 기존 데이터 로드됨)
 *   - 'decorate' : 꾸미기 (프레임/스티커/이모지 선택, 본문 편집 불가)
 *
 * @property {string}       currentTheme      - 현재 앱 테마 (에셋 경로 결정에 사용)
 * @property {string}       [diaryId]         - 일기  id
 * @property {string}       [date]            - 일기 날짜 "YYYY-MM-DD" 형식
 * @property {string}       [imageUrl]        - 일기 그림 이미지 URL
 * @property {string}       [content]         - 일기 본문 텍스트
 * @property {number}       [step]            - 현재 작성 단계 (1~7), DiaryForm에서 관리
 * @property {string}       [selectedFrame]
 *   - DecoPanel에서 선택한 프레임 파일명 (예: 'winter_light_frame_x3')
 *   - null이면 테마 기본 프레임(diary_frame_x3) 사용
 * @property {string}       [selectedEmoji]
 *   - DecoPanel에서 선택한 이모지 파일명 (예: 'emoji_smile')
 *   - null이면 테마 기본 이모지 이미지 사용
 * @property {StickerItem[]} [stickers]
 *   - 배치된 스티커 목록. DiaryForm의 stickers 상태를 그대로 전달
 *   - 드래그로 위치 변경 시 onStickersChange를 통해 부모 상태 업데이트
 * @property {(stickers: StickerItem[]) => void} [onStickersChange]
 *   - 스티커 위치 변경 시 DiaryForm의 setStickers를 호출하는 핸들러
 * @property {(value: string) => void} [onContentChange] - 본문 변경 핸들러
 * @property {(step: number) => void}  [onStepChange]   - DiaryForm의 setStep 래퍼
 * @property {(date: string) => void}  [onDateChange]   - 날짜 변경 핸들러
 * @property {React.ReactNode}         [footer]         - 하단 버튼 슬롯 (부모 주입)
 * @property {() => void}              onClose          - 닫기(X) 버튼 핸들러
 */

/**
 * 일기 상세보기 / 작성 / 수정 / 꾸미기를 통합 관리하는 다이얼로그 컴포넌트
 *
 * ─ 레이어 구조 (z-index 기준) ─────────────────────────────────
 *   z-20  레이어 1: 일기 그림 이미지
 *   z-30  레이어 2: 픽셀아트 프레임
 *   z-40  레이어 3: 스티커 (드래그 가능, pointer-events-none으로 텍스트 통과)
 *   z-50  레이어 4: 본문 텍스트 (스티커보다 위에서 클릭 수신)
 *   z-60  날짜/이모지 영역, 수정/삭제/공유 메뉴
 *   z-70  그림 칸 클릭 투명 레이어
 *
 * ─ pointer-events 설계 원칙 ───────────────────────────────────
 *   스티커 레이어 래퍼 div: pointer-events-none
 *   → 래퍼가 클릭을 통과시켜 텍스트 영역(z-50)이 정상 동작
 *   개별 스티커 div: decorate 모드에서만 pointer-events-auto
 *   → 스티커 자체만 드래그 이벤트 수신, 주변 영역은 통과
 * ──────────────────────────────────────────────────────────────
 *
 * @param {DetailDiaryDialogProps} props
 */

const DetailDiaryDialog = ({
  currentTheme,
  mode = 'view',
  step = 1,
  diaryId,
  date: diaryDate,
  selectedEmoji,
  imageUrl,
  selectedFrame,
  stickers = [],
  onStickersChange,
  content,
  onContentChange,
  onStepChange,
  onDateChange,
  footer,
  onClose,
  duplicateDateInfo,    // 중복 날짜 정보 { date, diaryId } 또는 null
  onDuplicateConfirm,   // 확인 버튼 핸들러 (DiaryForm에서 navigate 처리)
  onDuplicateCancel,    // 취소 버튼 핸들러 (다이얼로그 닫기)
  saveError,            // 일기 작성시 에러 타입
  setSaveError,         // 저장 오류시 다이얼로그 상태 조절
  onRefresh,            // 일기 수정이나 꾸미기 초기화 후 일기 리프레쉬
}) => {

  const navigate = useNavigate();
  const { goTo, goBack } = useBackNavigate();
  const deleteDiary = useDeleteDiary();
  const deleteDeco = useDeleteDeco();

  const MAX_LENGTH = 160;
  const length = (content || '').length

  // ── 스티커 드래그용 ref ───────────────────────────────────────────────────
  // draggingRef:  현재 드래그 중인 스티커의 instanceId 보관
  //               → state 대신 ref를 쓰는 이유: 값이 바뀌어도 리렌더를 일으키지 않아서
  //                 pointermove 이벤트 핸들러가 매 프레임 호출될 때 성능 저하 없이 참조 가능

  const rootRef = useRef(null);
  const containerRef = useRef(null);
  const rotatingRef = useRef(null);
  const draggingRef = useRef(null);   // { id, dx, dy }
  const resizingRef = useRef(null);   // instanceId
  const [selectedStickerId, setSelectedStickerId] = useState(null);

  const DEFAULT_SIZE = 20, MIN_SIZE = 8, MAX_SIZE = 60;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const getRect = () => rootRef.current.getBoundingClientRect();

  const updateSticker = (instanceId, patch) =>
  onStickersChange?.(stickers.map(s => s.instanceId === instanceId ? { ...s, ...patch } : s));

  // ── 프레임 이미지 경로 ──────────────────────────────────────────────────
  // 우선순위: DecoPanel에서 선택한 프레임 > 테마 기본 프레임
  const frameImageSrc = selectedFrame
    ?? getAssetUrl(currentTheme, 'boxes', 'diary_frame_x3');

  // ── 이모지 이미지 경로 ──────────────────────────────────────────────────
  // 우선순위: DecoPanel에서 선택한 이모지 > 테마 기본 이모지
  // 기본 이모지 파일명 'app_icon_32_x3' → 별도 기본 이모지 이미지 생기면 교체
  const emojiImageSrc = selectedEmoji
    ?? getAssetUrl(currentTheme, 'icons', 'app_icon_32_x3');

  // ── 메뉴 오픈 상태 (상세보기 모드 전용) ────────────────────────────────
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // --- 다이얼로그 상태 관리 ---
  // null: 아무것도 안 띄움, 'confirm': 삭제 확인 창, 'result': 삭제 완료 창
  const [dialogState, setDialogState] = useState(null);

  // ── 모드 판별 플래그 ────────────────────────────────────────────────────
  const isView = mode === 'view';
  const isCreate = mode === 'create';
  const isEdit = mode === 'edit';
  const isDecorate = mode === 'decorate';

  // 텍스트 영역 편집 가능 여부:
  // create/edit 모드의 Step 1(본문 작성 단계)에서만 textarea 활성화
  const isTextEditable = (isCreate || isEdit) && step === 1;


  // ── 스티커 드래그 핸들러 ────────────────────────────────────────────────

  // 스티커 중심 좌표(px) 계산
  const getCenter = (sticker) => {
    const rect = getRect();
    const w = sticker.size ?? DEFAULT_SIZE;
    const h = w * (rect.width / rect.height);
    return {
      cx: rect.left + ((sticker.x ?? 40) + w / 2) / 100 * rect.width,
      cy: rect.top + ((sticker.y ?? 40) + h / 2) / 100 * rect.height,
    };
  };

  const handleRotateDown = (e, sticker) => {
    e.stopPropagation();
    e.preventDefault();
    rotatingRef.current = sticker.instanceId;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handleRotateMove = (e, sticker) => {
    if (rotatingRef.current !== sticker.instanceId) return;
    const { cx, cy } = getCenter(sticker);
    // 핸들이 위쪽(-90°)에 있으므로 +90 보정
    const raw = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 90;
    const deg = (Math.round(raw) % 360 + 360) % 360; // 0 ~ 359로 정규화
    updateSticker(sticker.instanceId, { rotation: deg });
  };
  const handleRotateUp = () => { rotatingRef.current = null; };

  /**
   * [드래그 시작] onPointerDown
   * - 꾸미기 모드에서만 동작
   * - setPointerCapture: 손가락/커서가 스티커 영역 밖으로 나가도 이벤트 계속 수신
   *
   * @param {React.PointerEvent} e
   * @param {number} instanceId - 드래그를 시작한 스티커의 instanceId
   */
    // 드래그 시작: 포인터와 스티커 좌상단의 오프셋을 저장 (잡은 위치 그대로 이동)
  const handleStickerPointerDown = (e, sticker) => {
    if (!isDecorate) return;
    e.preventDefault();
    e.stopPropagation();// 아래 레이어(그림 칸 클릭 등)로 이벤트 전파 차단
    const rect = getRect();
    draggingRef.current = {
      id: sticker.instanceId,
      dx: ((e.clientX - rect.left) / rect.width) * 100 - (sticker.x ?? 40),
      dy: ((e.clientY - rect.top) / rect.height) * 100 - (sticker.y ?? 40),
    };
    setSelectedStickerId(sticker.instanceId);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  /**
   * [드래그 이동] onPointerMove
   * - 포인터 위치를 일기장 컨테이너 기준 %로 변환
   * - 스티커 중앙이 포인터 위치에 오도록 스티커 크기(20%)의 절반(10%)만큼 보정
   * - 스티커가 일기장 밖으로 나가지 않도록 0~80% 범위로 clamp
   *   (80%로 제한: 스티커 자체 너비가 20%이므로 80% 이상이면 오른쪽/아래쪽이 잘림)
   *
   * @param {React.PointerEvent} e
   */
  // 드래그 이동: 화면 전체 범위 (스티커가 화면 밖으로만 안 나가게)
  const handleStickerPointerMove = (e) => {
    const d = draggingRef.current;
    if (!d) return;
    const s = stickers.find(v => v.instanceId === d.id);
    if (!s) return;
    const rect = getRect();
    const w = s.size ?? DEFAULT_SIZE;
    const h = w * (rect.width / rect.height); // 정사각형 스티커의 세로 %
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    updateSticker(d.id, {
      x: clamp(px - d.dx, 0, 100 - w),
      y: clamp(py - d.dy, 0, 100 - h),
    });
  };

  /**
   * [드래그 종료] onPointerUp / onPointerCancel
   * - draggingRef를 null로 초기화하여 다음 드래그 준비
   * - onPointerCancel: 전화 수신 등으로 포인터가 예기치 않게 해제될 때도 정상 종료
   */
  const handleStickerPointerUp = () => { draggingRef.current = null; };

  // 크기 조절: 우하단 핸들을 끌면 (포인터 x - 스티커 left)가 새 너비
const handleResizeDown = (e, sticker) => {
  e.stopPropagation();
  e.preventDefault();
  resizingRef.current = sticker.instanceId;
  e.currentTarget.setPointerCapture(e.pointerId);
};
const handleResizeMove = (e, sticker) => {
  if (resizingRef.current !== sticker.instanceId) return;
  const rect = getRect();
  const { cx, cy } = getCenter(sticker);
  const dist = Math.hypot(e.clientX - cx, e.clientY - cy);   // 중심 → 우하단 모서리
  const widthPx = dist * Math.SQRT2;                          // 정사각형이라 대각선 절반 × √2 = 한 변
  updateSticker(sticker.instanceId, {
    size: clamp((widthPx / rect.width) * 100, MIN_SIZE, MAX_SIZE),
  });
};

const handleResizeUp = () => { resizingRef.current = null; };

// 삭제
const handleStickerRemove = (e, instanceId) => {
  e.stopPropagation();
  onStickersChange?.(stickers.filter(s => s.instanceId !== instanceId));
  setSelectedStickerId(null);
};

  // ── 상세보기 전용 핸들러 ────────────────────────────────────────────────

  // 수정 페이지로 이동
  function handleEditNavigation() {
    if (!diaryDate) return;
    navigate(`/diary/edit/${diaryId}`, {
      state: {
        mode: 'edit',
        diaryId: diaryId,
        diaryDate: diaryDate,
        diaryContent: content,           // 일기 본문
        imageUrl: imageUrl,         // AI 그림
        selectedEmoji: selectedEmoji, // 이모지
        selectedFrame: selectedFrame, // 프레임
        stickers: stickers,         // 스티커 배열 전체
      }
    });
    setIsMenuOpen(false);
  }

  // 삭제 API 연동 및 커스텀 다이얼로그 
  // 1. 점 세개 메뉴에서 '삭제' 버튼을 눌렀을 때
  function handleDeleteMenuClick() {
    setIsMenuOpen(false);
    setDialogState('confirm'); // 확인 팝업 열기
  }

  // 2. DeleteDialog에서 '삭제하기'를 눌렀을 때 (실제 API 호출)
  function handleActualDelete() {
    deleteDiary.mutate(
      { diaryId },
      {
        // mutation onSuccess에서 diaries/diaryDetail 캐시가 자동으로 무효화됨
        onSuccess: () => setDialogState('result'),
        onError: (error) => {
          console.error("삭제 실패:", error);
          alert(error.message || "삭제 중 오류가 발생했습니다.");
          setDialogState(null);
        },
      }
    );
  }

  // 3. ResultDialog에서 '확인'을 눌렀을 때 처리 분기
  async function handleResultConfirm() {
    // 대입하기 전에 현재의 dialogState 상태를 먼저 변수에 저장합니다.
    const currentStatus = dialogState;

    setDialogState(null);

    if (currentStatus === 'result') {
      if (onClose) onClose(); // 상세 다이얼로그 닫기
      // 일기 삭제 성공 시에만 목록으로 이동
      await goTo('/diary/list', { replace: true });
      return; // 삭제 후엔 onRefresh 불필요하므로 여기서 종료
    }
    // 'deco_reset_success'일 때는 아무 데도 가지 않고 이 자리에 가만히 유지됩니다.
    // 부모에게 서버에서 최신 일기 데이터를 다시 호출하라고 명령!
    await onRefresh();
  }

  // 꾸미기 초기화
  function handleResetDeco() {
    setIsMenuOpen(false);

    deleteDeco.mutate(
      { diaryId },
      {
        // mutation onSuccess에서 diaries/diaryDetail 캐시가 자동으로 무효화됨
        onSuccess: () => setDialogState('deco_reset_success'),
        onError: (error) => {
          console.error("꾸미기 초기화 실패:", error);
          toast("꾸미기 내용이 없습니다");
          setDialogState(null);
        },
      }
    );
  }

  /**
   * [공유 전용] html2canvas가 CSS aspect-ratio를 잘못 재계산해 비율이 찌그러지는 문제 대응
   * - aspect-ratio를 쓰는 요소(클래스 또는 인라인)를 찾아, 캡처 직전 실측 px로 강제 고정
   * - aspect-ratio 자체도 제거해서 html2canvas가 참고할 값을 없앰
   * - restore() 호출 시 원래 클래스/스타일로 복구 (화면 레이아웃엔 영향 없음)
   */
  function lockAspectRatios(root) {
    const targets = [root, ...root.querySelectorAll('*')];
    const originals = [];

    targets.forEach((el) => {
      const aspectClasses = Array.from(el.classList).filter((c) => c.startsWith('aspect-'));
      const hasInlineAspectRatio = !!el.style.aspectRatio; // 스티커처럼 인라인 style로 지정된 경우 대응

      if (aspectClasses.length > 0 || hasInlineAspectRatio) {
        const rect = { width: el.offsetWidth, height: el.offsetHeight };
        originals.push({
          el,
          classes: aspectClasses,
          width: el.style.width,
          height: el.style.height,
          inlineAspectRatio: el.style.aspectRatio,
        });
        if (aspectClasses.length > 0) el.classList.remove(...aspectClasses);
        el.style.aspectRatio = ''; // 인라인 aspect-ratio 제거
        el.style.width = `${rect.width}px`;
        el.style.height = `${rect.height}px`;
      }
    });

    return function restore() {
      originals.forEach(({ el, classes, width, height, inlineAspectRatio }) => {
        if (classes.length > 0) el.classList.add(...classes);
        el.style.aspectRatio = inlineAspectRatio;
        el.style.width = width;
        el.style.height = height;
      });
    };
  }

  // 공유: 일기장 화면을 이미지로 캡처해서 기기의 공유 시트(카카오톡, SNS 등) 호출
  async function handleShare() {
    setIsMenuOpen(false);
    setSelectedStickerId(null);

    let restore = null;

    try {
      // 메뉴가 닫히는 리렌더가 반영될 시간을 살짝 확보
      await new Promise((resolve) => setTimeout(resolve, 100));

      const root = rootRef.current;
      const diary = containerRef.current;

      restore = lockAspectRatios(root);

      // 크롭 영역: 일기장 본체의 root 기준 위치/크기 (px)
      const rootRect = root.getBoundingClientRect();
      const diaryRect = diary.getBoundingClientRect();

      const canvas = await html2canvas(root, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        ignoreElements: (el) => el.dataset?.noCapture === 'true',
      });

      restore();
      restore = null;

      // 일기장 영역만 잘라내기 (일기장 밖으로 나간 스티커는 여기서 잘림)
      const ratio = canvas.width / rootRect.width;
      const sx = (diaryRect.left - rootRect.left) * ratio;
      const sy = (diaryRect.top - rootRect.top) * ratio;
      const sw = diaryRect.width * ratio;
      const sh = diaryRect.height * ratio;

      const cropped = document.createElement('canvas');
      cropped.width = Math.round(sw);
      cropped.height = Math.round(sh);
      cropped.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, cropped.width, cropped.height);

      const base64Data = cropped.toDataURL('image/png').split(',')[1];

      const savedFile = await Filesystem.writeFile({
        path: `diary-${diaryDate}.png`,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: '내 일기 공유하기',
        url: savedFile.uri,
        dialogTitle: '공유할 앱을 선택하세요',
      });
    } catch (error) {
      console.error('[일기 공유 실패]', error);
      toast('공유 중 오류가 발생했습니다');
    } finally {
      // 캡처 도중 예외가 나도 스타일이 원상 복구되도록 보장
      if (restore) restore();
    }
  }


  // ── 유틸리티 ────────────────────────────────────────────────────────────

  // 날짜 텍스트 클릭 시 숨겨진 date picker 열기 (create/edit 모드 전용)
  const handleDateTextClick = () => {
    if (mode === 'create' || mode === 'edit') {
      document.getElementById('hidden-date-picker').showPicker();
    }
  };


  // ── 렌더링 ──────────────────────────────────────────────────────────────
  return (
    <div
      ref={rootRef}
      onPointerDown={() => setSelectedStickerId(null)}
      className="relative w-full h-full flex flex-col items-center justify-between"
    >
      {/*
                    ── 스티커 전용 레이어  
                    
                    [핵심] 래퍼 div에 pointer-events-none 적용
                    → 래퍼 자체는 클릭을 통과시킴
                    → 개별 스티커 div만 decorate 모드에서 pointer-events-auto로 드래그 수신
                    → 스티커가 없는 영역(텍스트 칸 포함)은 클릭이 아래 레이어로 정상 통과
                    
                    [드래그 구현: Pointer Events API]
                    - 터치와 마우스를 단일 이벤트로 처리 (별도 touch 핸들러 불필요)
                    - onPointerDown  → draggingRef에 instanceId 기록 + pointer capture 등록
                    - onPointerMove  → 컨테이너 기준 % 계산 → onStickersChange로 부모 상태 갱신
                    - onPointerUp    → draggingRef 초기화
                    - onPointerCancel→ 전화 수신 등 강제 해제 시에도 드래그 정상 종료
                    
                    [나중에 추가할 기능]
                    - 스티커 삭제: 롱프레스 or 더블탭 시 삭제 버튼 노출
                    - 스티커 크기 조절: 핀치 제스처 or 리사이즈 핸들
                    - 스티커 회전: 두 손가락 회전 제스처
                */}
        <div className="absolute inset-0 z-60 pointer-events-none overflow-hidden">
          {stickers.map((sticker) => {
            const selected = isDecorate && selectedStickerId === sticker.instanceId;
            return (
              <div
                key={sticker.instanceId}
                className={`absolute select-none ${isDecorate ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : ''} ${selected ? 'outline-2 outline-dashed outline-white/90' : ''}`}
                style={{
                  left: `${sticker.x ?? 40}%`,
                  top: `${sticker.y ?? 40}%`,
                  width: `${sticker.size ?? DEFAULT_SIZE}%`,
                  aspectRatio: '1 / 1',
                  transform: `rotate(${sticker.rotation ?? 0}deg)`,
                  touchAction: 'none',
                }}
                onPointerDown={(e) => handleStickerPointerDown(e, sticker)}
                onPointerMove={handleStickerPointerMove}
                onPointerUp={handleStickerPointerUp}
                onPointerCancel={handleStickerPointerUp}
              >
                <img
                  src={sticker.img}
                  alt={sticker.id}
                  draggable="false"
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain pointer-events-none"
                />

                {selected && (
                  <>
                    {/* X 버튼 (우상단) */}
                    <button
                      className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => handleStickerRemove(e, sticker.instanceId)}
                      aria-label="스티커 삭제"
                    >✕</button>

                    {/* 크기 조절 핸들 (우하단) */}
                    <div
                      className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-sky-500 border-2 border-white touch-none"
                      onPointerDown={(e) => handleResizeDown(e, sticker)}
                      onPointerMove={(e) => handleResizeMove(e, sticker)}
                      onPointerUp={handleResizeUp}
                      onPointerCancel={handleResizeUp}
                    />

                    {/* 회전 핸들 (상단 중앙) */}
                    <div
                      className="absolute -top-9 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
                      onPointerDown={(e) => handleRotateDown(e, sticker)}
                      onPointerMove={(e) => handleRotateMove(e, sticker)}
                      onPointerUp={handleRotateUp}
                      onPointerCancel={handleRotateUp}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-4 h-4 text-emerald-600 pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                      </svg>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

      {/* ── 닫기 버튼 ── */}
      <div data-no-capture="true" className="absolute w-full h-full z-40 pointer-events-none">
        <CloseButton onClose={onClose} className="left-[5%] top-[5%] pointer-events-auto" />
      </div>

      {/* ── 일기장 본체: 모든 레이어의 기준 컨테이너 ──────────────────── */}
      <div
        ref={containerRef}
        className="relative w-[85%] h-fit flex justify-center top-5/10 -translate-y-1/2 aspect-[312/522]"
      >

        {/* ── 날짜 + 이모지 영역 (z-60) ─────────────────────────────── */}
        <div className="absolute w-[75%] h-[8%] pt-[2%] flex justify-between items-center z-60">

          {/* 날짜 */}
          <div className="absolute flex items-center">
            <span
              onClick={handleDateTextClick}
              className={`text-[#5A5A5A] font-bold text-sm }`}
            >
              {formatDisplayDate(diaryDate)}
            </span>
          </div>

          {/*
                        이모지 이미지
                        - 문자 이모지 대신 이미지 파일로 렌더링하여 디자인 일관성 유지
                        - selectedEmoji 있음: getDecoAssetUrl('emojis', selectedEmoji) 경로 사용
                        - 없음: 테마 기본 이모지 이미지 사용
                        - <img> 대신 background-image로 렌더링: html2canvas가 <img>의 object-contain을
                          비동기 로딩 타이밍과 맞물려 불안정하게 캡처하는 문제가 있어, 더 안정적인
                          background-image 방식으로 교체 (공유 캡처 시 비율 깨짐 방지)
                    */}
          <div className="absolute h-full w-[19%] right-[1%] pr-[5%] pointer-events-none">
            <div
              role="img"
              aria-label="emoji"
              className="w-full h-full"
              style={{
                backgroundImage: `url("${emojiImageSrc}")`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          </div>
        </div>

        {/* ── 수정/삭제/공유 드롭다운 (view 모드 전용, z-60) ──────────── */}
        {/* data-no-capture="true": 공유 시 캡처되는 이미지에 이 메뉴 버튼이 찍히지 않도록 html2canvas의 ignoreElements에서 제외 처리됨 */}
        {isView && (
          <div data-no-capture="true" className="absolute w-full flex justify-center pl-[80%] pt-[6%] text-sm z-70">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="outline-none"
              aria-label="메뉴 열기"
            >
              • • •
            </button>

            {isMenuOpen && (
              <div
                className="absolute aspect-[99/135] mt-[5%] w-24 z-80 overflow-hidden"
                style={{
                  backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'edit_delete_share_menu_box_x3')})`,
                  backgroundSize: '100% 100%',
                }}
              >
                <button className="mt-[2%] w-full h-[25%] font-semibold outline-none text-xs" onClick={handleEditNavigation}>수정</button>
                <button className="w-full h-[25%] text-red-500 text-xs font-semibold outline-none" onClick={handleDeleteMenuClick}>삭제</button>
                <button className="w-full h-[25%] text-red-500 text-2xs font-semibold outline-none" onClick={handleResetDeco}>꾸미기 초기화</button>
                <button className="w-full h-[25%]  text-xs font-semibold outline-none" onClick={handleShare}>공유</button>
              </div>
            )}
          </div>
        )}

        {/*
                    ── 그림 칸 클릭 전용 투명 레이어 (z-70) ───────────────────
                    - 이미지 위에 올라가는 투명 div, 클릭 이벤트 처리 전담
                    - create/edit: 이미지 있으면 Step5(결과확인), 없으면 Step2(옵션선택)
                    - decorate/view: pointer-events-none → 다른 레이어 이벤트 통과
                */}
        <div
          className={`absolute w-[77%] mt-[13%] aspect-[10/9] z-70 cursor-pointer ${(isDecorate || isView) ? 'pointer-events-none' : ''
            }`}
          onClick={(e) => {
            e.stopPropagation();
            if (isCreate || isEdit) {
              onStepChange?.(imageUrl ? 5 : 2);
            }
          }}
        />

        {/* ── 레이어 1: 일기 그림 이미지 (z-20, 가장 아래) ──────────── */}
        <div className="absolute w-[77%] mt-[13%] aspect-[10/9] flex justify-center z-20">
          {imageUrl ? (
            <img src={imageUrl}
            alt="일기 그림"
            crossOrigin="anonymous"   // 외부 이미지(Supabase Storage) 캡처 허용
            className="w-full h-full object-cover" />
          ) : (
            // 이미지 없을 때: 흰색 배경 + 현재 단계에 맞는 안내 문구
            <div className="w-full h-full bg-white flex items-center justify-center">
              <span className="text-gray-400 text-sm text-center px-2">
                {step === 1 && (isCreate || isEdit)
                  ? '본문 작성 후 그림 칸 클릭!'
                  : step === 4
                    ? 'AI가 그림을 그리는 중...'
                    : ''}
              </span>
            </div>
          )}
        </div>

        {/*
                    ── 레이어 2: 픽셀아트 프레임 (z-30) ────────────────────────
                    - frameImageSrc: selectedFrame 있으면 데코 프레임, 없으면 테마 기본 프레임
                    - 프레임 div 자체는 pointer-events-none (클릭 이벤트 하위 레이어로 통과)
                */}
        <div
          className="absolute w-full h-full z-30 pointer-events-none"
          style={{
            backgroundImage: `url(${frameImageSrc})`,
            backgroundSize: '100% 100%',
          }}
        />

        {/*
                    ── 레이어 3: 본문 텍스트 (z-50) ────────────────────────────
                    - 스티커 레이어(z-40)보다 위에 배치하여 텍스트 영역 클릭 항상 보장
                    - 프레임 영역 전체를 커버하되, 텍스트 칸 위치(pt-[88%])에서 시작
                    - isTextEditable: create/edit + step1 → textarea, 그 외 → <p> 읽기 전용
                    - 텍스트 칸 외 영역(그림 칸 위 등)은 pointer-events-none으로 클릭 통과
                      → 그림 칸 클릭 투명 레이어(z-70)가 정상 동작하도록 보장
                */}
        <div className="absolute w-full h-full z-50 pointer-events-none flex justify-center">
          <div className="absolute w-[75%] h-full flex pt-[88%] pb-[7%] no-scrollbar pointer-events-auto">
            {isTextEditable ? (
              <>
                <textarea
                  className="w-full h-full text-xs text-[#4A4A4A] leading-relaxed outline-none resize-none placeholder:text-[#A0A0A0] bg-transparent"
                  value={content}
                  onChange={(e) => {
                    const input = e.target.value;
                    const sliced = [...input].slice(0, MAX_LENGTH).join('');
                    onContentChange?.(sliced);
                  }}
                  placeholder="오늘의 일기를 작성해 보세요"
                  autoFocus
                />
                <div className="absolute top-[50%] right-[1%] text-right text-xs text-gray-400">
                  {length} / 160
                </div>
              </>
            ) : (
              <p className="text-xs text-[#4A4A4A] leading-relaxed w-full whitespace-pre-wrap overflow-y-auto no-scrollbar">
                {content}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* ── 하단 버튼 슬롯 (부모에서 주입) ── */}
      <div data-no-capture="true" className="w-full h-[20%] flex justify-center z-30">
        {footer}
      </div>

      {/* --- 최하단에 다이얼로그 레이어 추가 (z-index 70 이상) --- */}

      {/* 삭제 확인 팝업 */}
      {dialogState === 'confirm' && (
        <DeleteDialog
          onConfirm={handleActualDelete}
          onCancel={() => setDialogState(null)}
          maxWidth="320px"
        />
      )}

      {/* 삭제 완료 알림 팝업 */}
      {dialogState === 'result' && (
        <ResultDialog
          message="일기가 성공적으로 삭제되었습니다."
          onConfirm={handleResultConfirm}
          maxWidth="320px"
        />
      )}
      {/* 꾸미기 초기화 완료 알림 팝업 */}
      {dialogState === 'deco_reset_success' && (
        <ResultDialog
          message="배치된 프레임과 스티커가 초기화되었습니다."
          onConfirm={handleResultConfirm}
          maxWidth="320px"
        />
      )}

      {/* 날짜 중복 확인 팝업 */}
      {/* DiaryForm에서 날짜 변경 시 해당 날짜에 일기가 이미 있으면 띄워줌 */}
      {/* duplicateDateInfo가 null이 아닐 때만 렌더링됨 */}
      {duplicateDateInfo && (
        <DuplicateDateDialog
          onConfirm={onDuplicateConfirm}
          onCancel={onDuplicateCancel}
          maxWidth="320px"
        />
      )}

      {/* 저장 실패 다이얼로그 */}
      {saveError && (
        <SaveErrorDialog
          type={saveError}
          onClose={() => setSaveError(null)}
        />
      )}
    </div>
  );
};

export default DetailDiaryDialog;