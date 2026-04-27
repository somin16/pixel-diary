import { useState } from "react";
import { getAssetUrl } from "../../utils/AssetHelper";
import CloseButton from "../common/CloseButton";
import ImageButton from "../common/ImageButton";
/**
 * @typedef {Object} DiaryDialogProps
 * @property {'view' | 'edit' | 'create'} mode - 다이얼로그 모드 (상세보기, 수정, 신규작성)
 * @property {string} currentTheme - 현재 앱의 테마
 * @property {string} [date] - 일기 날짜 (예: '26년 04월 26일')
 * @property {string} [imageUrl] - 일기 이미지 URL
 * @property {string} [content] - 일기 본문
 * @property {React.ReactNode} [footer] - 하단 버튼 영역에 렌더링될 커스텀 요소 (슬롯 방식)
 * @property {() => void} onClose - 다이얼로그를 닫을 때 실행되는 핸들러
 * @property {(data: {content: string, mode: string}) => void} [onSave] - 저장 버튼 클릭 시 호출되는 콜백 함수
 */

/**
 * 일기 상세 보기, 수정, 작성을 통합 관리하는 픽셀 아트 스타일 다이얼로그입니다.
 * * @param {DiaryDialogProps} props
 * @returns {JSX.Element}
 */

const DetailDiaryDialog = ({ 
    currentTheme,
    mode: initialMode = 'view', // 'view' | 'edit' | 'create'
    date,
    imageUrl,
    content,
    footer,
    onClose,
    onSave 
}) => {
    // 부모가 준 initialMode를 초기 상태로 설정
    const [mode, setMode] = useState(initialMode);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [tempText, setTempText] = useState(content || "");        

    // 현재 모드 판별 로직
    const isView = mode === 'view'; // 일기 상세 보기 모드
    const isEdit = mode === 'edit'; // 일기 수정 모드
    const isCreate = mode === 'create'; // 일기 작성 모드

    const handleSaveClick = () => {
        onSave({ content: tempText, mode:mode });
        if (mode === 'edit') setMode('view'); // 저장 후엔 보기 모드로 전환
    };


    return (
        <div className="relative w-full h-full flex justify-center items-center">
            {/* 닫기 버튼 X */}
            <div className="absolute w-full h-full pl-[5%] pt-[7%] z-10">
                <CloseButton />
            </div>
            <div className="relative w-[85%] h-fit flex justify-center aspect-[312/522]">

                {/* 상세보기(view)일 때만 '...' 메뉴 표시 */}
                {isView && (
                    <div className="absolute w-full flex justify-center pl-[80%] pt-[6%] text-sm z-40">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} alt="메뉴" className="outline-none">
                             • • •
                        </button>
                        
                        {isMenuOpen && (
                            <div 
                                className="absolute aspect-[99/102] mt-[5%] w-24 z-50 overflow-hidden"
                                style={{
                                    backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'edit_delete_share_menu_box_x3')})`,
                                    backgroundSize: "100% 100%"
                                }}
                            >
                                <button 
                                    className=" w-full p-[7.2%] text- font-semibold outline-none"
                                    // onClick={() => { setMode('edit'); setIsMenuOpen(false); }}
                                >
                                    수정
                                </button>
                                <button className=" w-full p-[7.2%] text-red-500 text-sm font-semibold outline-none">삭제</button>
                                <button className=" w-full p-[7.2%] text-sm font-semibold outline-none">공유</button>
                            </div>
                        )}
                    </div>
                )}

                {/* 레이어 1: 실제 일기 그림 (가장 아래에 위치) */}
                {/* 프레임의 흰색 영역 위치에 맞춰 absolute로 배치 */}
                <div className="absolute w-[77%] mt-[12%] aspect-square flex justify-center z-10">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt="그림"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        // 이미지가 없을 때 보여줄 기본 배경
                        <div className="w-full h-full bg-white flex items-center justify-center">
                            <span>{isCreate ? "그림 생성 대기 중..." : "그림이 없습니다."}</span>    
                        </div>
                    )}
                </div>

                {/* 레이어 2: 픽셀 아트 프레임 (그림 위에 덮어씌움) */}
                <div
                    className="relative w-full h-full z-20 flex justify-center"
                    style={{
                        backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'diary_frame_x3')})`,
                        backgroundSize: '100% 100%',
                    }}
                >
                    {/* 본문 텍스트 영역 */}
                    <div className="absolute w-[75%] h-full flex pt-[88%] pb-[7%] no-scrollbar">
                        {isView ? (
                            <p className="text-base text-[#4A4A4A] leading-relaxed w-full whitespace-pre-wrap">
                                {content}
                            </p>
                        ) : (
                            <textarea
                                className="w-full h-full text-[12px] text-[#4A4A4A] leading-relaxed text-center outline-none resize-none placeholder:text-[#A0A0A0]"
                                value={tempText}
                                placeholder="오늘의 일기를 작성해 보세요"
                                autoFocus
                            />
                        )}
                    </div>
                </div>
            </div>
            <div className="flex justify-center">
                {footer}
            </div>
        </div>

    );
};

export default DetailDiaryDialog;