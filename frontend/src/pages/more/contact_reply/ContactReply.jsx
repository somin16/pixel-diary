import React, { useState } from "react";
import { useTheme } from "../../../stores/useThemeStore";
import { getAssetUrl } from "../../../utils/AssetHelper";
import { useAdminContacts, useSaveReply, useDeleteReply } from "../../../hooks/queries/useContactQueries"; // 관리자 문의 조회, 답변 저장/삭제

// 컴포넌트 불러오기
import Header from "../../../components/common/Header";
import ResultDialog from "../../../components/common/dialog/ResultDialog";
import ConfirmDialog from "../../../components/common/dialog/ConfirmDialog";
import ContactAdminCard from "../../../components/more/contact/ContactAdminCard";

// 배경 위 안내 문구 공통 스타일
const CENTER_MESSAGE = "fixed inset-0 flex flex-col justify-center items-center gap-[2%] text-gray-500 text-sm pointer-events-none";

export default function ContactReply() {
  const currentTheme = useTheme((state) => state.currentTheme);

  // 서버 데이터: React Query
  const { data: contacts = [], isLoading, isError, refetch } = useAdminContacts();
  const saveReply = useSaveReply();
  const deleteReply = useDeleteReply();
 
  // UI 상태
  const [filter, setFilter] = useState("all"); // all, pending, resolved
  const [expandedId, setExpandedId] = useState(null);
  const [resultMessage, setResultMessage] = useState("");
  const [deleteContext, setDeleteContext] = useState(null); // { contactId, onDone }
 
  // 답변 등록/수정 → 성공 여부를 카드에 돌려줌 (카드가 편집 모드를 닫을지 결정)
  const handleSaveReply = async (contactId, text) => {
    try {
      await saveReply.mutateAsync({ contactId, reply: text.trim() });
      setResultMessage("답변이 성공적으로 저장되었습니다.");
      return true;
    } catch (err) {
      console.error("답변 저장 에러:", err.message);
      setResultMessage("답변 저장 중 오류가 발생했습니다.");
      return false;
    }
  };
 
  // 삭제 버튼 → 확인 다이얼로그 띄우기
  const handleDeleteReply = (contactId, onDone) => {
    setDeleteContext({ contactId, onDone });
  };
 
  // 확인 다이얼로그에서 확인 → 실제 삭제
  const handleConfirmDelete = async () => {
    if (!deleteContext) return;
    const { contactId, onDone } = deleteContext;
 
    try {
      await deleteReply.mutateAsync(contactId);
      setResultMessage("답변이 삭제되었습니다.");
      onDone(); // 카드: 입력창 비우고 편집 모드로 전환
    } catch (err) {
      console.error("답변 삭제 에러:", err.message);
      setResultMessage("답변 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleteContext(null);
    }
  };
 
  // 필터별 개수 / 필터링된 리스트
  const pendingCount = contacts.filter((i) => i.status !== "resolved").length;
  const resolvedCount = contacts.length - pendingCount;
  const filteredContacts = contacts.filter((item) => {
    if (filter === "pending") return item.status !== "resolved";
    if (filter === "resolved") return item.status === "resolved";
    return true;
  });
 
  // 로딩 중에는 (0) 대신 숫자를 숨김
  const countText = (n) => (isLoading ? "" : ` (${n})`);

  return (
    <div
      className="w-full h-screen pt-[16%] pb-[12%] px-[5%] flex flex-col bg-[length:100%_100%]"
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})` }}
    >
      {/* Header 컴포넌트 */}
      <div className="-mx-[5%] shrink-0">
        <Header title="문의사항 답변" />
      </div>

      {/* 상단 필터 탭 */}
      <div className="flex gap-[2%] mb-[4%] bg-white/40 p-[1%] rounded-lg backdrop-blur-sm shrink-0">
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 py-[2%] text-2xs font-bold rounded-md transition-all border-none cursor-pointer ${filter === "all" ? "bg-blue-600 text-white shadow" : "bg-transparent text-gray-600"}`}
        >
          전체{countText(contacts.length)}
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`flex-1 py-[2%] text-2xs font-bold rounded-md transition-all border-none cursor-pointer ${filter === "pending" ? "bg-amber-500 text-white shadow" : "bg-transparent text-gray-600"}`}
        >
          대기{countText(pendingCount)}
        </button>
        <button
          onClick={() => setFilter("resolved")}
          className={`flex-1 py-[2%] text-2xs font-bold rounded-md transition-all border-none cursor-pointer ${filter === "resolved" ? "bg-green-600 text-white shadow" : "bg-transparent text-gray-600"}`}
        >
          완료{countText(resolvedCount)}
        </button>
      </div>

      {/* 문의 목록 리스트 */}
      <div className="flex-1 space-y-[3%] overflow-y-auto pr-[1%]">
        {isLoading ? (
          <div className={CENTER_MESSAGE}>불러오는 중...</div>
        ) : isError && contacts.length === 0 ? (
          // 처음 조회에 실패했을 때만 표시 (다시 불러오다 실패하면 기존 목록 유지)
          <div className={CENTER_MESSAGE}>
            <span>데이터를 불러오는 중 오류가 발생했습니다</span>
            <button
              onClick={() => refetch()}
              className="pointer-events-auto px-[4%] py-[1.5%] bg-white/70 rounded text-xs font-bold text-gray-700 border-none cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className={CENTER_MESSAGE}>해당 조건의 문의 내역이 없습니다</div>
        ) : (
          filteredContacts.map((item) => (
            <ContactAdminCard
              key={item.contact_id}
              item={item}
              isExpanded={expandedId === item.contact_id}
              onToggle={() => setExpandedId(expandedId === item.contact_id ? null : item.contact_id)}
              onSave={handleSaveReply}
              onDelete={handleDeleteReply}
            />
          ))
        )}
      </div>

      {/* 결과 안내 공통 다이얼로그 */}
      {resultMessage && (
        <ResultDialog
          message={resultMessage}
          onConfirm={() => setResultMessage("")}
          maxWidth="320px"
        />
      )}

      {/* 답변 삭제 확인 커스텀 다이얼로그 */}
      {deleteContext && (
        <ConfirmDialog
          message={`등록된 답변을 삭제하시겠습니까?\n상태는 다시 답변대기로 변경됩니다.`}
          onConfirm={handleConfirmDelete} // 확인 시 실제 삭제 실행
          onCancel={() => setDeleteContext(null)} // 취소 시 상태 초기화하여 팝업 닫기
          maxWidth="320px"
        />
      )}
    </div>
  );
}