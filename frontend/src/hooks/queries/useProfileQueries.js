import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../utils/queryKeys';
import { profileApi } from '../../api/profileApi';

// 프로필 조회 훅
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: profileApi.getProfile,
    staleTime: 1000 * 60 * 5, // 5분 유지
  });
}