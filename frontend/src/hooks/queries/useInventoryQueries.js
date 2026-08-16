// src/hooks/queries/useInventoryQueries.js
// 보관함 화면(Inventory.jsx)에서 쓰는 React Query 훅
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../utils/queryKeys';
import { inventoryApi } from '../../api/inventoryApi';

// ── 보관함(보유 아이템) 목록 조회 ──────────────────────────────
export function useInventoryItems() {
  return useQuery({
    queryKey: queryKeys.inventoryItems, // 상점(items)과는 별개의 캐시 key
    queryFn: inventoryApi.getItem,
  });
}