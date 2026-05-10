import { getAssetUrl } from "../../../utils/AssetHelper";

/**
 * @typedef {Object} AnnouncementCardProps
 * @property {string} title - 공지사항 제목
 * @property {string} contentPreview - 내용 미리보기 (100자)
 * @property {string} date - 작성일
 * @property {number} viewCount - 조회수
 * @property {function} onClick - 카드 클릭 시 상세 페이지로 이동
 * @property {string} currentTheme - 현재 테마 (배경 이미지 결정)
 */
// 공지사항 목록 카드 컴포넌트
const AnnouncementCard = ({ title, contentPreview, date, viewCount, onClick, currentTheme }) => {
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
                <p className="font-bold text-base text-gray-800">{title}</p>

                {/* 내용 미리보기 (최대 2줄)*/}
                <p className="h-[55%] text-2xs line-clamp-2 text-gray-600">{contentPreview}</p>

                {/* 날짜 & 조회수 */}
                <div className="flex justify-between items-end">
                    <p className="text-xs text-gray-500">{date}</p>
                    <p className="text-xs text-gray-500">{viewCount}</p>
                </div>
            </div>
        </div>
    );
}

export default AnnouncementCard;