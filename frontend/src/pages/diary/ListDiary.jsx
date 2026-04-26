import { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { getAssetUrl } from "../../utils/AssetHelper";
import ListDiaryItem from '../../components/diary/ListDiaryItem';

// 일기 목록 화면 diary/ListGallery.jsx
export default function ListDiary() {
    // 현재 테마
    const currentTheme = useTheme((state) => state.currentTheme);

    // 테스트용 가짜 데이터 (나중에 Supabase에서 가져올 예정)
    const dummyDiaries = Array(30).fill({
    id: 1,
    imageUrl: null,
    date: '26년 03월 31일'
    });

    // 인라인 스타일로 배경 이미지를 동적으로 적용
    const backgroundStyle = {
        backgroundImage: `url(${getAssetUrl(currentTheme,'backgrounds', 'background_x3')})`,
        backgroundSize: '100% 100%',
    };

  return (
        <div 
            className="w-full h-screen overflow-hidden flex flex-col"
            style={backgroundStyle}
        >
            <div className='flex-1 overflow-y-auto no-scrollbar pb-[120%]'>
                {/* 3열 그리드 설정 */}
                <div 
                    className="grid grid-cols-3 gap-x-[3%] gap-y-[1%] p-[2%] items-start"
                    style={{ gridAutoRows: 'min-content'}}
                >
                    {dummyDiaries.map((diary, index) => (
                    <ListDiaryItem // diary/ListDiaryItem 컴포넌트 사용
                        key={index}
                        currentTheme={currentTheme}
                        imageUrl={diary.imageUrl}
                        date={diary.date}
                        onClick={() => console.log(`${index}번째 일기 클릭`)}
                    />
                    ))}
                </div>
            </div>

            
        </div>
  );
};