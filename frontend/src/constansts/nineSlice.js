// src/constants/nineSlice.js
// 나인슬라이스(테두리 늘어나는 프레임) 이미지 설정 모음
//
// 이미지가 나오면 이 파일만 고치기 (컴포넌트/페이지는 수정 불필요)
//   1) 이미지를 src/assets/ui/ 에 넣고
//   2) 아래처럼 import 한 뒤
//        import cardFrame from "../assets/ui/card_frame.png";
//   3) src: cardFrame 으로 바꾸고 slice 값을 이미지에 맞게 조정
//
// - src   : 프레임 이미지. null이면 CSS로 만든 임시 픽셀 테두리가 대신 표시된다.
// - slice : 원본 이미지에서 "모서리로 쓸 크기(px)". 예) 24x24 이미지에서 모서리가 8px면 8
//           (모서리는 안 늘어나고, 가운데/변 부분만 늘어난다)
// - scale : 화면에서 모서리를 몇 배로 키울지. 픽셀아트가 뭉개지지 않게 정수(2, 3)로 쓸 것
//           → 화면에 그려지는 테두리 두께 = slice × scale
// - padding : 테두리 안쪽에서 내용물까지 추가로 띄울 여백(px)
export const NINE_SLICE = {
  // 요약 카드(작은 박스)
  card: { src: null, slice: 6, scale: 2, padding: 4 },
  // 섹션(큰 박스)
  panel: { src: null, slice: 8, scale: 2, padding: 6 },
};
