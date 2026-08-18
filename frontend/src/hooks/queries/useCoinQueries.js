// 코인 관련 React Query 훅 모음 (상점/보관함/미니게임 등에서 공통으로 사용)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../utils/queryKeys';
import { coinApi } from '../../api/coinApi';

// ── 코인 잔액 조회 ──────────────────────────────
export function useCoin() {
  return useQuery({
    queryKey: queryKeys.coins,
    queryFn: coinApi.getCoin,
  });
}

// ── 코인 지급/차감 ──────────────────────────────
// 미니게임에서 보상을 줄 때 등 코인 값을 직접 변경해야 할 때 사용
export function useUpdateCoin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: coinApi.updateCoin,
    onSuccess: () => {
      // 코인이 바뀌었으니 화면에 보여지는 코인 잔액도 최신화되도록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.coins });
    },
  });
}