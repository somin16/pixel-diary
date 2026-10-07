// src/api/contactApi.js
// 문의하기 API - Supabase 직접 연동
// 보안 검사는 DB(RLS 정책, mark_contact_read RPC, contact_before_insert 트리거)가 담당하고,
// 이 파일은 "어떤 요청을 보내는지"만 모아둔 곳
import { supabase } from "../utils/SupabaseClient";

// ───────────────── 공통 헬퍼 ─────────────────

// Supabase는 에러를 throw하지 않고 { error }로 돌려주므로, 여기서 throw로 바꿔줌
// → React Query가 isError/retry를 처리할 수 있고, 조용히 실패하는 일이 없어짐
// → error.status를 붙여서 App.jsx의 retry 설정(401/404 재시도 안 함)과 맞춤
function unwrap({ data, error, status, count }) {
  if (error) {
    const err = new Error(error.message);
    err.status = status;      // HTTP 상태코드 (401, 403 등)
    err.code = error.code;    // Postgres 에러코드 (P0001: 트리거 에러 등)
    throw err;
  }
  return { data, count };
}

// 현재 로그인 유저 (세션이 없으면 401 에러)
async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    const err = new Error("로그인 세션이 만료되었습니다.");
    err.status = 401;
    throw err;
  }
  return session.user;
}

// 관리자 수정 요청이 RLS에 막히면 에러 없이 0건 수정으로 끝나므로, 직접 확인해서 에러 처리
function assertUpdated(data) {
  if (!data || data.length === 0) {
    const err = new Error("권한이 없거나 문의를 찾을 수 없습니다.");
    err.status = 403;
    throw err;
  }
}

// ───────────────── API ─────────────────

export const contactApi = {
  // [유저] 내 문의 목록
  getMine: async () => {
    const user = await getCurrentUser();
    const { data } = unwrap(
      await supabase
        .from("contact")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
    );
    return data ?? [];
  },

  // [유저] 문의 작성 - user_id, status 등은 트리거가 자동으로 채움
  create: async ({ message, category }) => {
    await getCurrentUser(); // 세션 만료 시 명확한 에러 메시지를 주기 위해 먼저 확인
    unwrap(await supabase.from("contact").insert({ message, category }));
  },

  // [유저] 답변 읽음 처리 - is_read만 바꾸는 RPC 함수 호출
  markRead: async (contactId) => {
    unwrap(await supabase.rpc("mark_contact_read", { p_contact_id: contactId }));
  },

  // [유저 + 관리자] 더보기 빨간 점
  // 1개만 조회해서 있는지 없는지만 확인 (개수는 세지 않음)
  getBadge: async () => {
    const user = await getCurrentUser();
    const isAdmin = user.app_metadata?.role === "admin";

    const [unread, pending] = await Promise.all([
      // 답변 완료됐는데 안 읽은 내 문의가 하나라도 있는지
      supabase
        .from("contact")
        .select("contact_id")
        .eq("user_id", user.id)
        .eq("status", "resolved")
        .eq("is_read", false)
        .limit(1), // 존재 여부만 필요하므로 1개만 확인 (지우면 전체 조회됨)

      // (관리자만) 답변 대기 중인 문의가 하나라도 있는지
      isAdmin
        ? supabase
            .from("contact")
            .select("contact_id")
            .eq("status", "pending")
            .limit(1)
        : Promise.resolve({ data: [], error: null }),
    ]);

    return {
      hasUnreadReply: (unwrap(unread).data?.length ?? 0) > 0,
      hasNewContact: (unwrap(pending).data?.length ?? 0) > 0,
    };
  },

  // [관리자] 전체 문의 목록 (작성자 이름 조인)
  getAdminList: async () => {
    const { data } = unwrap(
      await supabase
        .from("contact")
        .select(`*, users ( user_name )`)
        .order("created_at", { ascending: false })
    );
    return data ?? [];
  },

  // [관리자] 답변 등록/수정
  saveReply: async ({ contactId, reply }) => {
    const { data } = unwrap(
      await supabase
        .from("contact")
        .update({
          reply,
          status: "resolved",
          replied_at: new Date().toISOString(),
          is_read: false, // 유저가 읽을 때까지 안 읽음
        })
        .eq("contact_id", contactId)
        .select("contact_id") // 실제로 수정됐는지 확인용
    );
    assertUpdated(data);
  },

  // [관리자] 답변 삭제 → 답변 대기 상태로 원복
  deleteReply: async (contactId) => {
    const { data } = unwrap(
      await supabase
        .from("contact")
        .update({ reply: null, status: "pending", replied_at: null })
        .eq("contact_id", contactId)
        .select("contact_id")
    );
    assertUpdated(data);
  },
};