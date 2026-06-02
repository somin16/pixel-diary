import React from "react";

/**
 * ContactCard 컴포넌트 
 * @property {Object} item - 문의사항 개별 데이터 객체 (id, category, message, status, reply 등 포함)
 * @property {Boolean} isExpanded - 현재 카드가 아코디언 형태로 열려있는지 여부 (true: 열림, false: 닫힘)
 * @property {Function} onToggle - 카드를 클릭했을 때 열림/닫힘 상태를 제어하는 부모 컴포넌트의 핸들러 함수
 */

export default function ContactCard({ item, isExpanded, onToggle }) {
  return (
    <div
      className="bg-white/80 backdrop-blur-sm rounded-lg p-[4%] shadow-sm border border-white/50 cursor-pointer transition-all active:scale-[0.99]"
      onClick={onToggle}
    >
      {/* 상단 태그 및 상태 */}
      <div className="flex justify-between items-start mb-[2%]">
        <span className="text-3xs font-bold text-blue-600 bg-blue-50/80 px-[2%] py-[0.5%] rounded border border-blue-100 whitespace-nowrap shrink-0">
          {item.category}
        </span>

        <div className="flex items-center">
          <span className={`relative inline-block text-3xs font-bold whitespace-nowrap shrink-0 ${item.status === 'resolved' ? 'text-green-600' : 'text-amber-600'}`}>
            {item.status === 'resolved' ? '답변완료' : '답변대기'}

            {/* 아직 안 읽은 글이라면 카드 우상단 쪽에 작은 빨간 점 표시 */}
            {item.status === 'resolved' && !item.is_read && (
              <span className="absolute -top-[2px] -right-[8px] w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </span>
        </div>
      </div>

      {/* 문의 본문 미리보기 (한 줄 제한) */}
      <p className="text-xs font-medium text-gray-800 m-[0%] line-clamp-1">{item.message}</p>

      {/* 클릭 시 활성화되는 아코디언 상세 내용 */}
      {isExpanded && (
        <div className="mt-[3%] pt-[3%] border-t border-gray-200/60 text-2xs text-gray-600 space-y-[3%] animate-fadeIn">
          {/* 유저 본문 전체 */}
          <div className="bg-white/60 p-[3%] rounded text-gray-700 whitespace-pre-wrap break-all leading-relaxed">
            {item.message}
          </div>

          {/* 관리자 답변 영역 */}
          {item.status === 'resolved' && item.reply ? (
            <div className="bg-blue-50/60 p-[3%] rounded border-l-4 border-blue-400">
              <p className="font-bold text-blue-700 text-3xs m-[0%] mb-[1%]">👑 관리자 답변</p>
              <p className="text-gray-700 m-[0%] whitespace-pre-wrap break-all leading-relaxed">{item.reply}</p>
            </div>
          ) : (
            item.status !== 'resolved' && (
              <div className="text-3xs text-gray-400 italic pl-[1%]">
                담당자가 확인 중입니다...
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}