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

// 코인은 출석/상점구매/미니게임 등 여러 도메인이 공유하는 값이라, 어디서 호출하든
// 성공 시 coins 캐시를 무효화해서 앱 전체가 항상 최신 코인을 보게 만듦
export function useUpdateCoin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload }) => coinApi.updateCoin(payload), 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coins });
    },
    onError: (error) => {
      console.error('코인 변경 실패:', error);
    },
  });
}