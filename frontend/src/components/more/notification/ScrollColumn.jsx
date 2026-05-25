import React, { useEffect, useRef } from "react";

/**
 * 독립형 드럼 휠 스크롤 컬럼 컴포넌트
 * @param {Array} options - 휠에 표시할 문자열 배열 (예: ["오전", "오후"])
 * @param {string} value - 현재 선택된 상태값
 * @param {function} onChange - 스크롤로 값이 변경되었을 때 부모의 상태를 바꿀 핸들러 함수
 */

const ScrollColumn = ({ options, value, onChange }) => {
  // 스크롤 요소 제어용 Ref
  const listRef = useRef(null);
  const scrollTimeoutRef = useRef(null); // 스크롤이 완전히 멈췄는지 감지할 타이머
  const isProgrammaticScroll = useRef(false); // 코드로 강제 스크롤 중인지 여부 플래그

  // 상하단 정중앙 배치를 위해 원본 배열 앞뒤로 빈 공백 주입
  const paddedOptions = ["", ...options, ""];

  // 선택된 상태값(value)에 맞춰 초기 스크롤 위치 지정
  useEffect(() => {
    const scrollToIndex = () => {
      if (!listRef.current) return;

      const index = options.indexOf(value);
      if (index !== -1) {
        const itemHeight = listRef.current.clientHeight / 3;

        // 초기에 높이가 0으로 잡히면 다음 프레임에 재시도
        if (itemHeight === 0) {
          requestAnimationFrame(scrollToIndex);
          return;
        }

        const targetTop = index * itemHeight;
        if (Math.abs(listRef.current.scrollTop - targetTop) > 1) {
          // 코드로 움직이는 것임을 표시하여 유저 스크롤 이벤트와의 충돌을 막습니다.
          isProgrammaticScroll.current = true;
          listRef.current.scrollTop = targetTop;
        }
      }
    };

    scrollToIndex();
  }, [value, options]);

  // 스크롤 이벤트 핸들러
  const handleScroll = (e) => {
    // 자동 스크롤에 의한 이벤트는 무시하여 충돌 및 튕김 방지
    if (isProgrammaticScroll.current) {
      isProgrammaticScroll.current = false;
      return;
    }

    const top = e.target.scrollTop;
    const itemHeight = e.target.clientHeight / 3;
    if (itemHeight === 0) return;

    // 디바운스: 유저가 휠 조작을 멈출 때까지 타이머 초기화
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // 스크롤이 완전히 멈추고 80ms 후에 정중앙에 위치한 값 선출
    scrollTimeoutRef.current = setTimeout(() => {
      const index = Math.round(top / itemHeight);

      if (index >= 0 && index < options.length) {
        const selected = options[index];

        // 스크롤이 멈추면 수학적 정중앙 좌표로 스크롤을 강제 고정
        const targetTop = index * itemHeight;
        isProgrammaticScroll.current = true;
        listRef.current.scrollTop = targetTop;

        // 최종 결정된 중심값이 현재 상태와 다를 때만 부모에게 전송
        if (selected !== value) {
          onChange(selected);
        }
      }
    }, 80);
  };

  // 컴포넌트가 꺼질 때 메모리 누수 방지를 위해 타이머 제거
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      className="overflow-y-scroll snap-y snap-mandatory h-full no-scrollbar w-full"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {paddedOptions.map((opt, idx) => {
        const isSelected = opt === value;
        return (
          <div
            key={idx}
            className="snap-center h-[33.33%] flex items-center justify-center font-extrabold transition-all duration-200"
            style={{
              fontSize: isSelected ? "24px" : "16px",
              color: isSelected ? "#000000" : "#bbbbbb",
              opacity: isSelected ? 1 : 0.4,
            }}
          >
            {opt}
          </div>
        );
      })}
    </div>
  );
};

export default ScrollColumn;