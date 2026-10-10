import { MAPS } from "../manage/MapConfig";
import { showToast } from "./Toast";
import { PIXEL, drawBackground, createPixelBox, createPixelButton, createTopBar } from "./PixelUI";

// =====================================================
// 모드 선택 화면의 버튼들을 만드는 파일 (와이어프레임 3번)
// 왼쪽: 데일리 모드(크게) / 오른쪽 위: 하드 모드 / 오른쪽 아래: 캐릭터 변경 + 설정
// =====================================================

const HARD_LABEL = "무한 모드";   // 무한 모드 버튼에 보일 이름 (와이어프레임 기준)
const GAP = 16;                   // 버튼 사이 간격

// 데일리 카드에 깔리는 밤→새벽→아침 색띠 [색, 끝 비율]
// (그라데이션이 아니라 딱 끊어서 픽셀아트의 "띠" 느낌을 냄)
const DUSK_BANDS = [
  [0x232a5c, 0.28],
  [0x3a3f8f, 0.54],
  [0x7a5fb0, 0.78],
  [0xff8fa3, 1]
];

// 데일리 카드에 넣을 이미지 (public 폴더 기준 경로. 실제 파일 위치에 맞게 바꾸세요)
const DAILY_CARD_KEY = "daily_card";
const DAILY_CARD_PATH = "/assets/game2/ui/daily_card.png";

// 이미지에서 색을 못 뽑았을 때 쓸 기본 띠 색
const DAILY_BAR_FALLBACK = 0x120e33;


// 데일리 카드 이미지의 위아래 검은 띠 (영화 화면처럼). 0이면 띠 없음
const DAILY_BAR_RATIO = 0.14;   // 카드 안쪽 높이의 몇 %를 위/아래 띠 하나로 쓸지 (0.14 = 14%)

// 이 화면에서 쓰는 이미지를 불러온다 (ModeSelectScene의 preload에서 호출)
export function loadModeSelectAssets(scene) {
  if (!scene.textures.exists(DAILY_CARD_KEY)) {
    scene.load.image(DAILY_CARD_KEY, DAILY_CARD_PATH);
  }
}

export function createModeSelectUI(scene) {

  const { width, height } = scene.scale;

  drawBackground(scene);

  // 제목 글자 크기: 화면 높이에 맞춰 22~32px 사이 (키우려면 숫자를 올리세요)
  const titleFont = Math.max(22, Math.min(32, height * 0.075));

  // ---------- 상단바: 뒤로가기(미니게임 허브로) + 제목 ----------
  const { margin, top } = createTopBar(scene, "오늘의 발자국", () => {
      window.dispatchEvent(new CustomEvent("exitToMinigameHub"));
  }, titleFont);



  // =========================
  // 화면 크기에 맞춘 값 계산
  // =========================

  const areaW = Math.min(width - margin * 2, 920);   // 태블릿처럼 넓은 화면에서는 가운데로 모음
  const areaH = height - top - margin;
  const left = Math.round((width - areaW) / 2);

  // 왼쪽(데일리) : 오른쪽 = 1.15 : 1
  const leftW = Math.floor((areaW - GAP) * 1.15 / 2.15);
  const rightW = areaW - GAP - leftW;
  const rightX = left + leftW + GAP;

  // 오른쪽 위(하드) : 오른쪽 아래(캐릭터 변경+설정) = 1.1 : 1
  const hardH = Math.floor((areaH - GAP) * 1.1 / 2.1);
  const menuH = areaH - GAP - hardH;

  // 아래 줄: 캐릭터 변경 : 설정 = 1.3 : 1
  const charW = Math.floor((rightW - GAP) * 1.3 / 2.3);
  const settingsW = rightW - GAP - charW;

  // 글자 크기
  const modeFont = Math.max(16, Math.min(24, height * 0.06));
  const menuFont = Math.max(14, Math.min(20, height * 0.05));


  // =========================
  // 데일리 모드
  // 오늘 일기를 쓴 경우에만 시작할 수 있고,
  // 일기에 쓴 감정의 맵으로 시작합니다.
  // =========================

  createDailyCard(scene, left + leftW / 2, top + areaH / 2, leftW, areaH, modeFont);


  // =========================
  // 하드(무한) 모드
  // =========================

    createPixelButton(scene, {
    x: rightX + rightW / 2,
    y: top + hardH / 2,
    w: rightW,
    h: hardH,
    label: HARD_LABEL,
    fill: PIXEL.dawn,
    fontSize: modeFont,
    outline: true,                 
    onClick: () => startHard(scene)
  });


  // =========================
  // 캐릭터 변경 / 설정
  // =========================

    const menuY = top + hardH + GAP + menuH / 2;

    createPixelButton(scene, {
    x: rightX + charW / 2,
    y: menuY,
    w: charW,
    h: menuH,
    label: "캐릭터 변경",
    fontSize: menuFont,
    outline: true,                 
    onClick: () => scene.scene.start("CharacterSelectScene")
  });

  createPixelButton(scene, {
    x: rightX + charW + GAP + settingsW / 2,
    y: menuY,
    w: settingsW,
    h: menuH,
    label: "설정",
    fontSize: menuFont,
    outline: true,                 
    onClick: () => scene.scene.start("SettingsScene")
  });
}


// =========================
// 데일리 카드: 이미지(없으면 색띠) 배경 + 위쪽 가운데 이름표
// =========================

function createDailyCard(scene, x, y, w, h, fontSize) {

  const card = createPixelBox(scene, {
    x, y, w, h,
    onClick: () => startDaily(scene)
  });

  // 카드 크기 (짝수로 맞춘 값)와 테두리 안쪽 영역. 좌표는 카드 가운데가 (0, 0)
  const boxW = Math.round(w / 2) * 2;
  const boxH = Math.round(h / 2) * 2;
  const innerW = boxW - 8;
  const innerH = boxH - 8;

  // 이미지가 있으면 이미지, 없으면 색띠
  if (scene.textures.exists(DAILY_CARD_KEY)) {
    addCardImage(scene, card, innerW, innerH);
  } else {
    addDuskBands(scene, card, innerW, innerH);
  }

  // 이름표: 박스 없이 글자만 (이미지 위에서도 읽히도록 어두운 외곽선을 둘렀어요)
  const label = scene.add.text(0, 0, "데일리 모드", {
    fontFamily: PIXEL.font,
    fontSize: `${fontSize}px`,
    color: PIXEL.paperText
  }).setOrigin(0.5);

  label.setStroke(PIXEL.inkText, Math.max(4, Math.round(fontSize * 0.25)));  //  버튼 글자와 같은 비율

  // 위쪽 안쪽에서 12px 아래, 가운데
  label.setPosition(0, -innerH / 2 + 12 + label.height / 2);

  card.add(label);
}


// 카드 안쪽에 이미지를 넣는다 (영화처럼 위아래에 검은 띠)
function addCardImage(scene, card, innerW, innerH) {

  const src = scene.textures.get(DAILY_CARD_KEY).getSourceImage();

  const barH = Math.round(innerH * DAILY_BAR_RATIO);
  const winH = Math.max(1, innerH - barH * 2);
  const scale = Math.max(innerW / src.width, winH / src.height);

  const image = scene.add.image(0, 0, DAILY_CARD_KEY).setScale(scale);

  const visW = Math.min(src.width, innerW / scale);
  const visH = Math.min(src.height, winH / scale);

  image.setCrop((src.width - visW) / 2, (src.height - visH) / 2, visW, visH);

  card.add(image);

  // ▼▼▼ 추가: 카드 안쪽 영역을 벗어나는 부분은 절대 안 보이게 마스킹 ▼▼▼
  const maskShape = scene.make.graphics({ x: 0, y: 0, add: false });
  maskShape.fillStyle(0xffffff);

  // card는 컨테이너라서 월드 좌표로 그려야 함
  const worldX = card.x - innerW / 2;
  const worldY = card.y - innerH / 2;
  maskShape.fillRect(worldX, worldY, innerW, innerH);

  const mask = maskShape.createGeometryMask();
  image.setMask(mask);

  // 마스크 그래픽은 화면에 안 보이게 처리하되, card가 사라질 때 같이 정리
  card.once("destroy", () => {
    mask.destroy();
    maskShape.destroy();
  });
}


// 이미지가 없을 때 깔리는 색띠
function addDuskBands(scene, card, innerW, innerH) {

  let from = 0;

  DUSK_BANDS.forEach(([color, to]) => {
    const y0 = Math.round(innerH * from);
    const y1 = Math.round(innerH * to);

    card.add(scene.add.rectangle(-innerW / 2, -innerH / 2 + y0, innerW, y1 - y0, color).setOrigin(0));
    from = to;
  });
}


// =========================
// 데일리 모드 시작
// =========================

function startDaily(scene) {

  // Game2.jsx에서 넣어둔 일기 정보 꺼내기
  const info = scene.registry.get("diaryInfo");

  // 오늘 쓴 일기가 없으면 안내만 하고 끝
  if (!info?.todayEmotion) {
    showToast(scene, "오늘 일기를 먼저 작성해 주세요");
    return;
  }

  // 그 감정의 맵이 아직 없으면 안내만 하고 끝
  if (!MAPS[info.todayEmotion]) {
    showToast(scene, "아직 준비 중인 맵이에요");
    return;
  }

  // 게임 시작 (모드와 감정을 함께 넘김)
  scene.scene.start("GameScene", {
    gameMode: "daily",
    emotion: info.todayEmotion
  });
}


// =========================
// 하드(무한) 모드: 맵 선택 화면으로
// 열린 맵이 하나라도 있어야 들어갈 수 있습니다.
// =========================

function startHard(scene) {

  const info = scene.registry.get("diaryInfo");

  if (!info || info.unlockedEmotions.length === 0) {
    showToast(scene, "일기를 써서 맵을 먼저 열어 주세요");
    return;
  }

  scene.scene.start("InfinityMenuScene");
}