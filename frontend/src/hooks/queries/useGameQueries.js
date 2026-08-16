import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from "../../utils/queryKeys"
import { gameApi } from '../../api/gameApi';

// API를 사용하는 함수들(실제 API 로직은 api/gameApi에 있어요)

const TICKET_ITEM_ID = 40;

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

// 점수 저장 사용함수
export function useSubmitFinalScore(gameId) {

  return useMutation({

    // 입력값
    mutationFn: (finalScore) => gameApi.submitFinalScore(gameId, finalScore),

    // 에러시
    onError: (error) => {
      console.error("저장 실패 에러코드: ", error.message);
    },
  });
}

// 티켓 감소 사용 함수
export function useRemoveTicket() {

  const queryClient = useQueryClient();
  
  return useMutation({

    // 입력값 없음
    mutationFn: () => gameApi.removeTicket(),

    // 완료시
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets(TICKET_ITEM_ID) });
    },

    // 에러시
    onError: (error) => {
      console.error("티켓 사용 실패, 에러코드: ", error.message);
    },
  });
}