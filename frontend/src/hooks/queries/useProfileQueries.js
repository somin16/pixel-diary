import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// 닉네임 수정 훅
export function useUpdateNickname() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: profileApi.updateNickname,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

// 이미지 수정 훅
export function useUpdateImage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: profileApi.updateImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

// 이미지 삭제 훅
export function useDeleteImage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: profileApi.deleteImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}