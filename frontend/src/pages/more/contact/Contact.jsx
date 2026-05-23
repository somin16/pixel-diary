import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/SupabaseClient"; 
import { useTheme } from '../../../store/useThemeStore';
import { getAssetUrl } from "../../../utils/AssetHelper";

// 컴포넌트 불러오기
import Header from "../../../components/common/Header";
import ResultDialog from "../../../components/common/dialog/ResultDialog";
import FloatingActionButton from "../../../components/home/FloatingActionButton";
import ContactDialog from "../../../components/more/contact/ContactDialog";
import ContactCard from "../../../components/more/contact/ContactCard";

export default function Contact() {
  const navigate = useNavigate();
  const currentTheme = useTheme((state) => state.currentTheme);

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 다이얼로그 및 아코디언 제어 상태
  const [activeDialog, setActiveDialog] = useState(null); 
  const [resultDialog, setResultDialog] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // 카드를 클릭해 펼칠 때 안 읽은 답변이라면 읽음 처리하는 함수
  const handleCardToggle = async (item) => {
    const isExpanding = expandedId !== item.contact_id; // 현재 닫혀있다가 열리는 중인지 확인
    setExpandedId(isExpanding ? item.contact_id : null);

    // 열리는 중이고, 답변완료인데, 아직 안 읽은 상태일 때
    if (isExpanding && item.status === 'resolved' && !item.is_read) {
      try {
        const { error } = await supabase
          .from("contact")
          .update({ is_read: true })
          .eq("contact_id", item.contact_id);

        if (error) throw error;

        // 로컬 state(contacts)에서도 해당 아이템의 is_read를 true로 즉시 바꿈
        setContacts(prev =>
          prev.map(c => c.contact_id === item.contact_id ? { ...c, is_read: true } : c)
        );
        console.log("DB 읽음 처리 완료:", item.contact_id);
      } catch (err) {
        console.error("읽음 상태 업데이트 에러:", err.message);
      }
    }
  };

  useEffect(() => {
    fetchMyContacts(); // 컴포넌트 마운트 시 내 문의 목록 조회
  }, []);

  // 내 문의 내역 서버에서 받아오기
  const fetchMyContacts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // contact 테이블에서 현재 로그인한 유저의 데이터만 필터링
      const { data, error } = await supabase
        .from("contact")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }); // 최근 작성일 순 정렬

      if (error) throw error;
      setContacts(data);
    } catch (err) {
      console.error("문의 내역 로딩 에러:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // 문의 작성 팝업 결과 처리 핸들러
  const handleContactResult = (isSuccess) => {
    setActiveDialog(null); // 입력 다이얼로그 닫기
    if (isSuccess) {
      setResultDialog('contact_success'); // 성공 시
      fetchMyContacts(); // 새 글 등록 성공 시 목록 실시간 새로고침
    } else {
      setResultDialog('contact_error'); // 실패 시
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex justify-center items-center text-gray-500 text-lg">
        불러오는 중...
      </div>
    );
  }

  return (
    <div 
      className="w-full h-screen pt-[16%] pb-[12%] px-[5%] flex flex-col overflow-hidden bg-[length:100%_100%]"
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme,'backgrounds','menu_background_x3')})` }}
    >
      {/* Header 컴포넌트 */}
      <div className="-mx-[5%] shrink-0">
        <Header title="내 문의 내역" />
      </div>

      {/* 문의 리스트 영역 */}
      <div className="flex-1 space-y-[3%] overflow-y-auto pr-[1%]">
        {contacts.length === 0 ? (
          <div className="text-center py-[20%] text-gray-500 text-sm">
            작성하신 문의 내역이 없습니다
          </div>
        ) : (
          contacts.map((item) => (
            <ContactCard
                key={item.contact_id}
                item={item}
                isExpanded={expandedId === item.contact_id}
                onToggle={() => handleCardToggle(item)}
            />
          ))
        )}
      </div>

      {/* 플로팅액션버튼 컴포넌트 - 문의작성버튼 */}
      <div className="fixed bottom-[5%] right-[5%] z-40">
        <FloatingActionButton 
          currentTheme={currentTheme}
          ariaLabel="문의작성버튼"
          onClick={() => setActiveDialog('contact')} // 버튼 클릭 시 작성 다이얼로그 활성화
        />
      </div>

      {/* 문의 입력 다이얼로그 */}
      {activeDialog === 'contact' && (
        <ContactDialog 
          onCancel={() => setActiveDialog(null)} 
          onResult={handleContactResult}
          maxWidth="320px"
        />
      )}

      {/* 문의 완료 다이얼로그 */}
      {resultDialog === 'contact_success' && (
        <ResultDialog 
          message={<>문의가 성공적으로<br />접수되었습니다.</>} 
          onConfirm={() => setResultDialog(null)} 
          maxWidth="320px"
        />
      )}

      {/* 문의 실패 다이얼로그 */}
      {resultDialog === 'contact_error' && (
        <ResultDialog 
          message={<>일시적인 오류로<br />전송에 실패했습니다.<br />잠시 후 다시 시도해주세요.</>} 
          onConfirm={() => setResultDialog(null)} 
          maxWidth="320px"
        />
      )}
    </div>
  );
}