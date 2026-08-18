// 티켓 관련 React Query 훅 모음
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../utils/queryKeys';
import { ticketApi } from '../../api/ticketApi';

// ── 티켓 조회 ──────────────────────────────
// itemId를 넘기면 특정 종류 티켓만, 안 넘기면 전체 조회
export function useTicket(itemId) {
  return useQuery({
    queryKey: queryKeys.tickets(itemId), // itemId별로 다른 캐시로 취급
    queryFn: () => ticketApi.getTicket(itemId),
  });
}

// ── 티켓 지급/차감/사용 ──────────────────────────────
export function useUpdateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ticketApi.updateTicket,
    onSuccess: () => {
      // 어떤 itemId의 티켓 목록도 최신화되어야 하므로 'tickets'로 시작하는 캐시 전부 무효화
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}