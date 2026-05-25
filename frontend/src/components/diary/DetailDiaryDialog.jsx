import { useState, useRef, useCallback } from "react";
import { getAssetUrl } from "../../utils/AssetHelper";
import CloseButton from "../common/CloseButton";
import { useNavigate } from "react-router-dom";
import { formatDisplayDate } from "../../utils/DateFormatter";
import { authFetch } from "../../utils/AuthHelper";
import DeleteDialog from "./dialog/DeleteDialog";
import ResultDialog from "../common/dialog/ResultDialog";
import DuplicateDateDialog from "./dialog/DuplicateDateDialog";
import SaveErrorDialog from "./dialog/SaveErrorDialog";
import toast from "react-hot-toast";

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

    const MAX_LENGTH = 160;
    const length = (content || '').length

    // ── 스티커 드래그용 ref ───────────────────────────────────────────────────
    // containerRef: 일기장 컨테이너 DOM 참조 → 드래그 위치를 % 로 계산할 때 기준점
    // draggingRef:  현재 드래그 중인 스티커의 instanceId 보관
    //               → state 대신 ref를 쓰는 이유: 값이 바뀌어도 리렌더를 일으키지 않아서
    //                 pointermove 이벤트 핸들러가 매 프레임 호출될 때 성능 저하 없이 참조 가능
    const containerRef = useRef(null);
    const draggingRef = useRef(null);

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

    /**
     * [드래그 시작] onPointerDown
     * - 꾸미기 모드에서만 동작
     * - setPointerCapture: 손가락/커서가 스티커 영역 밖으로 나가도 이벤트 계속 수신
     *
     * @param {React.PointerEvent} e
     * @param {number} instanceId - 드래그를 시작한 스티커의 instanceId
     */
    const handleStickerPointerDown = useCallback((e, instanceId) => {
        if (!isDecorate) return;

        e.preventDefault();
        e.stopPropagation(); // 아래 레이어(그림 칸 클릭 등)로 이벤트 전파 차단

        draggingRef.current = instanceId;
        e.currentTarget.setPointerCapture(e.pointerId);
    }, [isDecorate]);

    /**
     * [드래그 이동] onPointerMove
     * - 포인터 위치를 일기장 컨테이너 기준 %로 변환
     * - 스티커 중앙이 포인터 위치에 오도록 스티커 크기(20%)의 절반(10%)만큼 보정
     * - 스티커가 일기장 밖으로 나가지 않도록 0~80% 범위로 clamp
     *   (80%로 제한: 스티커 자체 너비가 20%이므로 80% 이상이면 오른쪽/아래쪽이 잘림)
     *
     * @param {React.PointerEvent} e
     */
    const handleStickerPointerMove = useCallback((e) => {
        if (draggingRef.current === null) return;
        if (!containerRef.current) return;

        // 일기장 컨테이너의 화면상 크기와 위치
        const rect = containerRef.current.getBoundingClientRect();

        // 포인터 좌표 → 컨테이너 기준 % 변환 (스티커 중앙이 포인터에 오도록 -10% 보정)
        const x = ((e.clientX - rect.left) / rect.width) * 100 - 10;
        const y = ((e.clientY - rect.top) / rect.height) * 100 - 10;

        // 범위 제한: 스티커가 컨테이너 밖으로 벗어나지 않도록
        const clampedX = Math.min(Math.max(x, 0), 80);
        const clampedY = Math.min(Math.max(y, 0), 80);

        // 드래그 중인 스티커만 x, y 업데이트 → 부모(DiaryForm) 상태에 반영
        onStickersChange?.(
            stickers.map((s) =>
                s.instanceId === draggingRef.current
                    ? { ...s, x: clampedX, y: clampedY }
                    : s
            )
        );
    }, [stickers, onStickersChange]);

    /**
     * [드래그 종료] onPointerUp / onPointerCancel
     * - draggingRef를 null로 초기화하여 다음 드래그 준비
     * - onPointerCancel: 전화 수신 등으로 포인터가 예기치 않게 해제될 때도 정상 종료
     */
    const handleStickerPointerUp = useCallback(() => {
        draggingRef.current = null;
    }, []);


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
    async function handleActualDelete() {
        try {
            // authFetch 사용 (이전에 만든 도우미 함수)
            // 성공 시 바로 JSON 결과가 반환됨
            await authFetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/diaries/${diaryId}/`, {
                method: 'DELETE',
            });

            //삭제 성공 시 목록 캐시를 날려버립니다.
            sessionStorage.removeItem('diary_list');

            // 성공하면 결과 창 띄우기
            setDialogState('result');
        } catch (error) {
            console.error("삭제 실패:", error);
            alert(error.message || "삭제 중 오류가 발생했습니다.");
            setDialogState(null);
        }
    }

    // 3. ResultDialog에서 '확인'을 눌렀을 때 처리 분기
    async function handleResultConfirm() {
        // 대입하기 전에 현재의 dialogState 상태를 먼저 변수에 저장합니다.
        const currentStatus = dialogState;

        setDialogState(null);

        if (currentStatus === 'result') {
            if (onClose) onClose(); // 상세 다이얼로그 닫기
            // 일기 삭제 성공 시에만 목록으로 이동
            navigate('/diary/list', { replace: true });
            return; // 삭제 후엔 onRefresh 불필요하므로 여기서 종료
        }
        // 'deco_reset_success'일 때는 아무 데도 가지 않고 이 자리에 가만히 유지됩니다.
        // 부모에게 서버에서 최신 일기 데이터를 다시 호출하라고 명령!
            await onRefresh();
    }

    // 꾸미기 초기화 
    async function handleResetDeco() {
        try {
            setIsMenuOpen(false);

            // authFetch 이용해 꾸미기 초기화 API 호출
            await authFetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/diaries/${diaryId}/deco/`, {
                method: 'DELETE',
            });

            //삭제 성공 시 목록 캐시를 날려버립니다.
            sessionStorage.removeItem('diary_list');

            // 성공하면 결과 창 띄우기
            setDialogState('deco_reset_success');


        } catch (error) {
            console.error("꾸미기 초기화 실패:", error);
            toast( "꾸미기 내용이 없습니다");
            setDialogState(null);
        }
    }

    // 공유 (TODO: 구현)
    function handleShare() {
        setIsMenuOpen(false);
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
        <div className="relative w-full h-full flex flex-col items-center justify-between">

            {/* ── 닫기 버튼 ── */}
            <div className="absolute w-full h-full z-40 pointer-events-none">
                <CloseButton onClose={onClose} className="left-[5%] top-[5%] pointer-events-auto" />
            </div>

            {/* ── 일기장 본체: 모든 레이어의 기준 컨테이너 ──────────────────── */}
            {/* containerRef: 스티커 드래그 위치 % 계산의 기준점으로 사용 */}
            <div
                ref={containerRef}
                className="relative w-[85%] h-fit flex justify-center top-5/10 -translate-y-1/2 aspect-[312/522]"
            >

                {/* ── 날짜 + 이모지 영역 (z-60) ─────────────────────────────── */}
                <div className="absolute w-[75%] h-[8%] pt-[2%] flex justify-between items-center z-60">

                    {/* 날짜: create/edit 모드에서 클릭 시 date picker 열림 */}
                    <div className="absolute flex items-center">
                        <span
                            onClick={handleDateTextClick}
                            className={`text-[#5A5A5A] font-bold text-sm tracking-tighter ${(mode === 'create' || mode === 'edit') ? 'cursor-pointer hover:text-blue-500' : ''
                                }`}
                        >
                            {formatDisplayDate(diaryDate)}
                        </span>

                        {/*
                            숨겨진 날짜 선택기
                            - handleDateTextClick에서 .showPicker()로 프로그래밍 방식으로 열림
                            - 값 변경 시 "YYYY-MM-DD" → "YYYY. MM. DD" 변환 후 onDateChange 호출
                        */}
                        <input
                            id="hidden-date-picker"
                            type="date"
                            className="absolute opacity-0 pointer-events-none w-0 h-0"
                            value={diaryDate ?? ""}
                            onChange={(e) => {
                                const newDate = e.target.value;
                                if (!newDate) return;
                                onDateChange?.(newDate.replace(/-/g, '. '));
                            }}
                        />
                    </div>

                    {/*
                        이모지 이미지
                        - 문자 이모지 대신 이미지 파일로 렌더링하여 디자인 일관성 유지
                        - selectedEmoji 있음: getDecoAssetUrl('emojis', selectedEmoji) 경로 사용
                        - 없음: 테마 기본 이모지 이미지 사용
                        - onError: 이미지 로드 실패 시 숨김 처리 (레이아웃 깨짐 방지)
                    */}
                    <div className="absolute h-full w-[17%] aspect-square right-[1%] pr-[5%] pointer-events-none">
                        <img
                            src={emojiImageSrc}
                            alt="emoji"
                            className="w-full h-full object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    </div>
                </div>

                {/* ── 수정/삭제/공유 드롭다운 (view 모드 전용, z-60) ──────────── */}
                {isView && (
                    <div className="absolute w-full flex justify-center pl-[80%] pt-[6%] text-sm z-70">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="outline-none"
                            aria-label="메뉴 열기"
                        >
                            • • •
                        </button>

                        {isMenuOpen && (
                            <div
                                className="absolute aspect-[99/102] mt-[5%] w-24 z-80 overflow-hidden"
                                style={{
                                    backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'edit_delete_share_menu_box_x3')})`,
                                    backgroundSize: '100% 100%',
                                }}
                            >
                                <button className="mt-[2%] w-full h-[32%] font-semibold outline-none text-xs" onClick={handleEditNavigation}>수정</button>
                                <button className="w-full h-[32%] text-red-500 text-xs font-semibold outline-none" onClick={handleDeleteMenuClick}>삭제</button>
                                <button className="w-full h-[32%] text-red-500 text-2xs font-semibold outline-none" onClick={handleResetDeco}>꾸미기 초기화</button>
                                {/* <button className="w-full h-[32%]  text-xs font-semibold outline-none" onClick={handleShare}>공유</button> 나중에 공유기능 추가되면 그때 주석 해제 */}
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
                        <img src={imageUrl} alt="일기 그림" className="w-full h-full object-cover" />
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
                    ── 레이어 3: 스티커 (z-60) ──────────────────────────────────
                    
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
                <div className="absolute inset-0 z-60 pointer-events-none">
                    {stickers.map((sticker) => (
                        <div
                            key={sticker.instanceId}
                            className={`absolute select-none ${
                                // decorate 모드: 스티커 개별 div만 pointer-events-auto로 드래그 수신
                                // 그 외 모드: pointer-events-none 유지 (래퍼 상속)
                                isDecorate ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : ''
                                }`}
                            style={{
                                // sticker.x, sticker.y 미설정 시 기본값 40% (중앙 근처)
                                // 드래그 후에는 handleStickerPointerMove에서 계산된 값으로 업데이트
                                left: `${sticker.x ?? 40}%`,
                                top: `${sticker.y ?? 40}%`,
                                width: '20%',
                                aspectRatio: '1 / 1',
                                touchAction: 'none', // 브라우저 기본 스크롤/줌 동작 차단
                            }}
                            onPointerDown={(e) => handleStickerPointerDown(e, sticker.instanceId)}
                            onPointerMove={handleStickerPointerMove}
                            onPointerUp={handleStickerPointerUp}
                            onPointerCancel={handleStickerPointerUp}
                        >
                            <img
                                src={sticker.img}
                                alt={sticker.id}
                                draggable="false"       // 브라우저 기본 이미지 드래그 비활성화
                                className="w-full h-full object-contain pointer-events-none"
                            />
                        </div>
                    ))}
                </div>

                {/*
                    ── 레이어 4: 본문 텍스트 (z-50) ────────────────────────────
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
            <div className="w-full h-[20%] flex justify-center z-30">
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