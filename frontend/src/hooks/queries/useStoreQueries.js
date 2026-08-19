import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../utils/queryKeys';
import { storeApi } from '../../api/storeApi';

export function useStoreItems() {
  return useQuery({
    queryKey: queryKeys.items,
    queryFn: storeApi.getItem,
  });
}

export function usePurchaseItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId }) => storeApi.buyItem(itemId), // mutate({ itemId })로만 호출
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
      // 구매하면 코인이 차감되니 코인 캐시도 무효화 
      queryClient.invalidateQueries({ queryKey: queryKeys.coins });
    },
    onError: (error) => {
      console.error('아이템 구매 실패:', error);
    },
  });
}