import { useParams } from "react-router-dom";
import DetailDiaryDialog from "../../components/diary/DetailDiaryDialog";
import { useTheme } from "../../hooks/useTheme";
import { getAssetUrl } from "../../utils/AssetHelper";

export default function DiaryDetail(){

    // 현재 테마 상태
    const currentTheme = useTheme((state) => state.currentTheme);
    
    const { date } = useParams(); // URL에서 날짜를 가져옴

    // 더미 데이터 설정
    const dummyDiary = {
        date: date ? date.replace(/-/g, '. ') : "26. 04. 26", // 2026. 04. 26 형식으로 변환

        content: "오늘은 펭귄들과 함께 일기 앱을 만들었다. 에러 때문에 고생했지만 열심히 해결했다! 내일은 더 열심히 만들어야지. ❤️🩷🧡💛💚💙🩵💜🤎🖤🩶🤍💔❤️‍🔥❤️‍🩹❣️💕💞💓💗💖💘💝",
    };

    return(
        <div
            className="relative w-full h-full"
            style={{
                backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds','background_x3' )})`,
                backgroundSize: '100% 100%'
            }}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-1"/>

            <DetailDiaryDialog
                currentTheme={currentTheme}
                mode="view"
                date={dummyDiary.date}
                imageUrl=""
                content={dummyDiary.content}
            />
        </div> 
    );
};