import React, { useState } from "react";
import { useTheme } from '../../../stores/useThemeStore';
import { getAssetUrl } from "../../../utils/AssetHelper";
import { useMyContacts, useMarkContactRead } from "../../../hooks/queries/useContactQueries"; // 문의하기 리액트 쿼리

// 컴포넌트 불러오기
import Header from "../../../components/common/Header";
import ResultDialog from "../../../components/common/dialog/ResultDialog";
import FloatingActionButton from "../../../components/home/FloatingActionButton";
import ContactDialog from "../../../components/more/contact/ContactDialog";
import ContactCard from "../../../components/more/contact/ContactCard";

// 배경 위 안내 문구 공통 스타일
const CENTER_MESSAGE = "fixed inset-0 flex flex-col justify-center items-center gap-[2%] text-gray-500 text-sm pointer-events-none";

export default function Contact() {
  const currentTheme = useTheme((state) => state.currentTheme);

  // 서버 데이터: React Query
  // isLoading은 "처음 불러올 때"만 true → 작성 후 다시 불러올 때는 기존 목록 유지 (깜빡임 없음)
  const { data: contacts = [], isLoading, isError, refetch } = useMyContacts();
  const markRead = useMarkContactRead();

  // 다이얼로그 및 아코디언 제어 상태
  const [activeDialog, setActiveDialog] = useState(null);
  const [resultDialog, setResultDialog] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // 카드를 펼칠 때 안 읽은 답변이면 읽음 처리
  const handleCardToggle = (item) => {
    const isExpanding = expandedId !== item.contact_id;
    setExpandedId(isExpanding ? item.contact_id : null);
 
    if (isExpanding && item.status === 'resolved' && !item.is_read) {
      markRead.mutate(item.contact_id, {
        onError: (err) => console.error("읽음 상태 업데이트 에러:", err.message),
      });
    }
  };
 
  // 문의 작성 결과 처리 (목록 갱신은 useCreateContact가 처리)
  const handleContactResult = (isSuccess) => {
    setActiveDialog(null);
    setResultDialog(isSuccess ? 'contact_success' : 'contact_error');
  };

  return (
    <div
      className="w-full h-screen pt-[16%] pb-[12%] px-[5%] flex flex-col overflow-hidden bg-[length:100%_100%]"
      style={{ backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})` }}
    >
      {/* Header 컴포넌트 */}
      <div className="-mx-[5%] shrink-0">
        <Header title="내 문의 내역" />
      </div>

      {/* 문의 리스트 영역 */}
      <div className="flex-1 space-y-[3%] overflow-y-auto pr-[1%]">
        {isLoading ? (
          <div className={CENTER_MESSAGE}>불러오는 중...</div>
        ) : isError && contacts.length === 0 ? (
          <div className={CENTER_MESSAGE}>
            <span>문의 내역을 불러오지 못했습니다</span>
            <button
              onClick={() => refetch()}
              className="pointer-events-auto px-[4%] py-[1.5%] bg-white/70 rounded text-xs font-bold text-gray-700 border-none cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        ) : contacts.length === 0 ? (
          <div className={CENTER_MESSAGE}>작성하신 문의 내역이 없습니다</div>
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