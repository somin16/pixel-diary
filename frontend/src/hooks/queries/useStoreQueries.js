// src/hooks/queries/useStoreQueries.js
// 상점 화면(Shop.jsx)에서 쓰는 React Query 훅만 모아둔 파일
// 실제 서버 통신(fetch) 로직은 storeApi.js에 있고, 여기서는 그걸 가져다 useQuery/useMutation으로 감싸기만 함
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../utils/queryKeys'; // 여러 파일에서 같은 캐시 key를 공유하기 위한 중앙 저장소
import { storeApi } from '../../api/storeApi';

// ── 상점 아이템 목록 조회 ──────────────────────────────
// Shop.jsx / Inventory.jsx 둘 다에서 이 훅을 사용합니다.
// (보관함 화면에서도 "이 아이템 이름이 뭐였지" 확인하려고 상점 아이템 정보가 필요하기 때문)
export function useStoreItems() {
  return useQuery({
    queryKey: queryKeys.items,   // 이 데이터를 저장/찾을 때 쓰는 캐시 이름표
    queryFn: storeApi.getItem,   // 실제로 데이터를 가져오는 함수
  });
}

// ── 아이템 구매 ──────────────────────────────
// useMutation은 "조회"가 아니라 "서버 데이터를 변경하는 동작"에 사용합니다.
export function usePurchaseItem() {
  // invalidateQueries를 호출하려면 queryClient 인스턴스가 필요해서 미리 가져옵니다.
  const queryClient = useQueryClient();

  return useMutation({
    // mutate() 호출 시 { itemId }라는 객체 형태로 값을 받고,
    // 그 안에서 itemId만 꺼내서 실제 api 함수(storeApi.buyItem)에는 값 하나만 넘깁니다.
    mutationFn: ({ itemId }) => storeApi.buyItem(itemId),

    // 구매 요청이 서버에서 성공적으로 끝난 뒤 자동으로 실행되는 부분
    onSuccess: () => {
      // 방금 구매로 상점 목록의 품절(soldout) 여부가 바뀔 수 있으니 상점 캐시를 무효화(다시 조회하도록 표시)
      queryClient.invalidateQueries({ queryKey: queryKeys.items });
      // 새로 산 아이템이 보관함에 추가됐으니 보관함 캐시도 같이 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryItems });
    },
  });
}
// 컴포넌트에서 사용할 때: purchaseItem.mutate({ itemId: selectedItem.id });