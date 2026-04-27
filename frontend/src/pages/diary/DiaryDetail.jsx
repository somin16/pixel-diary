import DetailDiaryDialog from "../../components/diary/DetailDiaryDialog";
import { useTheme } from "../../hooks/useTheme";
import { getAssetUrl } from "../../utils/AssetHelper";

export default function DiaryDetail(){

    // 현재 테마 상태
    const currentTheme = useTheme((state) => state.currentTheme);
    
    return(
        <div
            className="w-full h-full"
            style={{
                backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds','background_x3' )})`,
                backgroundSize: '100% 100%'
            }}
        >
        </div>
        
    );
};