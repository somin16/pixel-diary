import { useState, useMemo, Fragment } from 'react';
import { useDecoItems } from '../../hooks/queries/useDecoItems';
import { getAssetUrl } from '../../utils/AssetHelper';
import ImageButton from '../common/ImageButton';
import CloseButton from '../common/CloseButton';

// 열 순서 = 감정 (백엔드 허용 값과 동일해야 함)
const EMOTIONS = [
  { key: 'happy', label: '기쁨' },
  { key: 'calm', label: '평온한' },
  { key: 'tired', label: '무기력한' },
  { key: 'sad', label: '슬픔' },
  { key: 'angry', label: '화남' },
];
const DEFAULT_THEME = 'default'; // 기본 이모지 item_name 접두사에 맞게 수정

// "bear_emoji_happy" → { theme: 'bear', emotion: 'happy' }
function parseEmoji(item) {
  const m = /^(.+)_emoji_(.+)$/.exec(item.item_name ?? '');
  return m ? { theme: m[1], emotion: m[2] } : null;
}

export default function EmotionSelectDialog({ currentTheme, onConfirm, onClose }) {
  const { data, isLoading } = useDecoItems();
  const [selected, setSelected] = useState(null);
  const owned = useMemo(() => new Set(data?.ownedIds ?? []), [data]);

  // 행 = 테마, 열 = 감정. 등록 안 된 칸은 빈 칸으로 둠
  const rows = useMemo(() => {
    const map = new Map(); // theme -> { emotion: item }
    (data?.emojis ?? []).forEach((item) => {
      const p = parseEmoji(item);
      if (!p || !EMOTIONS.some((e) => e.key === p.emotion)) return;
      if (!map.has(p.theme)) map.set(p.theme, {});
      map.get(p.theme)[p.emotion] = item;
    });
    return [...map.entries()]
      .sort(([a], [b]) => (a === DEFAULT_THEME ? -1 : b === DEFAULT_THEME ? 1 : 0)) // 기본 테마 맨 위
      .map(([theme, byEmotion]) => ({ theme, byEmotion }));
  }, [data]);

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm({
      item_id: selected.item_id,
      img: selected.item_image_url,
      keyword: parseEmoji(selected).emotion, // happy | calm | tired | sad | angry
    });
  };

  return (
    <div className="absolute inset-0 z-[200] bg-black/50 flex flex-col items-center justify-center gap-4" onClick={onClose}>
      {/* ── 닫기 버튼 ── */}
      <div className="absolute w-full h-full z-40 pointer-events-none">
        <CloseButton onClose={onClose} className="left-[5%] top-[5%] pointer-events-auto" />
      </div>
      <div className="w-[95%] max-w-[420px] bg-[#fffaf0] rounded-lg border-2 border-[#7a5c4a] p-2" onClick={(e) => e.stopPropagation()}>
        <p className="text-center text-sm text-[#5A5A5A] mb-2">오늘의 감정고르기</p>

        <div className="grid grid-cols-5 text-center text-[10px] text-[#8a7a6a] mb-1">
          {EMOTIONS.map((e) => <span key={e.key}>{e.label}</span>)}
        </div>

        {isLoading && <p className="text-center text-xs text-gray-400 py-8">불러오는 중...</p>}

        <div className="grid grid-cols-5 gap-y-2 max-h-[55vh] overflow-y-auto no-scrollbar">
          {rows.map(({ theme, byEmotion }) => (
            <Fragment key={theme}>
              {EMOTIONS.map(({ key }) => {
                const item = byEmotion[key];
                if (!item) return <div key={`${theme}-${key}`} className="aspect-square" />;

                const isOwned = owned.has(item.item_id);
                const isSel = selected?.item_id === item.item_id;
                return (
                  <button
                    key={item.item_id}
                    disabled={!isOwned}
                    onClick={() => setSelected(item)}
                    className={`relative aspect-square rounded-md ${isSel ? 'bg-sky-200' : ''}`}
                  >
                    <img
                      src={item.item_image_url}
                      alt=""
                      className={`w-full h-full object-contain [image-rendering:pixelated] ${isOwned ? '' : 'opacity-40 grayscale'}`}
                    />
                    {!isOwned && <span className="absolute inset-0 flex items-center justify-center text-lg">🔒</span>}
                  </button>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <ImageButton
        label="결정"
        onClick={(e) => { e.stopPropagation(); handleConfirm(); }}
        disabled={!selected}
        className={`w-[60%] max-w-[240px] aspect-[237/72] ${selected ? '' : 'opacity-50'}`}
        imageSrc={getAssetUrl(currentTheme, 'buttons', 'skyblue_button_x3')}
        textOption="text-2xl text-[#4C8AE8]"
      />
    </div>
  );
}