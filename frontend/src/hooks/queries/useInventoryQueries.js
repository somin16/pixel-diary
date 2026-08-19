import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../utils/queryKeys';
import { inventoryApi } from '../../api/inventoryApi';

export function useInventoryItems() {
  return useQuery({
    queryKey: queryKeys.inventory,
    queryFn: inventoryApi.getItem,
  });
}