/**
 * [Capacitor/Mobile 최적화]
 * 테마별 이미지 에셋의 절대 경로를 생성하여 반환합니다.
 * @param {string} currentThemeName - 현재 적용된 테마 (예: 'winter_light')
 * @param {string} assetFolderName - 폴더명 (예: 'icons', 'backgrounds')
 * @param {string} fileName - 파일명 (확장자 제외)
 * @returns {string} - 모바일 앱 환경에서도 깨지지 않는 이미지 경로
 */
export const getAssetUrl = (currentThemeName, assetFolderName, fileName) => {
    const DEFALUT_THEME_NAME = 'winter_light'; // 기본 테마 나중에 변경 예정

    try {
        const targetThemeName = currentThemeName || DEFALUT_THEME_NAME;

        // Public 폴더 기준 상대 경로
        return `/assets/theme/${targetThemeName}/${assetFolderName}/${fileName}.png`;

    } catch (error) { // 현재 테마에서 에셋을 찾는 도중 에러 발생, 경로 구조상 문제가 생기면 자동으로 기본테마 경로 반환
        console.warn(`[에셋]: ${currentThemeName}에 ${fileName}이 없어 기본테마인 ${DEFALUT_THEME_NAME}로 대체합니다.`);

        return `/assets/theme/${DEFALUT_THEME_NAME}/${assetFolderName}/${fileName}.png`;
    }
};

// 데코 아이템 에셋 불러오기
export const getDecoAssetUrl = (category, fileName) => {
    // category: 'frames', 'stickers', 'emojis'
    // fileName: 'sticker_cat' (확장자 제외)
    return `/assets/decorations/${category}/${fileName}.png`;
};

// ── [통합 데이터] 아이템 ID와 파일명 매핑 및 카테고리 분류 ──────────────────
export const DECO_ITEM_LIST = {
    frame: [
        { item_id: 20, img: 'winter_light_frame_x3' },
        { item_id: 21, img: 'yellow_light_frame_x3' },
    ],
    emoji: [
        { item_id: 22, img: 'bear_emoji_01_x3' },
        { item_id: 23, img: 'bear_emoji_02_x3' },
    ],
    sticker: [
        { item_id: 24, img: 'bear_sticker_01_x3' },
        { item_id: 25, img: 'bear_sticker_02_x3' },
    ],
    
};

// 역방향 조회를 위한 맵 (ID로 이미지명을 찾을 때 사용)
// reduce를 사용하여 DECO_ITEM_LIST 기반으로 자동 생성하면 관리가 더 편합니다.
export const ITEM_IMG_MAP = Object.values(DECO_ITEM_LIST)
    .flat()
    .reduce((acc, item) => {
        acc[item.item_id] = item.img;
        return acc;
    }, {});

// ── [설정] 테마별 기본 액자(프레임) 설정 ───────────────────────────────────
export const THEME_DEFAULT_FRAMES = {
    winter_light: { id: 20, img: 'winter_light_frame_x3' }, // 겨울 테마일 때 기본 액자
};