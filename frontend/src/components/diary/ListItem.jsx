import { getAssetUrl } from "../../utils/AssetHelper";

/**
 * @typedef {Object} DiaryItemProps
 * @property {string} currentTheme - 현재 애플리케이션의 테마 (에셋 경로 결정)
 * @property {string | null} imageUrl - 일기 그림 이미지 URL (null일 경우 흰색 배경)
 * @property {string} date - 하단 바에 표시될 날짜 (예: '26년 03월 31일')
 * @property {() => void} onClick - 아이템 클릭 시 실행될 핸들러 함수
 */

/**
 * 픽셀 다이어리 갤러리 리스트의 개별 아이템 컴포넌트입니다.
 * * @component
 * @param {DiaryItemProps} props
 * @description
 * - **레이아웃**: 3개 레이어 중첩 구조 (그림 > 프레임 > 텍스트)
 * - **비율**: 디자인 원본 비율(111:117) 고정으로 픽셀 왜곡 방지
 * - **방식**: 투명 프레임을 그림 위에 덮어씌우는 크로마키 합성 방식
 */

// diary/ListItem 컴포넌트 선언
const ListItem = ({ currentTheme, imageUrl, date, onClick }) => {

    // 전체 아이템의 비율을 정의하는 스타일 (픽셀 왜곡 방지)
    const itemContainerStyle = {
        aspectRatio: '111/117', // 디자인 원본 비율 유지
        width: '100%', 
    };

    return (
        <div
            className="relative flex flex-col items-center cursor-pointer overflow-hidden"
            style={itemContainerStyle}
            onClick={onClick}
        >
            {/* 레이어 1: 실제 일기 그림 (가장 아래에 위치) */}
            {/* 프레임의 흰색 영역 위치에 맞춰 absolute로 배치 */}
            <div className="absolute aspect-square w-full p-[2%] overflow-hidden rounded-[16%] z-10">
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt="일기 그림" 
                        className="w-full h-full object-cover" 
                    />
                ) : (
                    // 이미지가 없을 때 보여줄 기본 배경
                    <div className="w-full h-full bg-white" />
                )}
            </div>

            {/* 레이어 2: 픽셀 아트 프레임 (그림 위에 덮어씌움) */}
            <div 
                className="absolute w-full h-full z-20" 
                style={{
                    backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'gallery_box_x3')})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center'
                }} 
            />
            
            {/* 레이어 3: 날짜 텍스트 (프레임의 파란 바 위에 위치) */}
            <span className="w-full absolute bottom-[6%] text-center text-m z-30">
                {date}
            </span>    
        </div>
    )
}

export default ListItem;