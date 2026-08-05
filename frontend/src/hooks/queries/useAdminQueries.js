// src/hooks/queries/useAdminQueries.js
// React Query 훅만 담당 - 실제 fetch 로직은 adminApi에서 가져다 씀
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../utils/queryKeys';
import { adminApi } from '../../api/adminApi';

import { useInfiniteQuery } from '@tanstack/react-query';

// ── 유저 목록 무한스크롤 조회 ──────────────────────────────
export function useInfiniteAdminUsers(pageSize, searchKeyword) {
  return useInfiniteQuery({
    queryKey: ['admin', 'users', 'infinite', searchKeyword],
    queryFn: ({ pageParam = 1 }) => adminApi.getUsers(pageParam, pageSize, searchKeyword),
    initialPageParam: 1,
    // 받아온 데이터가 pageSize보다 적으면 마지막 페이지로 판단
    getNextPageParam: (lastPage, allPages) => {
      const users = lastPage.data.users || [];
      return users.length === pageSize ? allPages.length + 1 : undefined;
    },
    refetchOnMount: 'always', // 관리자가 이 화면 들어올 때마다 staleTime 무시하고 서버에서 항상 재확인
  });
}

// ── 전체 유저 조회 ──────────────────────────────
export function useAdminUsers(pageNumber, pageSize, searchKeyword) {
  return useQuery({
    queryKey: queryKeys.adminUsers(pageNumber, searchKeyword),
    queryFn: () => adminApi.getUsers(pageNumber, pageSize, searchKeyword),
  });
}

// ── 문제 유저 강제 탈퇴 ──────────────────────────────
export function useForceWithdrawUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({userId}) => adminApi.forceWithdrawUser(userId),
    onSuccess: () => {
      // 페이지/검색어별로 key가 여러 개라 'admin','users' prefix로 한 번에 무효화
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
// 사용할 때: forceWithdraw.mutate({ userId }); // 객체로 감싸서 호출

// ── 공지사항 작성 ──────────────────────────────
export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createAnnouncement,
    onSuccess: () => {
      // 일반 유저 공지 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
    },
  });
}

// ── 공지사항 수정 ──────────────────────────────
export function useUpdateAnnouncement(announcementId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => adminApi.updateAnnouncement(announcementId, payload), //payload 자체가 이미 객체
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
      queryClient.invalidateQueries({ queryKey: queryKeys.announcementDetail(announcementId) });
    },
  });
}
// 사용할 때: update.mutate({ title, content, category });

// ── 공지사항 삭제 ──────────────────────────────
export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    // 파라미터 1개여도 객체로 구조분해해서 받도록 변경
    mutationFn: ({ announcementId }) => adminApi.deleteAnnouncement(announcementId),
    onSuccess: (_, announcementId) => {
      // onSuccess 두 번째 인자도 mutate에 넘긴 값 그대로라 객체 구조분해로 꺼냄
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
      queryClient.removeQueries({ queryKey: queryKeys.announcementDetail(announcementId) });
    },
  });
}
// 사용할 때: deleteAnnouncement.mutate({ announcementId }); // 객체로 감싸서 호출

// ── 서비스 통계 조회 ────────────────────────────── ‼️아직 미구현
export function useAdminStats(startDate, endDate, metricType) {
  return useQuery({
    queryKey: queryKeys.adminStats(startDate, endDate, metricType),
    queryFn: () => adminApi.getStats(startDate, endDate, metricType),
    enabled: !!startDate && !!endDate,
  });
}

// ── 아이템 추가 ──────────────────────────────
//payload 자체가 이미 객체
export function useAddItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.addItem,
    onSuccess: () => {
      // 유일하게 남는 크로스 도메인 지점 - 상점 담당의 items 캐시
      queryClient.invalidateQueries({ queryKey: queryKeys.items });
    },
  });
}
// 사용할 때: addItem.mutate({ item_name, item_type, item_price, ... });