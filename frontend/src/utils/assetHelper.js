/**
 * 테마별 에셋 경로를 반환하는 헬퍼 함수
 * @param {string} theme - 현재 적용된 테마명 (예: 'winter_light')
 * @param {string} folder - 에셋이 담긴 폴더명 (예: 'icon', 'background')
 * @param {string} name - 파일명 (확장자 제외)
 * @returns {string} - 최종 이미지 URL
 */
export const getAssetUrl = (theme, folder, name) => {
  // 기준점은 항상 이 assetHelper.js 파일 위치입니다.

  try {
    return new URL(`/src/assets/theme/${theme}/${folder}/${name}.png`, import.meta.url).href;
  } catch (error) {
    console.error("에셋을 찾을 수 없습니다:", theme, folder, name);
    return ""; // 에러 발생 시 빈 문자열 반환
  }
};