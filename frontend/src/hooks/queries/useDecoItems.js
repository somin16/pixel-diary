import { useQuery } from '@tanstack/react-query';
import { authFetch } from '../../utils/AuthHelper';
import { queryKeys } from '../../utils/queryKeys';

// prefetch와 useQuery가 같은 설정을 쓰도록 분리
export const decoItemsQuery = {
  queryKey: queryKeys.decoItems,
  staleTime: 1000 * 60 * 30, // 30분 동안은 fresh 취급 → prefetch/재진입 시 재요청 안 함
  queryFn: async () => {
    const [all, owned] = await Promise.all([
      authFetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/items/`),
      authFetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/deco-item/`),
    ]);

    const items = all.items ?? [];
    const emojis = items.filter((i) => i.item_type === 'emoji');

    // 감정 선택 다이얼로그용: 이모지 이미지를 브라우저 캐시에 미리 로드
    emojis.forEach((i) => {
      const img = new Image();
      img.src = i.item_image_url;
    });

    return {
      frames: items.filter((i) => i.item_type === 'diary_theme'),
      emojis,
      stickers: items.filter((i) => i.item_type === 'sticker'),
      ownedIds: [
        ...(owned.emojis ?? []),
        ...(owned.diary_themes ?? []),
        ...(owned.stickers ?? []),
      ].map((i) => i.item_id),
    };
  },
};

export function useDecoItems() {
  return useQuery(decoItemsQuery);
}