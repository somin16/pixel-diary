// src/pages/minigame/MinigameHub.jsx
//
// ─────────────────────────────────────────────────────────────
// 미니게임 선택 화면 + 미니게임2 시작 화면 (와이어프레임 1~3번)
//
//
// [사용 예]
//   <MinigameHub
//     onExit={() => navigate('/diary')}                 // 다이어리로 돌아가기
//     onStartGame={(gameId, mode) => navigate(...)}     // 실제 게임 화면으로 이동
//     onChangeCharacter={() => navigate('/character')}  // 선택 사항
//     onOpenSettings={() => navigate('/settings')}      // 선택 사항
//   />
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

// ── 색상 (한 곳에서 관리하려고 상수로 뺌) ──────────────────────
// ink   : 글자·테두리 / paper : 패널 배경 / sun : 주요 버튼
// mint  : 데일리 모드 / dawn : 하드 모드 / 배경은 아래 SKY (밤→새벽 느낌의 계단식 색띠)
const INK = '#231C4B';
const SKY =
  'linear-gradient(to bottom, #232A5C 0 30%, #2F3577 30% 55%, #4A4497 55% 78%, #6B55A8 78% 100%)';

// ── 공통 픽셀 스타일 ─────────────────────────────────────────
// 블러 없는 딱딱한 그림자 + 굵은 테두리 = 픽셀 느낌.
// 누르면 2px 내려가면서 그림자가 줄어들어 "눌리는 버튼"처럼 보임 (사용자 동작에 대한 반응)
const PIXEL_BOX = 'border-4 border-[#231C4B] shadow-[4px_4px_0_0_#120E33]';
const PIXEL_PRESS =
  'transition-[transform,box-shadow] duration-75 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#120E33] disabled:pointer-events-none';
// 키보드/접근성 포커스 표시 (배경이 어두워서 노란 외곽선 사용)
const FOCUS = 'focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FFC857]';

// ── 게임 목록 ────────────────────────────────────────────────
// 게임이 늘어나면 여기에 추가하면 됨. (지금 레이아웃은 2개 기준)
// thumbnail 에 이미지 경로를 넣으면 대표 이미지로 표시, 없으면 픽셀 하늘 배경이 대신 나옴
const GAMES = [
  { id: 'game1run', title: '(말랑쫀득)슬라임대소동', subtitle: '미니게임1', thumbnail: null, tone: 'mint' },
  { id: 'game2run', title: '(사뿐사뿐)오늘의 발자국', subtitle: '미니게임2', thumbnail: null, tone: 'dusk' },
];

// 계단식 색띠 팔레트 (mint: 미니게임1 임시 / dusk: 밤 → 새벽 → 아침)
const TONES = {
  mint: ['#BFF3E1', '#9BE9CE', '#7ADFC0', '#5CCDAA'],
  dusk: ['#232A5C', '#3A3F8F', '#7A5FB0', '#FF8FA3'],
};
const bandsOf = (tone) => {
  const [a, b, c, d] = TONES[tone];
  // 색 경계를 딱 끊어서(그라데이션 X) 픽셀아트의 "띠" 느낌을 냄
  return `linear-gradient(to bottom, ${a} 0 28%, ${b} 28% 54%, ${c} 54% 78%, ${d} 78% 100%)`;
};

// ═════════════════════════════════════════════════════════════
// Hooks
// ═════════════════════════════════════════════════════════════

// 화면 크기를 window.innerWidth/Height 로 직접 읽음.
// 이유: Capacitor WebView 에서는 CSS dvh 단위가 불안정해서, 가로 고정 후 높이가 틀어질 수 있음.
function useViewportSize() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [size, setSize] = useState(read);

  useEffect(() => {
    const onChange = () => setSize(read());
    window.addEventListener('resize', onChange);
    window.addEventListener('orientationchange', onChange);
    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('orientationchange', onChange);
    };
  }, []);

  return size;
}

// 이 화면에 있는 동안 가로 모드로 고정 (와이어프레임 1번 조건)
// keepLandscapeRef 가 true 면 화면을 떠날 때 세로로 되돌리지 않음.
// 이유: 게임 화면(Phaser)도 가로라서, 여기서 세로로 되돌리면 화면이 잠깐 휙 돌아가는 깜빡임이 생김.
function useLandscapeLock(keepLandscapeRef) {
  useEffect(() => {
    // 웹 브라우저(개발 중)에서는 lock 이 지원되지 않아 에러가 나므로 조용히 무시
    ScreenOrientation.lock({ orientation: 'landscape' }).catch(() => {});

    return () => {
      if (!keepLandscapeRef.current) {
        ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
      }
    };
  }, [keepLandscapeRef]);
}

// ═════════════════════════════════════════════════════════════
// 공통 부품
// ═════════════════════════════════════════════════════════════

// 픽셀 버튼 — 색(tone)만 바꿔서 여러 곳에서 재사용
const TONE_BG = {
  sun: 'bg-[#FFC857]',
  mint: 'bg-[#7ADFC0]',
  dawn: 'bg-[#FF8FA3]',
  paper: 'bg-[#F4EFFF]',
  lilac: 'bg-[#DDD3FF]',
};
function PixelButton({ tone = 'paper', className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`${PIXEL_BOX} ${PIXEL_PRESS} ${FOCUS} ${TONE_BG[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// 상단바: 왼쪽 "<" 뒤로가기 + 화면 이름
function TopBar({ title, onBack, backLabel }) {
  return (
    <div className="flex h-10 shrink-0 items-center gap-3">
      <PixelButton tone="paper" onClick={onBack} aria-label={backLabel} className="flex h-10 w-12 items-center justify-center">
        {/* 픽셀 화살표 "<" — 폰트 글리프 대신 사각형 5개로 그려서 어떤 기기에서도 똑같이 보임 */}
        <svg viewBox="0 0 6 10" width="12" height="20" shapeRendering="crispEdges" fill={INK} aria-hidden="true">
          <rect x="4" y="0" width="2" height="2" />
          <rect x="2" y="2" width="2" height="2" />
          <rect x="0" y="4" width="2" height="2" />
          <rect x="2" y="6" width="2" height="2" />
          <rect x="4" y="8" width="2" height="2" />
        </svg>
      </PixelButton>
      <h1 className="text-[18px] leading-none text-[#F4EFFF]">{title}</h1>
    </div>
  );
}

// 화면 전환용 껍데기 — 화면이 바뀔 때 살짝 페이드
function ScreenShell({ children }) {
  const reduce = useReducedMotion(); // 기기에서 "동작 줄이기"를 켰다면 애니메이션 생략
  return (
    <motion.div
      className="flex h-full flex-col gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.15 }}
    >
      {children}
    </motion.div>
  );
}

// 카드/버튼에 깔리는 계단식 색띠 배경 (+ 별 몇 개)
function PixelSky({ tone, showStars }) {
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: bandsOf(tone) }}>
      {showStars && (
        // 별 하나(4px 네모)에 box-shadow 를 여러 개 겹쳐서 별 여러 개를 표현 (DOM 을 늘리지 않으려는 트릭)
        <span
          className="absolute left-[14px] top-[10px] h-1 w-1 bg-white"
          style={{ boxShadow: '30px 16px #fff, 82px 30px #fff, 140px 8px #fff, 204px 34px #fff, 262px 14px #fff, 320px 40px #fff' }}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// 화면 1·2: 게임 선택
// ═════════════════════════════════════════════════════════════

// 게임 카드 하나. 고른 카드는 그 자리에 가만히 있고, 반대쪽 카드는 위로 올라가며 사라짐 (와이어프레임 2번)
function GameCard({ game, isSelected, onPick }) { // ✅ isRaised → isSelected
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="absolute inset-x-0 top-[14%] h-[72%]" // ✅ 위치/높이 고정 (카드 자체는 더 이상 움직이지 않음)
      initial={{ opacity: 0, y: reduce ? 0 : -24 }} // ✅ 다시 고르기로 돌아올 때 위에서 내려오며 나타남
      animate={{ opacity: 1, y: 0 }} // ✅
      exit={{ opacity: 0, y: reduce ? 0 : -40 }} // ✅ 반대쪽 카드: 위로 올라가며 사라짐
      transition={{ duration: reduce ? 0 : 0.2, ease: 'easeOut' }} // ✅
    >
      <button
        type="button"
        onClick={onPick}
        disabled={isSelected} // 이미 고른 카드는 다시 눌러도 반응 없음 (되돌리기는 "다시 고르기")
        aria-pressed={isSelected}
        className={`${PIXEL_BOX} ${PIXEL_PRESS} ${FOCUS} flex h-full w-full flex-col overflow-hidden bg-[#F4EFFF] text-left`}
      >
        <div className="min-h-0 flex-1">
          {game.thumbnail ? (
            <img src={game.thumbnail} alt="" className="h-full w-full object-cover [image-rendering:pixelated]" />
          ) : (
            <PixelSky tone={game.tone} showStars={game.tone === 'dusk'} />
          )}
        </div>
        <div className="border-t-4 border-[#231C4B] px-3 py-2">
          <p className="text-[18px] leading-tight">{game.title}</p>
          {game.subtitle && <p className="mt-0.5 text-[13px] leading-tight opacity-70">{game.subtitle}</p>}
        </div>
      </button>
    </motion.div>
  );
}

// 선택 후, "선택 안 된 카드가 있던 자리"에 나타나는 버튼 패널
function ActionPanel({ onStart, onReselect }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`${PIXEL_BOX} absolute inset-x-0 top-[14%] flex h-[72%] flex-col justify-center gap-4 bg-[#F4EFFF] p-4`}
      initial={{ opacity: 0, scale: reduce ? 1 : 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.18 }}
    >
      <PixelButton tone="sun" onClick={onStart} className="py-4 text-[20px] leading-none">
        시작하기
      </PixelButton>
      <PixelButton tone="lilac" onClick={onReselect} className="py-3 text-[17px] leading-none">
        다시 고르기
      </PixelButton>
    </motion.div>
  );
}

function SelectScreen({ selectedId, onPick, onReselect, onStart, onExit }) {
  return (
    <ScreenShell>
      <TopBar title="미니게임" onBack={onExit} backLabel="다이어리로 돌아가기" />

      {/* 두 칸짜리 판. 각 칸은 relative 로 잡아두고, 안의 카드/패널이 absolute 로 자리를 차지함 */}
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
        {GAMES.map((game) => {
          const isSelected = selectedId === game.id; // 내가 고른 칸 → 카드가 그 자리에 그대로 있음
          const showsActions = selectedId !== null && !isSelected; // ✅ 반대쪽 칸 → 카드가 위로 사라지고 패널이 나옴

          return (
            <div key={game.id} className="relative h-full">
              <AnimatePresence initial={false}>
                {showsActions ? ( // ✅ isSelected → showsActions
                  <ActionPanel key="actions" onStart={onStart} onReselect={onReselect} /> // ✅ game 전달 삭제
                ) : (
                  <GameCard key="card" game={game} isSelected={isSelected} onPick={() => onPick(game.id)} /> // ✅ isRaised → isSelected
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </ScreenShell>
  );
}

// ═════════════════════════════════════════════════════════════
// 화면 3: 미니게임2 시작 화면
// ═════════════════════════════════════════════════════════════

function Game2StartScreen({ onBack, onStartMode, onChangeCharacter, onOpenSettings }) {
  return (
    <ScreenShell>
      {/* "<" 를 누르면 게임 선택 화면으로 이동 (와이어프레임 3번 ①②) */}
      <TopBar title="감성 사이드 러너" onBack={onBack} backLabel="게임 선택 화면으로 이동" />

      {/* 왼쪽: 데일리 모드(크게) / 오른쪽: 하드 모드(위) + 캐릭터 변경·설정(아래) */}
      <div className="grid min-h-0 flex-1 grid-cols-[1.15fr_1fr] gap-4">
        {/* 데일리 모드 — 밤→아침 색띠 위에 이름표를 올림 (글자가 배경색에 묻히지 않게) */}
        <button
          type="button"
          onClick={() => onStartMode('daily')}
          className={`${PIXEL_BOX} ${PIXEL_PRESS} ${FOCUS} flex items-end p-3 text-left`}
          style={{ background: bandsOf('dusk') }}
        >
          <span className="border-4 border-[#231C4B] bg-[#F4EFFF] px-3 py-1 text-[22px] leading-tight">데일리 모드</span>
        </button>

        <div className="grid min-h-0 grid-rows-[1.1fr_1fr] gap-3">
          <PixelButton tone="dawn" onClick={() => onStartMode('hard')} className="text-[22px] leading-tight">
            하드 모드
          </PixelButton>

          <div className="grid min-h-0 grid-cols-[1.3fr_1fr] gap-3">
            <PixelButton tone="paper" onClick={onChangeCharacter} className="text-[16px] leading-tight">
              캐릭터 변경
            </PixelButton>
            <PixelButton tone="paper" onClick={onOpenSettings} className="text-[16px] leading-tight">
              설정
            </PixelButton>
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

// ═════════════════════════════════════════════════════════════
// 메인: 화면 상태 관리
// ═════════════════════════════════════════════════════════════

export default function MinigameHub() { // props 전부 삭제 (이동은 안에서 직접 처리)
  const { w, h } = useViewportSize();
  const navigate = useNavigate(); // 페이지 이동 함수

  // 선택한 게임 id. null 이면 아직 아무것도 안 고른 상태(1번), 값이 있으면 2번 상태
  const [selectedId, setSelectedId] = useState(null);
  // screen 상태, keepLandscapeRef, handleStartMode, backToSelect 는 전부 삭제

  // "시작하기" — 두 게임 모두 선택한 게임의 주소로 이동만 함
  // GAMES 의 id 가 곧 주소: game1run → /game1run, game2run → /game2run
  const handleStart = () => navigate(`/${selectedId}`); 

  return (
    <div
      className="fixed left-0 top-0 overflow-hidden"
      style={{
        width: w,
        height: h,
        boxSizing: 'border-box',
        background: SKY,
        color: INK,
        // 노치/둥근 모서리 기기에서 버튼이 잘리지 않도록 안전 영역만큼 여백 확보
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(16px, env(safe-area-inset-left))',
        paddingRight: 'max(16px, env(safe-area-inset-right))',
      }}
    >
      {/* 태블릿처럼 너무 넓은 화면에서는 가운데로 모아서 카드가 과하게 늘어나지 않게 함 */}
      <div className="mx-auto h-full max-w-[920px]">
        <SelectScreen
          selectedId={selectedId}
          onPick={setSelectedId}
          onReselect={() => setSelectedId(null)}
          onStart={handleStart}
          onExit={() => navigate(-1)} // 하단 탭 '게임'으로 들어왔으니 원래 있던 화면으로 돌아감
        />
      </div>
    </div>
  );
}
