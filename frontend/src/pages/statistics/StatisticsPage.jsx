// src/pages/StatisticsPage.jsx
import { useState, useMemo } from "react";
import { useDecoItems } from "../../hooks/queries/useDecoItems";
import NineSlicePanel from "../../components/common/NineSlicePanel"
import { useStatistics } from "../../hooks/queries/useStatisticsQueries";
import { useTheme } from "../../stores/useThemeStore";
import { getThemeColors } from "../../constansts/themeColors";
import { getAssetUrl } from "../../utils/AssetHelper";

// 감정 정의 — 순서는 항상 행복→평온→피로→우울→화남 (API의 key와 동일)
// emoji는 임시값. 나중에 스티커/픽셀 아이콘 이미지로 바꾸려면 여기만 수정
// ⚠️ 이미 프로젝트에 감정 상수 파일이 있으면 그걸 import해서 쓰는 쪽이 좋음
const EMOTIONS = [
  { key: "happy", label: "행복", emoji: "😊", color: "var(--stat-happy)" },
  { key: "calm", label: "평온", emoji: "😌", color: "var(--stat-calm)" },
  { key: "tired", label: "피로", emoji: "😴", color: "var(--stat-tired)" },
  { key: "sad", label: "우울", emoji: "😢", color: "var(--stat-sad)" },
  { key: "angry", label: "화남", emoji: "😠", color: "var(--stat-angry)" },
];
const EMOTION_MAP = Object.fromEntries(EMOTIONS.map((e) => [e.key, e]));

// ── 감정 아이콘 이미지 선택 ──
// 이모지 아이템 이름 규칙: "{테마}_emoji_{감정}" (EmotionSelectDialog와 동일)
const EMOJI_NAME_REGEX = /^(.+)_emoji_(.+)$/;
const DEFAULT_EMOJI_THEME = "default"; // 기본 이모지 item_name 접두사 (EmotionSelectDialog의 DEFAULT_THEME과 같게)

// 앱 테마 → 이모지 접두사: 'winter_light' → 'winter', 오타 'defalut_light' → 'default'
// 이모지 아이템 접두사가 앱 테마 이름과 다르면(예: bear) 여기서 매핑해야 함
function getEmojiThemeKey(appTheme) {
  const key = appTheme.replace(/_light$/, "");
  return key === "defalut" ? DEFAULT_EMOJI_THEME : key;
}

// 감정별 이미지 URL 만들기: 현재 테마 이모지를 보유 중이면 그걸, 아니면 기본 이모지, 그것도 없으면 null
function buildEmotionIcons(decoData, appTheme) {
  const owned = new Set(decoData?.ownedIds ?? []);

  // theme → emotion → item 으로 정리
  const byTheme = {};
  (decoData?.emojis ?? []).forEach((item) => {
    const m = EMOJI_NAME_REGEX.exec(item.item_name ?? "");
    if (!m) return;
    (byTheme[m[1]] ??= {})[m[2]] = item;
  });

  const themeKey = getEmojiThemeKey(appTheme);
  const icons = {};
  EMOTIONS.forEach(({ key }) => {
    const themed = byTheme[themeKey]?.[key];
    const fallback = byTheme[DEFAULT_EMOJI_THEME]?.[key];
    // 미보유 테마 이모지는 쓰지 않고 기본 이모지로 대체 (기본 이모지는 보유 확인 생략)
    const picked = themed && owned.has(themed.item_id) ? themed : fallback;
    icons[key] = picked?.item_image_url ?? null;
  });
  return icons;
}

// 이미지가 있으면 이미지, 아직 못 불러왔거나 없으면 임시 이모지(글자)로 표시
function EmotionIcon({ emotionKey, icons, size = 20 }) {
  const src = icons[emotionKey];
  if (!src) return <span>{EMOTION_MAP[emotionKey].emoji}</span>;
  return (
    <img
      src={src}
      alt={EMOTION_MAP[emotionKey].label}
      className="inline-block object-contain [image-rendering:pixelated]"
      style={{ width: size, height: size }}
    />
  );
}

// API의 weekday_counts 순서(월=0 ~ 일=6)와 동일해야 한다
const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

const INK = "var(--stat-ink)";

/* ───────────────────────── 작은 공용 조각들 ───────────────────────── */

// 섹션 박스: 나인슬라이스 panel + 제목
function Section({ title, children }) {
  return (
    <NineSlicePanel variant="panel" className="mb-4">
      <h2 className="mb-3 text-base font-bold" style={{ color: INK }}>
        {title}
      </h2>
      {children}
    </NineSlicePanel>
  );
}

// 요약 카드 한 칸
function SummaryCard({ label, value, unit }) {
  return (
    <NineSlicePanel variant="card">
      <div className="opacity-70 text-base">{label}</div>
      <div className="mt-1 text-base font-bold" style={{ color: INK }}>
        {value}
        <span className="ml-1 text-xs font-normal">{unit}</span>
      </div>
    </NineSlicePanel>
  );
}

// 세로 막대 차트 (월별 작성 횟수 / 요일별 작성 패턴에 같이 사용)
// items: [{ label: "1월", value: 3 }, ...]
function BarChart({ items }) {
  const BAR_AREA = 100; // 막대가 그려지는 영역 높이(px)
  // 가장 큰 값을 100% 기준으로 삼는다 (전부 0이면 0으로 나누지 않게 최소 1)
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="flex gap-1">
      {items.map((item) => {
        // % 높이 대신 px로 직접 계산 — Capacitor WebView에서 % 높이/aspectRatio가
        // 불안정한 경우가 있어서 가장 안전한 방식으로 처리
        const h = item.value === 0 ? 0 : Math.max(4, Math.round((item.value / max) * BAR_AREA));
        return (
          <div key={item.label} className="flex flex-1 flex-col items-center">
            <span className="h-4 text-xs">{item.value || ""}</span>
            <div className="flex items-end" style={{ height: BAR_AREA }}>
              <div style={{ width: 14, height: h, background: "var(--stat-bar)" }} />
            </div>
            <span className="mt-1 text-xs">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────── 기간 선택 (연/월 토글 + 이전/다음) ───────────────────────── */

function PeriodControls({ viewType, onChangeViewType, year, month, onPrev, onNext, canNext }) {
  const tabStyle = (active) => ({
    padding: "3px 20px",
    border: "2px solid var(--stat-line)",
    background: active ? "var(--stat-tabActive)" : "var(--stat-tabInactive)",
    color: active ? "var(--stat-tabActiveText)" : "var(--stat-tabInactiveText)",
    fontWeight: 700,
  });

  return (
    <div className="mb-4">
      {/* 연/월 토글 */}
      <div className="mb-3 flex justify-center gap-2">
        <button type="button" style={tabStyle(viewType === "month")} onClick={() => onChangeViewType("month")}>
          월
        </button>
        <button type="button" style={tabStyle(viewType === "year")} onClick={() => onChangeViewType("year")}>
          연
        </button>
      </div>

      {/* 이전 / 현재 기간 / 다음 */}
      <div className="flex items-center justify-between px-2" style={{ color: INK }}>
        <button type="button" onClick={onPrev} className="px-3 py-1 text-2xl" aria-label="이전">
          ⟪
        </button>
        <span className="text-2xl font-bold">{viewType === "month" ? `${year}년 ${month}월` : `${year}년`}</span>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="px-3 py-1 text-2xl disabled:opacity-30" // 미래 기간은 이동 불가
          aria-label="다음"
        >
          ⟫
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── 메인 페이지 ───────────────────────── */

export default function StatisticsPage() {
  // 현재 앱 테마에 맞는 색 가져오기 (없는 테마면 기본색)
  const currentTheme = useTheme((state) => state.currentTheme);
  // 기본값 + 테마 덮어쓰기
  const themeColors = getThemeColors(currentTheme);
  // 추가: { ink: '#..' } → { '--stat-ink': '#..' } 로 변환해서 CSS 변수로 내려보냄
  const themeVars = Object.fromEntries(Object.entries(themeColors).map(([k, v]) => [`--stat-${k}`, v]));

  const { data: decoData } = useDecoItems();
  const emotionIcons = useMemo(() => buildEmotionIcons(decoData, currentTheme), [decoData, currentTheme]);

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;

  const [viewType, setViewType] = useState("month"); // "month" | "year"
  const [year, setYear] = useState(nowYear);
  const [month, setMonth] = useState(nowMonth);

  // 연 단위일 땐 month를 null로 보내서 서버가 연 단위 응답을 주게 한다
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useStatistics({
    year,
    month: viewType === "month" ? month : null,
  });

  /* 이전/다음 이동 */
  const handlePrev = () => {
    if (viewType === "year") return setYear((y) => y - 1);
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const handleNext = () => {
    if (viewType === "year") return setYear((y) => y + 1);
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };
  // 미래로는 못 넘어가게: 현재 기간보다 작을 때만 "다음" 활성화
  const canNext = viewType === "year" ? year < nowYear : year < nowYear || (year === nowYear && month < nowMonth);

  // 연/월 전환 시 이동 기준을 현재로 되돌리지 않고, 보고 있던 year는 유지한다
  const handleChangeViewType = (type) => setViewType(type);

  /* 로딩 / 에러 (데이터가 아예 없을 때만 전체 화면 처리) */
  if (isPending) {
    return <div className="w-full h-full pt-[60px] px-5 overflow-y-auto  bg-[length:100%_100%]"
      style={{
        ...themeVars,
        color: INK,
        backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})`,
        // 하단 네비 바에 가려지지 않게 하는 여백은 그대로 유지
        paddingBottom: "calc(96px + env(safe-area-inset-bottom))",
      }}>
      <div className="flex justify-center mt-[50%] text-3xl text-[#4A4A4A] font-bold animate-bounce"

      >
        불러오는 중...
      </div>
    </div>

  }
  if (isError) {
    return (
      <div className="w-full h-full pt-[60px] px-5 overflow-y-auto bg-[length:100%_100%]"
        style={{
          ...themeVars,
          color: INK,
          backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})`,
          // 하단 네비 바에 가려지지 않게 하는 여백은 그대로 유지
          paddingBottom: "calc(96px + env(safe-area-inset-bottom))",
        }}>
        <div className="text-center">
          <p className="mb-3">{error.response?.data?.message ?? error.message}</p>
          <div className="flex justify-center mt-[50%] text-3xl text-[#4A4A4A] font-bold animate-bounce"

          >
            다시 시도 중
          </div>
        </div>
      </div>

    );
  }

  const { summary, emotion, weekday_counts, monthly_counts, monthly_emotions, write_rate } = data;

  // ! 화면 분기는 viewType(버튼 상태)이 아니라 "서버가 준 period.type" 기준으로 한다.
  //    토글 직후엔 이전 데이터(placeholder)가 잠깐 남아있어서, viewType으로 분기하면
  //    monthly_counts가 null인 채로 접근해 에러가 날 수 있다.
  const isYearData = data.period.type === "year";

  return (
    <div
      className="w-full h-full pt-[60px] px-5 overflow-y-auto no-scrollbar bg-[length:100%_100%]"
      style={{
        ...themeVars,
        color: INK,
        backgroundImage: `url(${getAssetUrl(currentTheme, 'backgrounds', 'menu_background_x3')})`,
        // 하단 네비 바에 가려지지 않게 하는 여백은 그대로 유지
        paddingBottom: "calc(96px + env(safe-area-inset-bottom))",
      }}
    >

      {/* 1. 요약 카드 (기간과 무관한 전체 기록) */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {/* 1행: 일기 (총 / 현재 연속 / 최장 연속) */}
        <SummaryCard label="총 일기" value={summary.diary_total} unit="편" />
        <SummaryCard label="현재 연속 작성" value={summary.diary_streak_current} unit="일" />
        <SummaryCard label="최장 연속 작성" value={summary.diary_streak_longest} unit="일" />
        {/* 2행: 출석 (총 / 현재 연속 / 최장 연속) */}
        <SummaryCard label="총 출석" value={summary.attendance_total} unit="일" />
        <SummaryCard label="현재 연속 출석" value={summary.attendance_streak_current} unit="일" />
        <SummaryCard label="최장 연속 출석" value={summary.attendance_streak_longest} unit="일" />
      </div>

      {/* 2. 기간 선택 */}
      <PeriodControls
        viewType={viewType}
        onChangeViewType={handleChangeViewType}
        year={year}
        month={month}
        onPrev={handlePrev}
        onNext={handleNext}
        canNext={canNext}
      />

      {/* 새 데이터를 불러오는 동안(이전 데이터 표시 중)에는 살짝 흐리게 */}
      <div style={{ opacity: isPlaceholderData ? 0.5 : 1, transition: "opacity .15s" }}>
        {/* 3. 감정 분포 */}
        <Section title="감정 분포">
          {emotion.total === 0 ? (
            <p className="text-sm opacity-70">이 기간엔 감정 기록이 없어요.</p>
          ) : (
            <>
              {/* 가장 많았던 감정 */}
              <p className="text-sm">
                가장 많았던 감정{" "}
                <b className="inline-flex items-center align-middle">
                  <EmotionIcon emotionKey={emotion.top_emotion} icons={emotionIcons} size={60} />
                  {EMOTION_MAP[emotion.top_emotion].label}
                </b>
              </p>

              {/* 비율 막대: 감정별 개수를 flex 비율로 그대로 사용 */}
              <div className="flex h-5 overflow-hidden" style={{ border: "2px solid var(--stat-line)" }}>
                {EMOTIONS.map((e) =>
                  emotion.counts[e.key] > 0 ? (
                    <div key={e.key} style={{ flex: emotion.counts[e.key], background: e.color }} />
                  ) : null
                )}
              </div>

              {/* 범례: 개수 + 퍼센트 */}
              <ul className="text-base">
                {EMOTIONS.map((e) => {
                  const count = emotion.counts[e.key];
                  const percent = Math.round((count / emotion.total) * 100);
                  return (
                    <li key={e.key} className="flex items-center ">
                      <span className="inline-block h-6 w-6" style={{ background: e.color }} />
                      <span className="flex items-center">
                        <EmotionIcon emotionKey={e.key} icons={emotionIcons} size={60} />
                        {e.label}
                      </span>
                      <span className="ml-auto">
                        {count}회 ({percent}%)
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Section>

        {/* 4-A. 월 단위 전용: 작성률 */}
        {!isYearData && write_rate && (
          <Section title="이번 달 작성률">
            {(() => {
              // 경과 일수가 0(미래 달)이면 0%로 처리해서 0으로 나누는 걸 방지
              const percent =
                write_rate.elapsed_days > 0 ? Math.round((write_rate.written_days / write_rate.elapsed_days) * 100) : 0;
              return (
                <>
                  <p className="mb-2 text-sm">
                    {write_rate.elapsed_days}일 중 {write_rate.written_days}일 작성 ({percent}%)
                  </p>
                  {/*  테두리 = line, 빈 부분 = track, 채움 = bar */}
                  <div className="h-4" style={{ border: "2px solid var(--stat-line)", background: "var(--stat-track)" }}>
                    <div className="h-full" style={{ width: `${percent}%`, background: "var(--stat-bar)" }} />
                  </div>
                </>
              );
            })()}
          </Section>
        )}

        {/* 4-B. 연 단위 전용: 월별 작성 횟수 + 월별 감정 추이 */}
        {isYearData && monthly_counts && (
          <Section title="월별 작성 횟수">
            <BarChart items={monthly_counts.map((value, i) => ({ label: `${i + 1}월`, value }))} />
          </Section>
        )}

        {isYearData && monthly_emotions && (
          <Section title="월별 감정 추이">
            <MonthlyEmotionStack monthlyEmotions={monthly_emotions} />
          </Section>
        )}

        {/* 5. 요일별 작성 패턴 (연/월 공통) */}
        <Section title="요일별 작성 패턴">
          <BarChart items={weekday_counts.map((value, i) => ({ label: WEEKDAY_LABELS[i], value }))} />
        </Section>
      </div>

      {/* ⚠️ 개발 확인용: API 응답 원본 보기. 확인이 끝나면 이 블록을 통째로 삭제하세요. */}
      <details className="mt-4 text-xs">
        <summary>API 응답 보기 (개발용)</summary>
        <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
  );
}

/* ───────────────────────── 월별 감정 추이 (스택 바) ───────────────────────── */

// 12개월 각각을 "감정별로 쌓인 세로 막대"로 보여준다.
// monthlyEmotions: [{ happy: 3, calm: 1, ... } x 12]
function MonthlyEmotionStack({ monthlyEmotions }) {
  const BAR_AREA = 100;
  const totals = monthlyEmotions.map((m) => EMOTIONS.reduce((sum, e) => sum + m[e.key], 0));
  const max = Math.max(...totals, 1);

  return (
    <>
      <div className="flex gap-1">
        {monthlyEmotions.map((m, i) => {
          const total = totals[i];
          const h = total === 0 ? 0 : Math.max(4, Math.round((total / max) * BAR_AREA));
          return (
            <div key={i} className="flex flex-1 flex-col items-center">
              <div className="flex items-end" style={{ height: BAR_AREA }}>
                {/* column-reverse: 첫 감정(행복)이 맨 아래부터 쌓인다.
                    각 조각의 flex 값 = 그 감정의 개수 → 높이가 자동으로 비율대로 나뉜다 */}
                <div className="flex flex-col-reverse" style={{ width: 14, height: h }}>
                  {EMOTIONS.map((e) =>
                    m[e.key] > 0 ? <div key={e.key} style={{ flex: m[e.key], background: e.color }} /> : null
                  )}
                </div>
              </div>
              <span className="mt-1 text-[10px]">{i + 1}</span>
            </div>
          );
        })}
      </div>

      {/* 색상 범례 */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {EMOTIONS.map((e) => (
          <span key={e.key} className="flex items-center gap-1">
            <span className="inline-block h-3 w-3" style={{ background: e.color }} />
            {e.label}
          </span>
        ))}
      </div>
    </>
  );
}
