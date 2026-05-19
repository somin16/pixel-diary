import { getAssetUrl } from "../../../utils/AssetHelper";

/**
 * @typedef {Object} AnnouncementCardProps
 * @property {string} title - 공지사항 제목
 * @property {string} contentPreview - 내용 미리보기 (100자)
 * @property {string} category - 카테고리
 * @property {string} date - 작성일
 * @property {number} viewCount - 조회수
 * @property {function} onClick - 카드 클릭 시 상세 페이지로 이동
 * @property {string} currentTheme - 현재 테마 (배경 이미지 결정)
 */
// 공지사항 목록 카드 컴포넌트
const AnnouncementCard = ({ title, contentPreview, category, date, viewCount, onClick, currentTheme }) => {

    const CATEGORY_STYLE = {
        공지: "bg-blue-100 border-blue-400 text-blue-600",
        업데이트: "bg-green-100 border-green-400 text-green-600",
        이벤트: "bg-pink-100 border-pink-400 text-pink-600",
        점검: "bg-orange-100 border-orange-400 text-orange-600",
    };

    return (
        <div
            onClick={onClick}
            className="relative w-full aspect-[318/105] mb-[4%]"
            style={{
                backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'announcement_alarm_list_box_x3')})`,
                backgroundSize: "100% 100%",

            }}
        >
            <div className="absolute w-full h-full p-[5%]">
                {/* 제목 */}
                <p className="font-bold text-base line-clamp-1 text-gray-800">{title}</p>

                {/* 내용 미리보기 (최대 2줄)*/}
                <p className="h-[45%] text-2xs line-clamp-2 text-gray-600">{contentPreview}</p>

                {/* 날짜 & 카테고리 태그 & 조회수 */}
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-[6%]">
                        <p className="text-xs text-gray-500 whitespace-nowrap">{date}</p>
                        {category && (
                            <p className={`text-2xs rounded-sm border-[1.5px] whitespace-nowrap px-[5%] pb-[2%] pt-[2%] ${CATEGORY_STYLE[category]}`}>
                                {category}
                            </p>
                        )}
                    </div>
                    <p className="text-xs text-gray-500">{viewCount}</p>
                </div>
            </div>
        </div>
    );
}

export default AnnouncementCard;