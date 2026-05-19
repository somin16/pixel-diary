import React, { useState } from "react";
import { useTheme } from "../../../store/useThemeStore";
import { getAssetUrl } from "../../../utils/AssetHelper";
import { supabase } from "../../../utils/SupabaseClient";

// 컴포넌트 불러오기
import DialogBox from "../../common/dialog/DialogBox";
import ImageButton from "../../common/ImageButton";

const ContactDialog = ({ onCancel, onResult, width = "100%", maxWidth = "320px" }) => {
  const currentTheme = useTheme((state) => state.currentTheme);
  
  // 상태 관리
  const [content, setContent] = useState("");
  const [error, setError] = useState(""); // 에러 상태 추가
  
  // 문의하기 보내기 버튼 클릭 시 실행되는 비동기 함수
  const handleSend = async () => {
    // 공백만 입력했거나 아예 입력하지 않은 경우 전송 방지
    if (!content.trim()) {
      setError("내용을 입력해주세요");
      return;
    }
    
    // 전송 시도를 시작할 때, 기존에 떠있던 빨간 에러 메시지 지우기
    setError(""); 
    
    try {
      // 현재 요청을 보내는 유저가 누구인지(세션) 확인
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      // 유저 정보가 없거나 에러가 났다면 (오래 켜둬서 로그인이 풀린 경우 등)
      if (authError || !user) {
        setError("로그인 세션이 만료되었습니다.");
        return;
      }

      // Supabase의 'contact' 테이블에 데이터 삽입 (INSERT)
      const { error: insertError } = await supabase
        .from('contact')
        .insert({
          user_id: user.id,   // 현재 로그인한 유저의 고유 식별자(UID)
          message: content,   // 사용자가 작성한 문의 내용
        });

      // DB 삽입 중 RLS 권한 문제나 네트워크 에러가 발생하면 catch 블록으로 던짐
      if (insertError) throw insertError;

      // 성공
      onResult(true);
      
      // 다음 문의 작성을 위해 입력되어 있던 텍스트 지우기
      setContent(""); 

    } catch (error) {
      // 에러 예외 처리
      console.error('문의하기 전송 에러:', error);
      setError("서버 통신 중 오류가 발생했습니다. 다시 시도해 주세요.");
    }
  };

  return (
    <DialogBox boxImageName="popup_message_box_x3" width={width} maxWidth={maxWidth}>
      <div className="w-full h-full flex flex-col items-center pb-[4%]">
        {/* 타이틀 */}
        <p className={`text-[13px] font-bold text-center m-0 ${!error ? 'mt-[1%]' : 'mt-[2%]'}`}>
          문의하고 싶은 내용을 입력하세요
        </p>

        {/* 입력창 영역 */}
        <div 
          className="w-[90%] mt-[4%] flex-1 p-[4%] flex flex-col relative bg-[length:100%_100%] bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'info_box_x3')})` 
          }}
        >
          <textarea
            className="w-full h-full pb-[4%] bg-transparent outline-none resize-none text-[12px] placeholder-[#9EA5C3]"
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (e.target.value.trim()) setError(""); // 입력 시 에러 즉시 제거
            }}
          />
        </div>

        {/* 에러 메시지 출력 (에러 있을 때만 렌더링) */}
        <div className="h-[8%] flex items-center justify-center mt-[2%] mb-[1%]">
          {error && (
            <p className="text-[#ef4444] text-[11px] font-bold m-0">{error}</p>
          )}
        </div>

        <div className="mt-auto flex gap-[5%] justify-center w-full">
          <ImageButton
            label="취소하기"
            imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')}
            onClick={onCancel}
          />
          <ImageButton
            label="보내기"
            imageSrc={getAssetUrl(currentTheme, 'buttons', 'green_button_x3')}
            onClick={handleSend}
          />
        </div>
      </div>
    </DialogBox>
  );
};

export default ContactDialog;