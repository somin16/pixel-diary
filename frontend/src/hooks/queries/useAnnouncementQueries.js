// src/hooks/queries/useAnnouncementQueries.js
// 공지사항 조회 훅 - 일반 유저 화면(AnnouncementList, AnnouncementDetail)에서 사용
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../utils/queryKeys';
import { announcementApi } from '../../api/announcementApi';

// ── 공지사항 목록 조회 ──────────────────────────────
export function useAnnouncements() {
  return useQuery({
    queryKey: queryKeys.announcements,
    queryFn: announcementApi.getList,
    staleTime: 1000 * 60 * 10, // 공지는 자주 안 바뀌니 10분 정도
    refetchOnMount: 'always', // 추가: 화면 마운트될 때마다 캐시 상관없이 항상 서버에 재확인
  });
}

// ── 공지사항 상세 조회 ──────────────────────────────
export function useAnnouncementDetail(announcementId) {
  return useQuery({
    queryKey: queryKeys.announcementDetail(announcementId),
    queryFn: () => announcementApi.getDetail(announcementId),
    enabled: !!announcementId, // id 없으면 요청 안 보냄
  });
}