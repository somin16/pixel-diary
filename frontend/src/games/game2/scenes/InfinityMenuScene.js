import Phaser from "phaser";
import { MAPS, EMOTION_LABEL } from "../manage/MapConfig";
import { showToast } from "../ui/Toast";

// =====================================================
// 무한 모드 맵 선택 화면
// 감정 5개 중 "일기를 쓴 적 있는" 감정의 맵만 고를 수 있습니다.
// =====================================================

// 화면에 보여줄 감정 순서
const EMOTIONS = ["happy", "calm", "tired", "sad", "angry"];

export default class InfinityMenuScene extends Phaser.Scene {

    constructor() {
        super("InfinityMenuScene");   // 이 화면의 이름표
    }

    create() {
        const { width, height } = this.scale;

        // Game2.jsx에서 넣어둔 일기 정보 꺼내기 (없으면 빈 값)
        const info = this.registry.get("diaryInfo") || { unlockedEmotions: [] };

        // 제목
        this.add.text(width / 2, height * 0.1, "무한 모드", {
            fontFamily: "Mona",
            fontSize: "28px",
            color: "#ffffff"
        }).setOrigin(0.5);

        // 버튼 배치 값 (한 줄에 3개씩)
        const columns = 3;
        const boxW = Math.min(180, width * 0.26);
        const boxH = Math.min(90, height * 0.22);
        const gap = 16;

        // 감정마다 버튼 하나씩 만들기
        EMOTIONS.forEach((emotion, i) => {

            const col = i % columns;               // 몇 번째 칸인지
            const row = Math.floor(i / columns);   // 몇 번째 줄인지

            const x = width / 2 + (col - 1) * (boxW + gap);
            const y = height * 0.36 + row * (boxH + gap);

            // 이 감정의 맵이 만들어져 있는가 (tired는 아직 없음)
            const exists = !!MAPS[emotion];
            // 일기를 써서 열렸는가
            const unlocked = exists && info.unlockedEmotions.includes(emotion);

            // 버튼 네모 (열렸으면 밝게, 잠겼으면 어둡게)
            const box = this.add.rectangle(
                x, y, boxW, boxH,
                unlocked ? 0x333333 : 0x1a1a1a
            );
            box.setStrokeStyle(2, unlocked ? 0xffffff : 0x666666);

            // 버튼 글자
            let label = EMOTION_LABEL[emotion];
            if (!exists) {
                label += "\n(준비 중)";
            } else if (!unlocked) {
                label += "\n(잠김)";
            }

            this.add.text(x, y, label, {
                fontFamily: "Mona",
                fontSize: "18px",
                color: unlocked ? "#ffffff" : "#888888",
                align: "center"
            }).setOrigin(0.5);

            // 버튼을 눌렀을 때
            box.setInteractive({ useHandCursor: true });
            box.on("pointerdown", () => {

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
            });
        });

        // 뒤로가기 (모드 선택 화면으로)
        const back = this.add.text(30, 25, "<", {
            fontFamily: "Mona",
            fontSize: "42px",
            color: "#ffffff",
            fontStyle: "bold"
        });

        back.setInteractive({ useHandCursor: true });
        back.on("pointerdown", () => this.scene.start("ModeSelectScene"));
    }
}
