// src/hooks/queries/useDiaryQueries.js
// React Query 훅만 담당 - 실제 fetch 로직은 diaryApi에서 가져다 씀
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../utils/queryKeys';
import { diaryApi } from '../../api/diaryApi';

// ── 일기 목록 조회 ──────────────────────────────
export function useDiaries() {
  return useQuery({
    queryKey: queryKeys.diaries,
    queryFn: diaryApi.getList,
  });
}

// ── 일기 상세 조회 ──────────────────────────────
export function useDiaryDetail(diaryId) {
  return useQuery({
    queryKey: queryKeys.diaryDetail(diaryId),
    queryFn: () => diaryApi.getDetail(diaryId),
    enabled: !!diaryId, // id 없으면 요청 안 보냄
  });
}

// ── 무효화 공통 옵션 ──────────────────────────────
// refetchType: 'none' → 캐시를 "낡음" 처리만 하고 지금 마운트된 화면에서 즉시 재요청은 안 보냄.
// diary 저장/삭제 mutation들은 전부 성공 직후 다른 화면으로 이동하는 흐름이라,
// 이동할 화면이 새로 마운트되면서 알아서 최신 데이터를 받아옴 (refetchOnMount 기본값).
// 이 옵션이 없으면 저장 중 계속 마운트돼 있는 화면(DiaryForm 등)이 mutation마다 즉시 재요청을 쏴서
// 같은 데이터를 여러 번 중복 조회하게 됨.
const NO_IMMEDIATE_REFETCH = { refetchType: 'none' };

// ── 일기 작성 ──────────────────────────────
export function useCreateDiary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: diaryApi.create, // { image_id, content }
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diaries, ...NO_IMMEDIATE_REFETCH });
    },
  });
}
// 사용할 때: createDiary.mutate({ image_id, content });

// ── 일기 수정 (본문) ──────────────────────────────
// diaryId를 훅 인자가 아니라 mutate 변수로 받음
// (새로 작성한 일기는 diaryId가 create 성공 이후에야 생기기 때문에, deco 저장과 동일하게 런타임에 넘겨받는 구조로 통일)
export function useUpdateDiary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ diaryId, ...payload }) => diaryApi.update(diaryId, payload),
    onSuccess: (_, { diaryId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diaries, ...NO_IMMEDIATE_REFETCH });
      queryClient.invalidateQueries({ queryKey: queryKeys.diaryDetail(diaryId), ...NO_IMMEDIATE_REFETCH });
    },
  });
}
// 사용할 때: updateDiary.mutate({ diaryId, content });

// ── 일기 삭제 ──────────────────────────────
export function useDeleteDiary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ diaryId }) => diaryApi.delete(diaryId),
    onSuccess: (_, { diaryId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diaries, ...NO_IMMEDIATE_REFETCH });
      queryClient.removeQueries({ queryKey: queryKeys.diaryDetail(diaryId) });
    },
  });
}
// 사용할 때: deleteDiary.mutate({ diaryId });

// ── 꾸미기 저장 (이모지 / 액자 / 스티커) ──────────────────────────────
export function useSaveDeco() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ diaryId, ...payload }) => diaryApi.saveDeco(diaryId, payload),
    onSuccess: (_, { diaryId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diaries, ...NO_IMMEDIATE_REFETCH });
      queryClient.invalidateQueries({ queryKey: queryKeys.diaryDetail(diaryId), ...NO_IMMEDIATE_REFETCH });
    },
  });
}
// 사용할 때: saveDeco.mutate({ diaryId, emoji_id, diary_theme_id, sticker });

// ── 꾸미기 초기화 ──────────────────────────────
// deco 초기화는 화면 이동 없이 같은 화면(DiaryDetail)에서 바로 반영되어야 하므로,
// 자동 재요청을 껐고 대신 호출부(DetailDiaryDialog → onRefresh)에서 명시적으로 refetch() 호출함
export function useDeleteDeco() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ diaryId }) => diaryApi.deleteDeco(diaryId),
    onSuccess: (_, { diaryId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diaries, ...NO_IMMEDIATE_REFETCH });
      queryClient.invalidateQueries({ queryKey: queryKeys.diaryDetail(diaryId), ...NO_IMMEDIATE_REFETCH });
    },
  });
}
// 사용할 때: deleteDeco.mutate({ diaryId });
