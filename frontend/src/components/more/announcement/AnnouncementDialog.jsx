import { getAssetUrl } from "../../../utils/AssetHelper"
import { useState } from "react";

/**
 * @typedef {Object} AnnouncementDialogProps
 * @property {'view' | 'create' | 'edit'} mode - 다이얼로그 모드 (조회/작성/수정)
 * @property {string} title - 공지사항 제목
 * @property {string} content - 공지사항 내용
 * @property {string} category - 카테고리
 * @property {string} date - 작성일 또는 수정일
 * @property {number} viewCount - 조회수
 * @property {function} onDelete - 삭제 버튼 클릭 시 실행 (view 모드)
 * @property {function} onEdit - 수정 버튼 클릭 시 실행 (view 모드)
 * @property {function} onSubmit - 작성/수정 완료 버튼 클릭 시 실행 (create/edit 모드)
 * @property {boolean} isAdmin - 관리자 여부 (점 3개 메뉴 표시 여부)
 * @property {string} currentTheme - 현재 테마 (배경 이미지 결정)
 */

// 공지사항 다이얼로그 컴포넌트
const AnnouncementDialog = ({ mode = 'view', title: initialTitle, content: initialContent, category: initialCategory, date, viewCount, onDelete, onEdit, onSubmit, isAdmin, currentTheme }) => {

    const [menuOpen, setMenuOpen] = useState(false);

    // 작성/수정 모드에서 사용할 입력값 상태
    const [title, setTitle] = useState(initialTitle || '');
    const [content, setContent] = useState(initialContent || '');
    const [category, setCategory] = useState(initialCategory || '공지');

    const CATEGORIES = ['공지', '업데이트', '이벤트', '점검'];

    const CATEGORY_STYLE = {
        공지: "bg-blue-100 border-blue-400 text-blue-600",
        업데이트: "bg-green-100 border-green-400 text-green-600",
        이벤트: "bg-pink-100 border-pink-400 text-pink-600",
        점검: "bg-orange-100 border-orange-400 text-orange-600",
    };

    return (
        <div
            className="relative w-full aspect-[318/522]"
            style={{
                backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'announcement_alarm_page_box_x3')})`,
                backgroundSize: '100% 100%'
            }}
        >
            <div className="relative w-full h-full p-[5%]">

                {/* 점 3개 메뉴 (조회 모드 + 관리자만) */}
                {mode === 'view' && isAdmin && (
                    <div className="absolute top-[2%] right-[5%]">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="text-gray-500 text-xs font-bold outline-none"
                        >
                            • • •
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 bg-white border border-gray-200 rounded-lg shadow-md z-10">
                                <button
                                    onClick={() => { setMenuOpen(false); onEdit(); }}
                                    className="block w-full text-left px-4 py-2 text-sm whitespace-nowrap text-gray-700 hover:bg-gray-100"
                                >
                                    수정
                                </button>
                                <button
                                    onClick={() => { setMenuOpen(false); onDelete(); }}
                                    className="block w-full text-left px-4 py-2 text-sm whitespace-nowrap text-red-500 hover:bg-gray-100"
                                >
                                    삭제
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 조회 모드 */}
                {mode === 'view' && (
                    <>
                        {/* 제목 */}
                        <p className="font-bold text-base h-[5%] items-center flex text-gray-800">{initialTitle}</p>

                        {/* 날짜 & 카테고리 태그 & 조회수 */}
                        <div className="flex h-[5%] justify-between items-center">
                            <div className="flex items-center gap-[6%]">
                                <p className="text-xs text-gray-500 whitespace-nowrap">{date}</p>
                                {initialCategory && (
                                    <p className={`text-2xs rounded-sm border-[1.5px] whitespace-nowrap px-[5%] pb-[1%] pt-[2%] ${CATEGORY_STYLE[initialCategory]}`}>
                                        {initialCategory}
                                    </p>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">{viewCount}</p>
                        </div>

                        {/* 구분선 */}
                        <div
                            className="h-[0.5%] mt-[1%]"
                            style={{
                                backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'line_x3')})`,
                                backgroundSize: '100% 100%'
                            }}
                        />

                        {/* 내용 */}
                        <p className="text-2xs text-gray-600 py-[5%]">{initialContent}</p>
                    </>
                )}

                {/* 작성/수정 모드 */}
                {(mode === 'create' || mode === 'edit') && (
                    <>
                        {/* 카테고리 선택 */}
                        <div className="flex gap-[2%] h-[5%] items-center">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat === category ? '' : cat)}
                                    className={`text-2xs rounded-sm border-[1.5px] whitespace-nowrap px-[3%] pb-[1%] pt-[1.5%] outline-none ${category === cat
                                            ? CATEGORY_STYLE[cat]
                                            : 'bg-white border-gray-300 text-gray-500'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}

                            {/* 직접 입력 */}
                            <input
                                type="text"
                                value={CATEGORIES.includes(category) ? '' : category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="직접 입력"
                                className="text-2xs border-b border-gray-400 outline-none w-[15%] bg-transparent text-gray-600 placeholder-gray-300"
                            />
                        </div>

                        {/* 제목 입력 */}
                        <input
                            type="text"
                            placeholder="제목을 입력하세요"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full h-[10%] bg-transparent text-base font-bold text-gray-800 outline-none"
                        />

                        {/* 구분선 */}
                        <div
                            className="h-[0.5%] mt-[1%]"
                            style={{
                                backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'line_x3')})`,
                                backgroundSize: '100% 100%'
                            }}
                        />

                        {/* 내용 입력 */}
                        <textarea
                            placeholder="내용을 입력하세요"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-[72%] mt-[3%] bg-transparent text-xs text-gray-600 outline-none resize-none py-[3%]"
                        />

                        {/* 작성/수정 완료 버튼 */}
                        <button
                            onClick={() => onSubmit({ title, content, category: category || '공지' })}
                            className="w-full h-[8%] bg-blue-900 text-white rounded-xl text-lg font-bold"
                        >
                            {mode === 'edit' ? '수정 완료' : '작성 완료'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default AnnouncementDialog;