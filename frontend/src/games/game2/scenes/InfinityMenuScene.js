import Phaser from "phaser";
import { MAPS, EMOTION_LABEL } from "../manage/MapConfig";
import { showToast } from "../ui/Toast";
import { restartOnResize } from "../ui/ResizeRestart";
import { drawBackground, createTopBar, gridPositions, createLabelCard } from "../ui/PixelUI";

// =====================================================
// 무한 모드 맵 선택 화면 (와이어프레임 4번)
// 감정 5개 중 "일기를 쓴 적 있는" 감정의 맵만 고를 수 있습니다.
// =====================================================

// 화면에 보여줄 감정 순서 (행복→평온→피로→우울→화남)
const EMOTIONS = ["happy", "calm", "tired", "sad", "angry"];

const COLUMNS = 3;   // 한 줄에 카드 몇 개
const GAP = 16;      // 카드 사이 간격

// "#rrggbb" 글자 색을 숫자 색으로 바꾸기
const toColor = (hex) => Phaser.Display.Color.HexStringToColor(hex).color;

export default class InfinityMenuScene extends Phaser.Scene {

    constructor() {
        super("InfinityMenuScene");   // 이 화면의 이름표
    }

    create() {
        const { width, height } = this.scale;

        // Game2.jsx에서 넣어둔 일기 정보 꺼내기 (없으면 빈 값)
        const info = this.registry.get("diaryInfo") || { unlockedEmotions: [] };

        drawBackground(this);

        const { margin, top } = createTopBar(this, "무한 모드", () => {
            this.scene.start("ModeSelectScene");
        });

        // 카드 배치
        const areaW = Math.min(width - margin * 12, 920);
        const areaH = height - top - margin;
        const rows = Math.ceil(EMOTIONS.length / COLUMNS);
        const cardH = Math.floor((areaH - GAP * (rows - 1)) / rows);

        gridPositions({
            count: EMOTIONS.length,
            columns: COLUMNS,
            width,
            areaW,
            top,
            cardH,
            gap: GAP
        }).forEach((pos, i) => this.createMapCard(EMOTIONS[i], pos, info));

        // 화면 크기가 바뀌면 다시 그리기
        restartOnResize(this);
    }

    // 맵 카드 하나 만들기
    createMapCard(emotion, pos, info) {
        const exists = !!MAPS[emotion];                                        // 맵이 만들어져 있는가
        const unlocked = exists && info.unlockedEmotions.includes(emotion);    // 일기를 써서 열렸는가

        // 미리보기: 그 맵 1단계의 하늘색 + 아래쪽 땅색
        const stage = MAPS[emotion]?.stages[0];

        createLabelCard(this, {
            ...pos,
            label: EMOTION_LABEL[emotion],
            skyColor: toColor(stage?.sky ?? "#333333"),
            groundColor: toColor(stage?.hud.outline ?? "#222222"),
            lockedText: unlocked ? null : (exists ? "잠김" : "준비 중"),
            onClick: () => this.pickMap(emotion, exists, unlocked)
        });
    }

    // 카드를 눌렀을 때
    pickMap(emotion, exists, unlocked) {
        if (!unlocked) {
            // 못 여는 맵이면 안내 문구만 보여줌
            showToast(
                this,
                exists
                    ? "데일리 모드에서 이 감정의 일기를 쓰면 열려요"
                    : "아직 준비 중인 맵이에요"
            );
            return;
        }

        // 열린 맵이면 게임 시작
        this.scene.start("GameScene", {
            gameMode: "infinity",
            emotion: emotion
        });
    }
}