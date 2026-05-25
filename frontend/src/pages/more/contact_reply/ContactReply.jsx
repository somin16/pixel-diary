import React, { useEffect, useState } from "react";
import { supabase } from "../../../utils/SupabaseClient";
import { useTheme } from "../../../store/useThemeStore";
import { getAssetUrl } from "../../../utils/AssetHelper";

// 컴포넌트 불러오기
import Header from "../../../components/common/Header";
import ResultDialog from "../../../components/common/dialog/ResultDialog";
import ConfirmDialog from "../../../components/common/dialog/ConfirmDialog";
import ContactAdminCard from "../../../components/more/contact/ContactAdminCard";

export default function ContactReply() {
  const currentTheme = useTheme((state) => state.currentTheme);

  // 상태 관리
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, resolved
  const [expandedId, setExpandedId] = useState(null);
  const [resultMessage, setResultMessage] = useState(""); // 알림 팝업 상태
  const [deleteContext, setDeleteContext] = useState(null);

  useEffect(() => {
    fetchAllContacts(); // 컴포넌트 마운트 시 관리자용 전체 목록 조회
  }, []);

  // 1. 전체 문의 내역 가져오기 (유저 이름 조인을 위해 users 정보 포함)
  const fetchAllContacts = async () => {
    try {
      setLoading(true);
      // contact 테이블 전체를 가져오면서 외부 키로 연결된 users 테이블의 user_name을 조인하여 함께 조회
      const { data, error } = await supabase
        .from("contact")
        .select(`*, users ( user_name )`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      console.error("전체 문의 로딩 에러:", err.message);
      setResultMessage("데이터를 불러오는 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 2. 답변 등록 및 수정 (C / U)
  const handleSaveReply = async (contactId, text, setIsEditing) => {
    try {
      // 입력된 답변 본문, 해결 완료 상태, 그리고 답변 등록 시각을 DB에 업데이트
      const { error } = await supabase
        .from("contact")
        .update({
          reply: text.trim(),
          status: "resolved", // 답변 완료 상태로 변경
          replied_at: new Date().toISOString(), // 답변 등록/수정 시간 추가
          is_read: false, // 관리자가 답변을 달았으므로 유저가 읽을 때까지 '안읽음' 상태로 강제 전환
        })
        .eq("contact_id", contactId);

      if (error) throw error;

      setResultMessage("답변이 성공적으로 저장되었습니다");
      setIsEditing(false);
      fetchAllContacts(); // 데이터 갱신을 위해 목록 새로고침 호출
    } catch (err) {
      console.error("답변 저장 에러:", err.message);
      setResultMessage("답변 저장 중 오류가 발생했습니다");
    }
  };

  // 3. 답변 삭제 (D) -> 데이터를 완전히 지우는 게 아니라 reply를 비우고 대기 상태로 변경
  const handleDeleteReply = async (contactId, setReplyText, setIsEditing) => {
    setDeleteContext({ contactId, setReplyText, setIsEditing });
  };

  const handleConfirmDelete = async () => {  
    if (!deleteContext) return;
    const { contactId, setReplyText, setIsEditing } = deleteContext;

    try {
      // reply 본문과 시각 컬럼을 null로 비우고 상태코드를 다시 pending(대기)으로 원복
      const { error } = await supabase
        .from("contact")
        .update({
          reply: null,
          status: "pending", // 다시 답변 대기 상태로 변경
          replied_at: null, // 답변 삭제 시 시간 기록도 함께 비우기
        })
        .eq("contact_id", contactId);

      if (error) throw error;

      setResultMessage("답변이 삭제되었습니다");
      setReplyText("");
      setIsEditing(true); // 삭제 후 바로 새 답변을 쓸 수 있게 폼 편집 모드 활성화
      fetchAllContacts(); // 목록 새로고침
    } catch (err) {
      console.error("답변 삭제 에러:", err.message);
      setResultMessage("답변 삭제 중 오류가 발생했습니다");
    } finally {
      setDeleteContext(null); 
    }
  };

  // 필터링된 리스트 계산
  const filteredContacts = contacts.filter((item) => {
    if (filter === "pending") return item.status !== "resolved";
    if (filter === "resolved") return item.status === "resolved";
    return true; // all
  });

  if (loading) {
    return (
      <div className="w-full h-full flex justify-center items-center text-gray-500 text-lg">
        불러오는 중...
      </div>
    );
  }

  return (
    <div 
      className="w-full h-screen pt-[16%] pb-[12%] px-[5%] flex flex-col bg-[length:100%_100%]"
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme,'backgrounds','menu_background_x3')})` }}
    >
      {/* Header 컴포넌트 */}
      <div className="-mx-[5%] shrink-0">
        <Header title="문의사항 답변" />
      </div>

      {/* 상단 필터 탭 */}
      <div className="flex gap-[2%] mb-[4%] bg-white/40 p-[1%] rounded-lg backdrop-blur-sm shrink-0">
        <button 
          onClick={() => setFilter("all")}
          className={`flex-1 py-[2%] text-[12px] font-bold rounded-md transition-all border-none cursor-pointer ${filter === "all" ? "bg-blue-600 text-white shadow" : "bg-transparent text-gray-600"}`}
        >
          전체 ({contacts.length})
        </button>
        <button 
          onClick={() => setFilter("pending")}
          className={`flex-1 py-[2%] text-[12px] font-bold rounded-md transition-all border-none cursor-pointer ${filter === "pending" ? "bg-amber-500 text-white shadow" : "bg-transparent text-gray-600"}`}
        >
          대기 ({contacts.filter(i => i.status !== 'resolved').length})
        </button>
        <button 
          onClick={() => setFilter("resolved")}
          className={`flex-1 py-[2%] text-[12px] font-bold rounded-md transition-all border-none cursor-pointer ${filter === "resolved" ? "bg-green-600 text-white shadow" : "bg-transparent text-gray-600"}`}
        >
          완료 ({contacts.filter(i => i.status === 'resolved').length})
        </button>
      </div>

      {/* 문의 목록 내역 리스트 */}
      <div className="flex-1 space-y-[3%] overflow-y-auto pr-[1%]">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-[20%] text-gray-500 text-sm">해당 조건의 문의 내역이 없습니다</div>
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