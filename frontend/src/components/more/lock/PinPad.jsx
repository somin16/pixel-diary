// components/more/lock/PinPad.jsx
// PIN 점 표시 + 숫자 키패드 컴포넌트
// LockScreen(잠금 해제)과 Lock.jsx(PIN 설정/변경)가 공유해서 씀
import { useTheme } from '../../../stores/useThemeStore';
import { getAssetUrl } from '../../../utils/AssetHelper';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

// 버튼 자체는 크기/비활성화 상태만 담당
const KEY_CLASS = 'relative h-16 w-16 disabled:opacity-40 disabled:pointer-events-none';
// 숫자/아이콘 라벨 스타일
const KEY_LABEL_CLASS =
  'pointer-events-none relative z-10 flex h-full w-full items-center justify-center font-mono text-xl font-bold text-neutral-900';

// disabled가 true면 쿨다운 중이라는 뜻 (모든 키 입력을 막음)
// extraKey: 숫자 9와 0 사이 빈 칸에 끼워 넣을 커스텀 버튼 (지금은 안 씀, 자리만 비워둠)
export function PinPad({ length, value, onDigit, onDelete, error, extraKey, disabled = false }) {
  const currentTheme = useTheme((state) => state.currentTheme);
  const boxUrl = getAssetUrl(currentTheme, 'boxes', 'profile_image_box_x3'); // 숫자 키패드용 박스
  const dotsBoxUrl = getAssetUrl(currentTheme, 'boxes', 'alarm_all_list_box_x3'); // PIN 점 표시줄 배경
  const stampUrl = getAssetUrl(currentTheme, 'icons', 'daily_check_stamp_icon_x3'); // 채워진 자리에 찍는 스탬프

  return (
    <div className="flex flex-col items-center gap-6">
      {/* PIN 입력 진행 상태 표시줄 - 가로로 긴 박스 이미지 위에 자리마다 점을 겹쳐서 그림 */}
      <div className="relative inline-flex items-center justify-center">
        <img src={dotsBoxUrl} alt="" className="block [image-rendering:pixelated]" />
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-6">
          {Array.from({ length }).map((_, i) =>
            // 이미 입력된 자리는 스탬프 이미지로, 아직 안 채워진 자리는 빈 원으로 표시
            i < value.length ? (
              <img
                key={i}
                src={stampUrl}
                alt=""
                className="h-9 w-9 [image-rendering:pixelated]"
              />
            ) : (
              <span key={i} className="h-3 w-3 rounded-full border-2 border-neutral-600" />
            )
          )}
        </div>
      </div>

      {/* 숫자 키패드 - 3열 그리드로 1~9, (빈 칸/extraKey), 0, 삭제 순으로 배치 */}
      <div className="grid grid-cols-3 gap-6">
        {DIGITS.map((d) => (
          <button key={d} type="button" disabled={disabled} onClick={() => onDigit(d)} className={KEY_CLASS}>
            <img src={boxUrl} alt="" className="absolute inset-0 h-full w-full [image-rendering:pixelated]" />
            <span className={KEY_LABEL_CLASS}>{d}</span>
          </button>
        ))}

        {/* extraKey가 없으면 그냥 빈 칸으로 남겨서 그리드 정렬 유지 */}
        {extraKey ?? <span aria-hidden="true" />}

        <button type="button" disabled={disabled} onClick={() => onDigit('0')} className={KEY_CLASS}>
          <img src={boxUrl} alt="" className="absolute inset-0 h-full w-full [image-rendering:pixelated]" />
          <span className={KEY_LABEL_CLASS}>0</span>
        </button>

        {/* 마지막 한 글자 지우기 버튼 */}
        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          aria-label="한 글자 지우기"
          className={KEY_CLASS}
        >
          <img src={boxUrl} alt="" className="absolute inset-0 h-full w-full [image-rendering:pixelated]" />
          <span className={`${KEY_LABEL_CLASS} text-xl`}>↵</span>
        </button>
      </div>
    </div>
  );
}