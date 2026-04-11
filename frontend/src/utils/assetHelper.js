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

    // src/assets 기준 절대 경로 스타일 유지
    const assetPath = `/src/assets/theme/${targetThemeName}/${assetFolderName}/${fileName}.png`;
    
    // import.meta.url을 기준으로 경로를 해석해야 모바일 앱 변환 시 에셋이 포함됩니다.
    return new URL(assetPath, import.meta.url).href;
  } catch (error) { // 현재 테마에서 에셋을 찾는 도중 에러 발생, 경로 구조상 문제가 생기면 자동으로 기본테마 경로 반환
    console.warn(`[에셋]: ${currentThemeName}에 ${fileName}이 없어 기본테마인 ${DEFALUT_THEME_NAME}로 대체합니다.`);
    
    const defaultThemePath = `/src/assets/theme/${DEFALUT_THEME_NAME}/${assetFolderName}/${fileName}.png`;
    return new URL(defaultThemePath, import.meta.url).href;
  }
};