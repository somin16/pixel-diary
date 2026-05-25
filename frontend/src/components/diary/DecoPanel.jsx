import { useState, useEffect, useRef } from 'react';
import { authFetch } from '../../utils/AuthHelper';
import { motion } from 'framer-motion';
import { getAssetUrl } from '../../utils/AssetHelper';
import ImageButton from '../common/ImageButton';

const DecoPanel = ({ currentTheme, mode, isOpen, onSelectMode, onSelectItem }) => {
  const dragStartY = useRef(null);
  // mode가 null이면 화면 밖(100%)으로 완전히 숨김 (우측 버튼 토글용)
  const isHidden = !mode;

  // 목표 y값 계산
  const targetY = isHidden ? "100%" : (isOpen ? "0%" : "88%");

  // 상태 관리
  // 전체 아이템 목록 (표시용) - item_type별로 분류해서 저장
  const [allItems, setAllItems] = useState({
    frame: [],   // diary_theme 타입
    emoji: [],   // emoji 타입
    sticker: [], // sticker 타입
  });
  // 보유한 아이템 ID Set (잠금 판별용, O(1) 조회)
  const [ownedItemIds, setOwnedItemIds] = useState(new Set());

  useEffect(() => {
    fetchAllData();
  }, []);

  // API 호출 - 전체 아이템 목록 + 보유 아이템 판별
  // sessionStorage 캐시 전략:
  //   - deco_all_items: 전체 아이템 목록 (앱 배포 때만 바뀌므로 무효화 불필요)
  //   - deco_owned_ids: 보유 아이템 ID 목록 (아이템 구매 시 무효화)
  const fetchAllData = async () => {
    try {
      // ✅ 캐시 확인 먼저 - 있으면 API 호출 없이 바로 사용
      const cachedAll = sessionStorage.getItem('deco_all_items');
      const cachedOwned = sessionStorage.getItem('deco_owned_ids');

      if (cachedAll && cachedOwned) {
        setAllItems(JSON.parse(cachedAll));
        setOwnedItemIds(new Set(JSON.parse(cachedOwned)));
        return;
      }

      // 캐시 없을 때만 두 API를 병렬 호출해서 속도 최적화
      const [allItemsData, ownedData] = await Promise.all([
        authFetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/items/`),
        authFetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/deco-item/`),
      ]);

      // 전체 아이템을 item_type별로 분류
      const items = allItemsData.items ?? [];
      const categorized = {
        frame: items.filter(i => i.item_type === 'diary_theme'),
        emoji: items.filter(i => i.item_type === 'emoji'),
        sticker: items.filter(i => i.item_type === 'sticker'),
      };

      // 보유 아이템 ID를 배열로 추출 후 Set으로 변환
      const ownedIds = [
        ...(ownedData.emojis ?? []),
        ...(ownedData.diary_themes ?? []),
        ...(ownedData.stickers ?? []),
      ].map(i => i.item_id);

      // sessionStorage에 캐시 저장
      sessionStorage.setItem('deco_all_items', JSON.stringify(categorized));
      sessionStorage.setItem('deco_owned_ids', JSON.stringify(ownedIds));

      setAllItems(categorized);
      setOwnedItemIds(new Set(ownedIds));

    } catch (error) {
      console.error('아이템 데이터 로드 실패:', error);
    }
  };

  // 모드에 맞는 리스트 가져오기 (프레임, 스티커, 이모지)
  const currentList = allItems[mode] ?? [];

  // 버튼 클릭 핸들러: 같은 모드면 끄고(null), 다른 모드면 교체
  const handleModeClick = (selectedMode) => {
    if (mode === selectedMode) {
      // 이미 켜진 모드를 다시 누르면 패널을 완전히 닫음(null)
      onSelectMode(null, false);
    } else {
      // 다른 모드를 누르면 해당 모드로 교체하고 패널을 위로 올림(true)
      onSelectMode(selectedMode, true);
    }
  };

  return (
    <>
      {/* 1. 우측 사이드 버튼들 */}
      <div className="absolute inset-0 w-full h-full flex flex-col items-end gap-[1%] mt-[50%] z-30 pointer-events-none">
        {/* 버튼 1: Frame */}
        <div className="h-[6%] aspect-[48/45] relative pointer-events-auto">
          <ImageButton
            label="frame"
            onClick={() => handleModeClick('frame')}
            // 꿀렁임 방지: 크기(w, h)는 고정하고 위치(translate)만 이동
            className={`w-full h-full transition-transform duration-200 ease-out ${mode === 'frame' ? 'translate-x-0' : 'translate-x-[25%]'
              }`}
            imageSrc={getAssetUrl(currentTheme, 'buttons', 'diary_frame_button_x3')}
            textOption="text-[0px]"
          />
        </div>

        {/* 버튼 2: Sticker */}
        <div className="h-[6%] aspect-[48/45] relative pointer-events-auto">
          <ImageButton
            label="sticker"
            onClick={() => handleModeClick('sticker')}
            className={`w-full h-full transition-transform duration-200 ease-out ${mode === 'sticker' ? 'translate-x-0' : 'translate-x-[25%]'
              }`}
            imageSrc={getAssetUrl(currentTheme, 'buttons', 'sticker_button_x3')}
            textOption="text-[0px]"
          />
        </div>

        {/* 버튼 3: Emoji */}
        <div className="h-[6%] aspect-[48/45] relative pointer-events-auto">
          <ImageButton
            label="emoji"
            onClick={() => handleModeClick('emoji')}
            className={`w-full h-full transition-transform duration-200 ease-out ${mode === 'emoji' ? 'translate-x-0' : 'translate-x-[25%]'
              }`}
            imageSrc={getAssetUrl(currentTheme, 'buttons', 'emoji_button_x3')}
            textOption="text-[0px]"
          />
        </div>
      </div>

      {/* 2. 바텀 시트 본체 */}
      <motion.div
        animate={{ y: targetY }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}

        // drag 완전히 제거, 터치 이벤트로 직접 제어
        onPointerDown={(e) => {
          if (isHidden) return;
          dragStartY.current = e.clientY;
        }}
        onPointerUp={(e) => {
          if (isHidden || dragStartY.current === null) return;
          const deltaY = e.clientY - dragStartY.current;
          dragStartY.current = null;

          if (isOpen && deltaY > 80) {
            // 열린 상태 → 아래로 스와이프 → 빼꼼
            onSelectMode(mode, false);
          } else if (!isOpen && deltaY < -80) {
            // 빼꼼 상태 → 위로 스와이프 → 전체 열기
            onSelectMode(mode, true);
          }
        }}
        onPointerCancel={() => { dragStartY.current = null; }}

        className="absolute w-full inset-x-0 bottom-0 z-[101] flex flex-col items-center pointer-events-auto touch-none"
      >
        <div className="relative w-full aspect-[360/312] max-h-[60vh] flex flex-col overflow-hidden">

          {/* 모드가 활성화되었을 때만 내부 콘텐츠 렌더링 */}
          {mode && (
            <>
              {/* A. 배경 이미지 */}
              <img
                src={getAssetUrl(currentTheme, 'boxes',
                  mode === 'frame' ? 'deco_diary_frame_box_x3' :
                    mode === 'sticker' ? 'deco_sticker_box_x3' : 'deco_emoji_box_x3'
                )}
                className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                alt="panel-bg"
              />

              {/* B. 상단 핸들 영역: 여기를 잡고 '쭉' 내리면 쫀득하게 내려갑니다. */}
              <div className="absolute top-0 left-0 w-full h-[10%] cursor-grab active:cursor-grabbing z-20" />

              {/* C. 아이템 리스트 영역 */}
              <div className="absolute top-[13%] left-[3%] right-[3%] bottom-[3%] flex flex-col">
                <div
                  className="w-full h-full overflow-y-auto no-scrollbar"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-4 gap-[3%]">
                    {currentList.map((item) => {
                      // Set.has()로 O(1) 보유 여부 조회
                      const isOwned = ownedItemIds.has(item.item_id);
                      const isFrameMode = mode === 'frame';

                      return (
                        <div
                          key={item.item_id}
                          className={`relative flex items-center justify-center ${isFrameMode ? 'aspect-[311/522]' : 'aspect-square'
                            }`}
                          onClick={() => {
                            if (isOwned) {
                              onSelectItem(mode, {
                                item_id: item.item_id,
                                img: item.item_image_url,
                              });
                            }
                          }}
                        >
                          {/* 1. 아이템 이미지: 슬롯 배경 없이 이미지만 강조 */}
                          <div className="w-full h-full flex items-center justify-center">
                            <img
                              src={item.item_image_url}
                              className={`object-contain h-full ${isOwned
                                ? 'opacity-100'
                                : 'opacity-40 grayscale brightness-75'
                                }`}
                              alt={item.item_id}
                            />
                          </div>

                          {/* 2. 자물쇠: 미보유 시 중앙에 표시 */}
                          {!isOwned && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-3xl drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
                                🔒
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default DecoPanel;