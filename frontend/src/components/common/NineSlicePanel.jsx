// src/components/common/NineSlicePanel.jsx
import { NINE_SLICE } from "../../constansts/nineSlice";

// 임시 테두리(이미지 없을 때)의 두께. 실제 프레임이 들어오면 사용되지 않는다.
const FALLBACK_BORDER = 4;

/**
 * 나인슬라이스 프레임으로 감싸주는 박스
 *
 * - variant: constants/nineSlice.js 의 키 ("card" | "panel")
 * - 이미지(src)가 null이면 CSS 픽셀 테두리로 대신 그린다 → 이미지 나오기 전에도 화면 확인 가능
 * - 이미지가 들어와도 "내용물이 놓이는 위치"는 같도록 padding을 맞춰둠
 *   (그래서 이미지를 교체해도 레이아웃이 안 밀린다)
 *
 * 구현 방식: CSS border-image (이미지 9분할은 브라우저가 해준다.
 * Capacitor WebView(Chromium)에서도 그대로 동작)
 */
export default function NineSlicePanel({
  variant = "panel",
  className = "",
  style,
  children,
}) {
  const cfg = NINE_SLICE[variant] ?? NINE_SLICE.panel;

  // 화면에 실제로 그려질 테두리 두께 = 원본 모서리 크기 × 확대 배율
  const borderPx = cfg.slice * cfg.scale;

  // ── 이미지가 아직 없을 때: CSS 임시 테두리 ──
  if (!cfg.src) {
    return (
      <div
        className={className}
        style={{
          boxSizing: "border-box",
          // 카드는 카드 배경, 섹션은 기본 배경 / 테두리·그림자는 각각 변수
          background: variant === "card" ? "var(--stat-cardBg)" : "var(--stat-bg)",
          border: `${FALLBACK_BORDER}px solid var(--stat-line)`,
          boxShadow: "3px 3px 0 var(--stat-shadow)",
          // 실제 프레임(borderPx)과 내용 위치를 맞추려고 두께 차이만큼 padding으로 보정
          padding: borderPx - FALLBACK_BORDER + cfg.padding,
          ...style,
        }}
      >
        {children}
      </div>
    );
  }

  // ── 이미지가 있을 때: 나인슬라이스 ──
  return (
    <div
      className={className}
      style={{
        boxSizing: "border-box",
        borderStyle: "solid",
        borderWidth: borderPx, // 테두리 두께 (border-image-width 기본값으로도 쓰인다)
        borderImageSource: `url(${cfg.src})`,
        // 숫자는 "원본 이미지의 px". fill = 가운데 영역도 배경으로 채움
        borderImageSlice: `${cfg.slice} fill`,
        // stretch: 변/가운데를 늘려서 채움 (타일이 어긋나 보이는 것 방지)
        borderImageRepeat: "stretch",
        // 확대해도 픽셀아트가 흐려지지 않게
        imageRendering: "pixelated",
        padding: cfg.padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
