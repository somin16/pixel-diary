// 티켓 관련 React Query 훅 모음
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../utils/queryKeys';
import { ticketApi } from '../../api/ticketApi';

// ── 티켓 조회 ──────────────────────────────
// itemId를 넘기면 특정 종류 티켓만, 안 넘기면 전체 조회
export function useTicket(itemId) {
  return useQuery({
    queryKey: queryKeys.tickets(itemId), // 그대로 사용 가능, 다만 itemId 없이 호출하면 ['tickets', undefined]가 됨
    queryFn: () => ticketApi.getTicket(itemId),
    enabled: !!itemId, // itemId 없을 땐 요청 자체를 안 보내도록 방어
  });
}

// ── 티켓 지급/차감/사용 ──────────────────────────────
export function useUpdateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload }) => ticketApi.updateTicket(payload),
    onSuccess: () => {
      // 어떤 itemId의 티켓 목록도 최신화되어야 하므로 'tickets'로 시작하는 캐시 전부 무효화
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (error) => {
      console.error('티켓 변경 실패:', error);
    },
  });
}