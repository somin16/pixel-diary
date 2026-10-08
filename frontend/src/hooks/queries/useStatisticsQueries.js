// src/hooks/queries/useStatisticsQueries.js
// React Query 훅만 담당 - 실제 fetch 로직은 statisticsApi에서 가져다 씀
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '../../utils/queryKeys';
import { statisticsApi } from '../../api/statisticsApi';

// ── 통계 조회 ──────────────────────────────
// 사용할 때: useStatistics({ year: 2026, month: 10 })  /  연 단위: month: null
export function useStatistics({ year, month }) {
  return useQuery({
    // year/month가 바뀌면 키가 바뀌어 자동으로 다시 조회된다
    queryKey: queryKeys.statisticsDetail({ year, month }),
    queryFn: () => statisticsApi.get({ year, month }),

    // 이전/다음 달로 넘길 때 새 데이터가 올 때까지 이전 화면을 유지 → 깜빡임(로딩 화면) 방지
    placeholderData: keepPreviousData,

    // 1분간은 캐시를 신선한 것으로 취급.
    // 일기 작성/삭제 시 invalidate(낡음 처리)되므로, 그 뒤 /stats에 들어오면 새로 불러온다.
    staleTime: 60 * 1000,
  });
}
