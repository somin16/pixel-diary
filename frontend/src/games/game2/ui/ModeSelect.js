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
        rightX,
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