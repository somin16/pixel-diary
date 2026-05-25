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

  const [category, setCategory] = useState("AI 그림 생성 오류");
  const [customCategory, setCustomCategory] = useState("");

  // 중복 전송 방지를 위한 로딩 상태 추가
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 문의하기 보내기 버튼 클릭 시 실행되는 비동기 함수
  const handleSend = async () => {
    // 이미 전송 중이면 실행 방지
    if (isSubmitting) return;

    // 공백만 입력했거나 아예 입력하지 않은 경우 전송 방지
    if (!content.trim()) {
      setError("내용을 입력해주세요");
      return;
    }

    // 기타(직접입력) 선택 시 빈칸 검사 추가
    if (category === "기타 (직접입력)" && !customCategory.trim()) {
      setError("카테고리를 입력해주세요");
      return;
    }
    
    // 전송 시도를 시작할 때, 기존에 떠있던 빨간 에러 메시지 지우기
    setError(""); 
    setIsSubmitting(true); // 전송 시작 시 로딩 상태 활성화
    
    try {
      // 현재 요청을 보내는 유저가 누구인지(세션) 확인
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      // 유저 정보가 없거나 에러가 났다면 (오래 켜둬서 로그인이 풀린 경우 등)
      if (authError || !user) {
        setError("로그인 세션이 만료되었습니다.");
        return;
      }

      // 'users' 테이블에서 현재 로그인한 유저의 정보 조회 (이름 및 서비스용 ID 가져오기)
      const { data: userData, error: userError } = await supabase
        .from('users')           
        .select('user_id, user_name') 
        .eq('user_id', user.id)  
        .single();

      if (userError || !userData) {
        setError("유저 프로필 정보를 찾을 수 없습니다.");
        return;
      }

      // 최종 저장할 카테고리 값 가공
      const finalCategory = category === "기타 (직접입력)" ? customCategory.trim() : category;

      // Supabase의 'contact' 테이블에 데이터 삽입 (INSERT)
      const { error: insertError } = await supabase
        .from('contact')
        .insert({
          user_id: userData.user_id,   // users 테이블의 고유 ID를 삽입
          message: content.trim(),   // 사용자가 작성한 문의 내용 - 앞뒤 공백 제거 후 저장
          category: finalCategory, // 문의사항 카테고리
        });

      // DB 삽입 중 RLS 권한 문제나 네트워크 에러가 발생하면 catch 블록으로 던짐
      if (insertError) throw insertError;

      // 성공 처리 및 폼 초기화
      onResult(true);
      setContent(""); 
      setCategory("AI 그림 생성 오류");
      setCustomCategory("");

    } catch (error) {
      // 에러 예외 처리
      console.error('문의하기 전송 에러:', error);
      setError("서버 통신 중 오류가 발생했습니다. 다시 시도해 주세요.");
      } finally {
      setIsSubmitting(false); // 성공하든 실패하든 로딩 상태 해제
    }
  };

  return (
    <DialogBox boxImageName="popup_message_box_long_x3" width={width} maxWidth={maxWidth}>
      <div className="w-full h-full flex flex-col items-center pb-[4%]">
        {/* 타이틀 */}
        <p className={`text-[13px] font-bold text-center m-0 ${!error ? 'mt-[1%]' : 'mt-[2%]'}`}>
          문의하고 싶은 내용을 입력하세요
        </p>

        {/* 카테고리 드롭다운 선택 영역 */}
        <div className="w-[90%] mt-[3%]">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setError(""); // 선택 변경 시 에러 초기화
            }}
            disabled={isSubmitting} // 전송 중에는 조작 불가
            className="w-full p-2 text-[12px] font-medium border border-gray-300 rounded bg-white text-gray-800 outline-none focus:border-blue-400"
          >
            <option value="AI 그림 생성 오류">AI 그림 생성 오류</option>
            <option value="일기 작성 및 저장 오류">일기 작성 및 저장 오류</option>
            <option value="미니게임 오류">미니게임 오류</option>
            <option value="계정 및 로그인">계정 및 로그인</option>
            <option value="제안 및 건의사항">제안 및 건의사항</option>
            <option value="기타 버그">기타 버그</option>
            <option value="기타 (직접입력)">기타 (직접입력)</option>
          </select>
        </div>

        {/* '기타 (직접입력)' 선택 시에만 활성화되는 텍스트 입력창 */}
        {category === "기타 (직접입력)" && (
          <div className="w-[90%] mt-[2%]">
            <input
              type="text"
              placeholder="직접 입력해주세요"
              value={customCategory}
              maxLength={20} // 카테고리명은 최대 20자 제한
              onChange={(e) => {
                setCustomCategory(e.target.value);
                if (e.target.value.trim()) setError("");
              }}
              disabled={isSubmitting}
              className="w-full p-2 text-[11px] border border-gray-300 rounded bg-white text-gray-800 outline-none focus:border-blue-400"
            />
          </div>
        )}

        {/* 입력창 영역 */}
        <div 
          className="w-[90%] mt-[4%] flex-1 p-[4%] flex flex-col relative bg-[length:100%_100%] bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${getAssetUrl(currentTheme, 'boxes', 'info_box_x3')})` 
          }}
        >
          <textarea
            className="w-full h-full pb-[4%] bg-transparent outline-none resize-none text-[12px] placeholder-[#9EA5C3]"
            placeholder="내용을 입력하세요 (최대 500자)"
            value={content}
            maxLength={500}
            onChange={(e) => {
              setContent(e.target.value);
              if (e.target.value.trim()) setError(""); // 입력 시 에러 즉시 제거
            }}
            disabled={isSubmitting}
          />
        </div>

        {/* 에러 메시지 출력 (에러 있을 때만 렌더링) */}
        <div className="h-[8%] flex items-center justify-center mt-[2%] mb-[1%]">
          {error && (
            <p className="text-[#ef4444] text-[11px] font-bold m-0">{error}</p>
          )}
        </div>

        <div className={`mt-auto flex gap-[5%] justify-center w-full ${isSubmitting ? "opacity-50" : ""}`}>
          <ImageButton
            label="취소하기"
            imageSrc={getAssetUrl(currentTheme, 'buttons', 'blue_button_x3')}
            onClick={isSubmitting ? null : onCancel} // 전송 중에는 취소 방지
          />
          <ImageButton
            label={isSubmitting ? "보내는 중..." : "보내기"} // 상태 시각화
            imageSrc={getAssetUrl(currentTheme, 'buttons', 'green_button_x3')}
            onClick={handleSend}
          />
        </div>
      </div>
    </DialogBox>
  );
};

export default ContactDialog;