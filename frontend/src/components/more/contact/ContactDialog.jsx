import React, { useState } from "react";
import { useTheme } from "../../../stores/useThemeStore";
import { getAssetUrl } from "../../../utils/AssetHelper";
import { useCreateContact } from "../../../hooks/queries/useContactQueries"; // 문의 작성 mutation

// 컴포넌트 불러오기
import DialogBox from "../../common/dialog/DialogBox";
import ImageButton from "../../common/ImageButton";

// 카테고리 기본값 / 직접입력 옵션 값
const DEFAULT_CATEGORY = "AI 그림 생성 오류";
const CUSTOM_CATEGORY = "기타 (직접입력)";

const ContactDialog = ({ onCancel, onResult, width = "100%", maxWidth = "320px" }) => {
  const currentTheme = useTheme((state) => state.currentTheme);
  // 문의 작성 요청 훅 (전송 상태 관리 + 성공 시 목록 자동 갱신)
  const createContact = useCreateContact();

  // 상태 관리
  const [content, setContent] = useState(""); // 문의 내용
  const [error, setError] = useState(""); // 에러 상태 추가
  const [category, setCategory] = useState(DEFAULT_CATEGORY); // 선택한 카테고리
  const [customCategory, setCustomCategory] = useState("");  // 직접입력 카테고리

  // 중복 전송 방지: mutation의 진행 상태를 그대로 사용
  // (성공/실패 모두 자동으로 false가 되므로 finally에서 직접 해제할 필요 없음)
  const isSubmitting = createContact.isPending;

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
    if (category === CUSTOM_CATEGORY && !customCategory.trim()) {
      setError("카테고리를 입력해주세요");
      return;
    }

    // 전송 시도를 시작할 때, 기존에 떠있던 빨간 에러 메시지 지우기
    setError("");
    // 최종 저장할 카테고리 (직접입력이면 입력한 값, 아니면 선택한 값)
    const finalCategory = category === CUSTOM_CATEGORY ? customCategory.trim() : category;
 
    try {
      // user_id, status 등은 보내지 않음 → DB 트리거가 자동으로 채움
      await createContact.mutateAsync({
        message: content.trim(),
        category: finalCategory,
      });
 
      // 성공 처리 및 폼 초기화
      onResult(true);
      setContent("");
      setCategory(DEFAULT_CATEGORY);
      setCustomCategory("");
    } catch (err) {
      console.error('문의하기 전송 에러:', err);
 
      if (err.status === 401) {
        setError("로그인 세션이 만료되었습니다");
      } else if (err.code === 'P0001') {
        setError(err.message); // 트리거의 도배 방지: "잠시 후 다시 시도해주세요"
      } else {
        setError("서버 통신 중 오류가 발생했습니다");
      }
    }
  };

  return (
    <DialogBox boxImageName="popup_message_box_long_x3" width={width} maxWidth={maxWidth}>
      <div className="w-full h-full flex flex-col items-center pb-[4%]">
        {/* 타이틀 */}
        <p className={`text-xs font-bold text-center m-0 ${!error ? 'mt-[1%]' : 'mt-[2%]'}`}>
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
            className="w-full p-2 text-2xs font-medium border border-gray-300 rounded bg-white text-gray-800 outline-none focus:border-blue-400"
          >
            <option value="AI 그림 생성 오류">AI 그림 생성 오류</option>
            <option value="일기 작성 및 저장 오류">일기 작성 및 저장 오류</option>
            <option value="미니게임 오류">미니게임 오류</option>
            <option value="계정 및 로그인">계정 및 로그인</option>
            <option value="제안 및 건의사항">제안 및 건의사항</option>
            <option value="기타 버그">기타 버그</option>
            <option value={CUSTOM_CATEGORY}>{CUSTOM_CATEGORY}</option>
          </select>
        </div>

        {/* '기타 (직접입력)' 선택 시에만 활성화되는 텍스트 입력창 */}
        {category === CUSTOM_CATEGORY && (
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
              className="w-full p-2 text-xs border border-gray-300 rounded bg-white text-gray-800 outline-none focus:border-blue-400"
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
            className="w-full h-full pb-[4%] bg-transparent outline-none resize-none text-2xs placeholder-[#9EA5C3]"
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
            <p className="text-[#ef4444] text-2xs font-bold m-0">{error}</p>
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