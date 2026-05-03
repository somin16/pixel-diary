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