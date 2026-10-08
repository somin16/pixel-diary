import { MAPS } from "../manage/MapConfig";
import { showToast } from "./Toast";

// =====================================================
// 모드 선택 화면의 버튼들을 만드는 파일
// (데일리 모드 / 무한 모드 / 캐릭터 변경 / 설정 / 뒤로가기)
// =====================================================

export function createModeSelectUI(scene) {

    const { width, height } = scene.scale;


    // =========================
    // 화면 크기에 맞춘 값 계산
    // =========================

    // 모드 버튼 (데일리 / 무한)
    const modeW = Math.min(220, width * 0.28);
    const modeH = Math.min(150, height * 0.38);
    const gap = width * 0.04;

    // 하단 버튼 (캐릭터 변경 / 설정)
    // 위쪽 버튼과 너비, 간격을 똑같이 맞춰서 좌우 끝선이 일치
    const menuW = modeW;
    const menuH = Math.min(70, height * 0.16);

    const leftX = width / 2 - gap / 2 - modeW / 2;
    const rightX = width / 2 + gap / 2 + modeW / 2;

    const modeY = height * 0.48;
    const menuY = height * 0.80;

    // 글자 크기
    const titleSize = Math.max(20, Math.min(32, height * 0.08));
    const modeFont = Math.max(16, Math.min(24, height * 0.06));
    const menuFont = Math.max(14, Math.min(20, height * 0.05));


    // =========================
    // 제목
    // =========================

    scene.add.text(
        width / 2,
        height * 0.12,
        "미니게임 2",
        {
            fontFamily: "Mona",
            fontSize: `${titleSize}px`,
            color: "#ffffff"
        }
    ).setOrigin(0.5);


    // =========================
    // 데일리 모드
    // 오늘 일기를 쓴 경우에만 시작할 수 있고,
    // 일기에 쓴 감정의 맵으로 시작합니다.
    // =========================

    createButton(
        scene,
        leftX,
        modeY,
        modeW,
        modeH,
        0x222222,
        3,
        "데일리 모드",
        modeFont,
        () => {

            // Game2.jsx에서 넣어둔 일기 정보 꺼내기
            const info = scene.registry.get("diaryInfo");

            // 오늘 쓴 일기가 없으면 안내만 하고 끝
            if (!info?.todayEmotion) {
                showToast(scene, "오늘 일기를 먼저 작성해 주세요");
                return;
            }

            // 그 감정의 맵이 아직 없으면(예: 피곤) 안내만 하고 끝
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
    );


    // =========================
    // 무한 모드
    // 데일리 모드로 한 번이라도 열린 맵이 있어야 들어갈 수 있고,
    // 들어가면 맵을 고르는 화면이 나옵니다.
    // =========================

    createButton(
        scene,
        rightX,
        modeY,
        modeW,
        modeH,
        0x222222,
        3,
        "무한 모드",
        modeFont,
        () => {

            const info = scene.registry.get("diaryInfo");

            // 열린 맵이 하나도 없으면 안내만 하고 끝
            if (!info || info.unlockedEmotions.length === 0) {
                showToast(scene, "일기를 써서 맵을 먼저 열어 주세요");
                return;
            }

            // 맵 선택 화면으로 이동
            scene.scene.start("InfinityMenuScene");
        }
    );


    // =========================
    // 캐릭터 변경
    // =========================

    createButton(
        scene,
        leftX,
        menuY,
        menuW,
        menuH,
        0x333333,
        2,
        "캐릭터 변경",
        menuFont,
        () => {
            scene.scene.start("CharacterSelectScene");
        }
    );


    // =========================
    // 설정
    // =========================

    createButton(
        scene,
        rightX,
        menuY,
        menuW,
        menuH,
        0x333333,
        2,
        "설정",
        menuFont,
        () => {
            scene.scene.start("SettingsScene");
        }
    );


    // =========================
    // 뒤로가기
    // 미니게임 허브로 이동
    // =========================

    const backButton = scene.add.text(
        30,
        25,
        "<",
        {
            fontFamily: "Mona",
            fontSize: "42px",
            color: "#ffffff",
            fontStyle: "bold"
        }
    );

    backButton.setInteractive({
        useHandCursor: true
    });

    backButton.on("pointerdown", () => {
    window.history.back();
    });
}


// =========================
// 버튼 하나 만들기 (모드 버튼, 하단 버튼 공통)
// =========================

function createButton(
    scene,
    x,
    y,
    w,
    h,
    fillColor,
    strokeWidth,
    label,
    fontSize,
    onClick
) {

    const button = scene.add.rectangle(
        x,
        y,
        w,
        h,
        fillColor
    );

    button.setStrokeStyle(strokeWidth, 0xffffff);

    scene.add.text(
        x,
        y,
        label,
        {
            fontFamily: "Mona",
            fontSize: `${fontSize}px`,
            color: "#ffffff"
        }
    ).setOrigin(0.5);

    button.setInteractive({
        useHandCursor: true
    });

    button.on("pointerdown", onClick);
}
