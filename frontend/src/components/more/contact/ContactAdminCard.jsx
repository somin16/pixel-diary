import React, { useState } from "react";

/**
 * ContactAdminCard 컴포넌트 
 * @property {Object} item - 문의사항 개별 데이터 객체 (users 조인 데이터 포함)
 * @property {Boolean} isExpanded - 현재 카드가 열려있는지 여부
 * @property {Function} onToggle - 아코디언 토글 함수
 * @property {Function} onSave - 답변 저장 부모 핸들러
 * @property {Function} onDelete - 답변 삭제 부모 핸들러
 */
export default function ContactAdminCard({ item, isExpanded, onToggle, onSave, onDelete }) {
  const [replyText, setReplyText] = useState(item.reply || "");
  const [isEditing, setIsEditing] = useState(!item.reply);
  const [error, setError] = useState("");

  // 내부 토글 핸들러 (닫힐 때 상태 리셋)
  const handleLocalToggle = () => {
    onToggle();
    if (isExpanded) {
      setReplyText(item.reply || "");
      setIsEditing(!item.reply);
      setError("");
    }
  };

  // 내부 저장 핸들러 (부모에게 데이터를 넘기기 전 먼저 검증)
  const handleLocalSave = () => {
    if (!replyText.trim()) {
      setError("답변 내용을 입력해주세요"); 
      return;
    }
    setError(""); 
    onSave(item.contact_id, replyText, setIsEditing);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-[4%] shadow-sm border border-white/50 transition-all">
      {/* 클릭 가능한 헤더 영역 */}
      <div className="cursor-pointer" onClick={handleLocalToggle}>
        <div className="flex justify-between items-start mb-[2%]">
          <div className="flex gap-[3%] items-center min-w-0">
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-[2%] py-[0.5%] rounded-sm border border-blue-100 whitespace-nowrap shrink-0">
              {item.category}
            </span>
            <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap shrink-0">
              작성자: {item.users?.user_name || "알 수 없음"}
            </span>
          </div>
          <span className={`text-[11px] font-bold whitespace-nowrap shrink-0 ${item.status === 'resolved' ? 'text-green-600' : 'text-amber-600'}`}>
            {item.status === 'resolved' ? '답변완료' : '답변대기'}
          </span>
        </div>
        <p className="text-[13px] font-medium text-gray-800 m-[0%] line-clamp-1">{item.message}</p> 
      </div>
      
      {/* 아코디언 상세 편집 패널 */}
      {isExpanded && (
        <div className="mt-[3%] pt-[3%] border-t border-gray-200/60 text-[12px] space-y-[3%] animate-fadeIn">
          <div className="bg-white/60 p-[3%] rounded-sm text-gray-700 whitespace-pre-wrap break-all leading-relaxed">
            {item.message}
          </div>
          
          <div className="space-y-[2%]">
            <label className="font-bold text-gray-700 block text-[11px]">👑 관리자 답변 입력</label>
            
            {isEditing ? (
              <div className="space-y-[2%]">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="여기에 답변 내용을 입력하세요..."
                  className="w-full p-[2.5%] text-[12px] border border-gray-300 rounded-lg bg-white text-gray-800 outline-none focus:border-blue-400 resize-none h-[80px]"
                />

                {/* 인풋창 바로 밑 에러 메시지 */}
                {error && (
                  <p className="text-red-500 font-semibold text-[11px] m-[0%] pl-[0.5%] animate-fadeIn">
                    {error}
                  </p>
                )}

                <div className="flex gap-[2%] justify-end">
                  {item.reply && (
                    <button 
                      onClick={() => { setIsEditing(false); setReplyText(item.reply); }}
                      className="px-[3%] py-[1.5%] bg-gray-400 text-white rounded-sm font-bold border-none cursor-pointer text-[11px]"
                    >
                      취소
                    </button>
                  )}

                  <button 
                    onClick={handleLocalSave}
                    className="px-[4%] py-[1.5%] bg-blue-600 text-white rounded-sm font-bold border-none cursor-pointer text-[11px]"
                  >
                    {item.reply ? "수정 완료" : "답변 등록"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50/60 p-[3%] rounded-sm border-l-4 border-blue-400 space-y-[2%]">
                <p className="text-gray-700 m-[0%] whitespace-pre-wrap break-all leading-relaxed">{item.reply}</p>
                <div className="flex gap-[2%] justify-end pt-[1%] border-t border-blue-100/50">
                  <button 
                    onClick={() => onDelete(item.contact_id, setReplyText, setIsEditing)}
                    className="px-[2.5%] py-[1%] bg-red-500 text-white rounded-sm font-bold border-none cursor-pointer text-[11px]"
                  >
                    삭제
                  </button>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-[2.5%] py-[1%] bg-amber-500 text-white rounded-sm font-bold border-none cursor-pointer text-[11px]"
                  >
                    수정
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}