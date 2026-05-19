import { useState } from "react";
import { getAssetUrl } from "../../utils/AssetHelper";
import ImageButton from "../common/ImageButton";
import CloseButton from "../common/CloseButton";

/**
 * 일기 AI 그림 생성 옵션 선택 컴포넌트 (Step 3)
 * 태그를 추가/제거하여 AI 이미지 생성 옵션을 설정합니다
 * 
 * @param {Object} props
 * @param {string} props.currentTheme - 현재 앱 테마
 * @param {string[]} props.tags - 현재 선택된 태그 목록
 * @param {(tags: string[]) => void} props.onTagsChange - 태그 변경 핸들러
 * @param {() => void} props.onGenerate - 그림 생성하기 버튼 클릭 핸들러
 */
// ... (상단 import 동일)

const DiaryOptionSelector = ({ currentTheme, tags = [], onTagsChange, onGenerate, onClose, footer }) => {

    const [inputValue, setInputValue] = useState('');
    const [removeValue, setRemoveValue] = useState(''); // 제거용 입력창 상태 추가

    // 추가 로직
    const handleAddTag = () => {
        const trimmed = inputValue.trim();
        if (trimmed && !tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
            onTagsChange([...tags, trimmed]);
        }
        setInputValue('');
    };

    // 제거 로직 (제거 태그는 앞에 '-'를 붙이거나 별도 처리하는 방식 추천)
    const handleAddNegativeTag = () => {
        const trimmed = removeValue.trim();
        if (trimmed) {
            // 제거용 태그임을 표시하기 위해 '-' 접두사 활용 예시
            const negativeTag = `-${trimmed}`;
            if (!tags.includes(negativeTag)) {
                onTagsChange([...tags, negativeTag]);
            }
        }
        setRemoveValue('');
    };

    const handleRemoveTag = (targetTag) => {
        onTagsChange(tags.filter((tag) => tag !== targetTag));
    };

    return (
        <div
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs z-[990]"
        >
            {/* 닫기 버튼 */}
            <div className="absolute w-full h-full z-50 pointer-events-none">
                <CloseButton onClose={onClose} className="left-[85%] top-[17%] pointer-events-auto" />
            </div>

            {/* 메인 컨테이너: 이미지 박스 크기에 맞춤 */}
            <div
                className="relative w-[90%] aspect-[336/411] flex flex-col items-center z-50"
                onClick={(e) => e.stopPropagation()} // 박스 클릭 시 닫힘 방지
                style={{
                    backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'option_box_x3')})`,
                    backgroundSize: 'contain',
                }}
            >

                {/* 내부 입력 창 */}
                <div className="absolute w-full h-full pr-[10%] pl-[10%] pt-[13%]">
                    {/* 2. 상단 태그 리스트 영역 (노란색 테두리 박스 안쪽 느낌) */}
                    <div className="w-full h-[53%] overflow-y-auto no-scrollbar flex flex-wrap content-start gap-[3%] p-[5%] ">
                        {tags.map((tag) => (
                            <div key={tag}
                                className={`flex items-center px-[2%] py-[1%] rounded text-sm border ${tag.startsWith('-')
                                        ? 'bg-[#FFF0F0] border-[#FFC7C7] border-[3px] rounded-lg text-[#FF7396]' // 제거 태그 스타일
                                        : 'bg-[#FCFFE2] border-[#C9EA77] border-[3px] rounded-lg text-[#769357]' // 추가 태그 스타일
                                    }`}
                            >
                                {tag.startsWith('-') ? tag.substring(1) : tag}
                                <button onClick={() => handleRemoveTag(tag)} className="ml-1 opacity-60 outline-none">×</button>
                            </div>
                        ))}
                    </div>

                    {/* 3. 추가 입력창 (초록색) */}
                    <div
                        className="w-full aspect-[270/51] mt-[7%] flex items-center "
                        style={{
                            backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'option_positive_input_box_x3')})`,
                            backgroundSize: '100% 100%',
                        }}
                    >
                        <span className="text-sm text-[#4A4A4A] m-[4%] shrink-0">추가:</span>
                        <input
                            className="w-full bg-transparent outline-none text-sm text-[#4A4A4A]"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        />
                        <ImageButton
                            label="↑"
                            onClick={handleAddTag}
                            className=" w-[17%] aspect-square m-[4%]"
                            imageSrc={getAssetUrl(currentTheme, 'boxes', 'positive_option_box_x2')}
                            textOption="text-sm text-[yellowgreen]"
                        />
                    </div>

                    {/* 4. 제거 입력창 (빨간색) */}
                    <div
                        className="w-full aspect-[270/51] mt-[5%] flex items-center"
                        style={{
                            backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'option_negative_input_box_x3')})`,
                            backgroundSize: '100% 100%',
                        }}
                    >
                        <span className="text-sm text-[#4A4A4A] m-[4%] shrink-0">제거:</span>
                        <input
                            className="w-full bg-transparent outline-none text-sm text-[#4A4A4A]"
                            value={removeValue}
                            onChange={(e) => setRemoveValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddNegativeTag()}
                        />
                        <ImageButton
                            label="↑"
                            onClick={handleAddNegativeTag}
                            className=" w-[17%] m-[4%] aspect-square"
                            imageSrc={getAssetUrl(currentTheme, 'boxes', 'negative_option_box_x2')}
                            textOption="text-sm text-[#FF7396]"
                        />
                    </div>
                </div>

            </div>
            {/* 하단 버튼 슬롯 (부모에서 주입) */}
            <div className="absolute w-full h-full flex justify-center items-end pb-[15%] z-40">
                {footer}
            </div>
        </div>
    );
};

export default DiaryOptionSelector;