export function createModeSelectUI(scene) {

    const { width, height } = scene.scale;


    // =========================
    // 화면 크기에 맞춘 값 계산
    // =========================

    // 모드 버튼 (데일리 / 무한)
    const modeW = Math.min(220, width * 0.28);
    const modeH = Math.min(150, height * 0.38);
    const modeGap = width * 0.04;

    const modeLeftX = width / 2 - modeGap / 2 - modeW / 2;
    const modeRightX = width / 2 + modeGap / 2 + modeW / 2;
    const modeY = height * 0.48;

    // 하단 버튼 (캐릭터 변경 / 설정)
    const menuW = Math.min(180, width * 0.22);
    const menuH = Math.min(70, height * 0.16);
    const menuGap = width * 0.03;

    const menuLeftX = width / 2 - menuGap / 2 - menuW / 2;
    const menuRightX = width / 2 + menuGap / 2 + menuW / 2;
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
            fontSize: `${titleSize}px`,
            color: "#ffffff"
        }
    ).setOrigin(0.5);


    // =========================
    // 데일리 모드
    // =========================

    createButton(
        scene,
        modeLeftX,
        modeY,
        modeW,
        modeH,
        0x222222,
        3,
        "데일리 모드",
        modeFont,
        () => {
            scene.scene.start("GameScene", {
                gameMode: "daily"
            });
        }
    );


    // =========================
    // 무한 모드
    // =========================

    createButton(
        scene,
        modeRightX,
        modeY,
        modeW,
        modeH,
        0x222222,
        3,
        "무한 모드",
        modeFont,
        () => {
            scene.scene.start("GameScene", {
                gameMode: "infinity"
            });
        }
    );


    // =========================
    // 캐릭터 변경
    // =========================

    createButton(
        scene,
        menuLeftX,
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
        menuRightX,
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
            fontSize: "42px",
            color: "#ffffff",
            fontStyle: "bold"
        }
    );

    backButton.setInteractive({
        useHandCursor: true
    });

    backButton.on("pointerdown", () => {
        window.location.href = "/minigamehub";
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
            fontSize: `${fontSize}px`,
            color: "#ffffff"
        }
    ).setOrigin(0.5);

    button.setInteractive({
        useHandCursor: true
    });

    button.on("pointerdown", onClick);
}