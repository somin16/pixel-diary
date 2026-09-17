import { useState, useRef, useEffect } from 'react';

/**
 * Dropdown - 공용 드롭다운 컴포넌트
 * 로직만 여기서 공유하고, 스타일은 각자의 페이지에서 책임
 *
 * 열림/닫힘 상태, 바깥 클릭 감지, 옵션 선택 처리는 여기서 공통으로 관리,
 * 실제 "트리거 버튼"과 "옵션 한 줄"이 어떻게 생겼는지는 각 페이지가 직접 그리도록
 * renderTrigger / renderOption으로 위임함
 *
 * @param {Array<{value: string, label: string}>} options - 선택 가능한 옵션 목록
 * @param {string} value - 현재 선택된 값
 * @param {function(string): void} onChange - 값이 선택되면 호출됨 (호출 시 메뉴는 자동으로 닫힘)
 * @param {function({ selectedLabel: string, isOpen: boolean, toggle: function }): JSX.Element} renderTrigger
 *        - 닫혀있을 때 보이는 버튼을 그리는 함수. selectedLabel(현재 선택된 라벨), isOpen(열림 여부),
 *          toggle(열고 닫는 함수)을 받아서 원하는 모양으로 그리면 됨
 * @param {function({ option: {value,label}, isSelected: boolean, select: function }): JSX.Element} renderOption
 *        - 펼쳐진 목록의 옵션 한 줄을 그리는 함수. option(해당 옵션), isSelected(선택 여부),
 *          select(그 옵션을 선택하는 함수)를 받아서 원하는 모양으로 그리면 됨
 * @param {string} [listClassName] - 옵션 목록(ul)에 추가로 적용할 className (배치/간격 등)
 */
export default function Dropdown({
  options,        // 선택지 배열 - [{ value, label }, ...] 형태
  value,          // 현재 선택된 값 (부모 컴포넌트의 state)
  onChange,       // 값이 바뀔 때 부모에게 알려주는 콜백
  renderTrigger,  // 닫힌 상태 버튼을 그리는 render prop
  renderOption,   // 옵션 한 줄을 그리는 render prop
  listClassName = '', // 옵션 목록(ul)에 붙일 추가 클래스 (기본값: 없음)
}) {
  // 메뉴가 열려있는지 여부
  const [isOpen, setIsOpen] = useState(false);

  // 드롭다운 전체 영역
  const containerRef = useRef(null);

  // 드롭다운 바깥을 클릭하면 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      // containerRef 영역(트리거+목록) 밖을 클릭했을 때만 닫음
      // 목록 안의 옵션을 클릭한 경우는 containerRef.current.contains(e.target)가 true라 여기서 안 닫히고,
      // 실제 닫힘은 select() 안에서 setIsOpen(false)로 처리됨
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    // 문서 전체에 클릭 이벤트를 걸어두고, 컴포넌트가 사라질 때 정리(clean-up)
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []); // 마운트 시 한 번만 등록

  // 트리거 버튼 클릭 시 열림/닫힘을 반전시키는 함수 - renderTrigger에 그대로 전달됨
  const toggle = () => setIsOpen((prev) => !prev);

  // 옵션을 하나 선택했을 때 실행되는 함수
  // 1) 부모에게 선택된 값 전달 2) 메뉴 닫기 - 이 두 가지를 항상 같이 처리
  const select = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // 현재 value에 해당하는 label을 options에서 찾아서 트리거에 보여줄 텍스트로 사용
  // 매칭되는 옵션이 없으면(예: 아직 아무것도 선택 안 함) 빈 문자열로 대체
  const selectedLabel = options.find((opt) => opt.value === value)?.label ?? '';

  return (
    <div className="relative" ref={containerRef}>
      {/* 닫힌 상태에서 보이는 버튼 - 실제 모양은 각 페이지가 renderTrigger로 넘겨줌 */}
      {renderTrigger({ selectedLabel, isOpen, toggle })}

      {/* isOpen이 true일 때만 옵션 목록을 렌더링 (닫혀있으면 DOM에 아예 없음) */}
      {isOpen && (
        <ul className={`absolute left-0 right-0 top-full mt-1 z-30 ${listClassName}`}>
          {/* options 배열을 순회하며 각 옵션을 렌더링 */}
          {options.map((opt) => (
            <li key={opt.value}>
              {/*
                renderOption에 세 가지를 넘겨줌:
                - option: 지금 그릴 옵션 데이터 ({ value, label })
                - isSelected: 이 옵션이 현재 선택된 값과 같은지 여부 (하이라이트 표시용)
                - select: 이 옵션을 클릭했을 때 호출할 함수 (내부적으로 select(opt.value) 실행)
              */}
              {renderOption({
                option: opt,
                isSelected: opt.value === value,
                select: () => select(opt.value),
              })}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}