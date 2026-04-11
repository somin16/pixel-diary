import { getAssetUrl } from "../../utils/assetHelper";
import { useTheme } from "../../theme_states/useTheme";

export default function Home() {
  // 현재 테마 상태
  const currentTheme = useTheme((state) => state.currentTheme) 

  // 인라인 스타일로 배경 이미지를 동적으로 적용
  const backgroundStyle = {
    backgroundImage: `url(${getAssetUrl(currentTheme,'backgrounds', 'background_x3')})`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    height: '100%',
    width: '100%',
    position: 'relative'
  };
  return (
    <div style={backgroundStyle}/>
  );
}

