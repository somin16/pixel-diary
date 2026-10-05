// src/hooks/queries/useContactQueries.js
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactApi } from "../../api/contactApi";
import { queryKeys } from "../../utils/queryKeys";
import { supabase } from "../../utils/SupabaseClient";

// ───────────────── 조회 ─────────────────

// [유저] 내 문의 목록
export const useMyContacts = () =>
  useQuery({
    queryKey: queryKeys.myContacts,
    queryFn: contactApi.getMine,
  });

// [유저 + 관리자] 더보기 빨간 점
export const useContactBadge = () =>
  useQuery({
    queryKey: queryKeys.contactBadge,
    queryFn: contactApi.getBadge,
    staleTime: 0, // 더보기 화면에 들어올 때마다 최신값 확인
  });

// [관리자] 전체 문의 목록
export const useAdminContacts = () =>
  useQuery({
    queryKey: queryKeys.adminContacts,
    queryFn: contactApi.getAdminList,
  });

// ───────────────── 변경 ─────────────────
// invalidateQueries는 "이 코드를 실행한 기기의 캐시"만 갱신함
// 상대방 기기는 각자의 Realtime 콜백(useContactRealtime)이 갱신

// [유저] 문의 작성
export const useCreateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contactApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myContacts });
    },
  });
};

// [유저] 읽음 처리 → 내 목록 + 내 빨간 점 갱신
export const useMarkContactRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contactApi.markRead,
    onSuccess: (_data, contactId) => {
      // 목록 캐시에서 해당 항목만 바로 읽음 처리 (다시 조회하지 않아도 카드의 빨간 점이 즉시 사라짐)
      queryClient.setQueryData(queryKeys.myContacts, (prev) =>
        prev?.map((c) => (c.contact_id === contactId ? { ...c, is_read: true } : c))
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.contactBadge });
    },
  });
};

// [관리자] 답변 등록/수정 → 관리자 목록 + 관리자 빨간 점 갱신
export const useSaveReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contactApi.saveReply,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminContacts });
      queryClient.invalidateQueries({ queryKey: queryKeys.contactBadge });
    },
  });
};

// [관리자] 답변 삭제 → 관리자 목록 + 관리자 빨간 점 갱신
export const useDeleteReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contactApi.deleteReply,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminContacts });
      queryClient.invalidateQueries({ queryKey: queryKeys.contactBadge });
    },
  });
};

// ───────────────── Realtime ─────────────────

/**
 * 상대방(관리자↔유저)이 바꾼 내용을 내 기기에 반영
 * - App.jsx(AppInner)에서 한 번만 호출 → 어느 화면에 있든 구독 유지, 채널 중복 생성 방지
 * - 이벤트 데이터는 쓰지 않고 "바뀌었다"는 신호로만 사용 → 문의 관련 쿼리를 무효화해서 다시 조회
 * - 일반 유저는 본인 문의 변경만 구독 (다른 유저가 문의를 써도 반응하지 않음)
 */
export function useContactRealtime(session) {
  const queryClient = useQueryClient();
  const userId = session?.user?.id;
  const isAdmin = session?.user?.app_metadata?.role === "admin";

  useEffect(() => {
    if (!userId) return; // 로그인 전에는 구독 안 함

    const channel = supabase
      .channel(`contact-changes-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact",
          ...(isAdmin ? {} : { filter: `user_id=eq.${userId}` }),
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.contactsAll });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // session 객체는 토큰 갱신마다 바뀌므로 userId/isAdmin 값만 의존성으로 사용 (불필요한 재구독 방지)
  }, [userId, isAdmin, queryClient]);
}