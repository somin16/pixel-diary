export function createSettingsUI(scene) {

    const { width, height } = scene.scale;


    // =========================
    // 화면 크기에 맞춘 값 계산
    // =========================

    const titleSize = Math.max(20, Math.min(32, height * 0.08));


    // =========================
    // 제목
    // =========================

    scene.add.text(
        width / 2,
        height * 0.12,
        "설정",
        {
            fontSize: `${titleSize}px`,
            color: "#ffffff"
        }
    ).setOrigin(0.5);


    // =========================
    // 배경음
    // =========================

    createSoundSetting(
        scene,
        width / 2,
        height * 0.36,
        "배경음"
    );


    // =========================
    // 효과음
    // =========================

    createSoundSetting(
        scene,
        width / 2,
        height * 0.60,
        "효과음"
    );


    // =========================
    // 뒤로가기
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

        scene.scene.start("ModeSelectScene");

    });
}


// =========================
// 사운드 설정 버튼
// =========================

function createSoundSetting(scene, x, y, title) {

    const { width, height } = scene.scale;


    // 설정 박스 크기 (화면에 맞춰 줄어듦)
    const boxW = Math.min(360, width * 0.8);
    const boxH = Math.min(90, height * 0.17);

    // ON / OFF 버튼 크기
    const buttonW = Math.min(70, boxW * 0.19);
    const buttonH = Math.min(45, boxH * 0.5);

    // 글자 크기
    const titleFont = Math.max(14, Math.min(22, boxH * 0.25));
    const buttonFont = Math.max(12, Math.min(18, boxH * 0.2));

    // 박스 안쪽 위치 (박스 너비 기준)
    const titleX = x - boxW * 0.28;
    const onX = x + boxW * 0.17;
    const offX = x + boxW * 0.39;


    // 설정 박스

    const box = scene.add.rectangle(
        x,
        y,
        boxW,
        boxH,
        0x222222
    );

    box.setStrokeStyle(2, 0xffffff);


    // 설정 이름

    scene.add.text(
        titleX,
        y,
        title,
        {
            fontSize: `${titleFont}px`,
            color: "#ffffff"
        }
    ).setOrigin(0.5);


    // ON 버튼

    const onButton = scene.add.rectangle(
        onX,
        y,
        buttonW,
        buttonH,
        0x444444
    );

    onButton.setStrokeStyle(2, 0xffffff);


    scene.add.text(
        onX,
        y,
        "ON",
        {
            fontSize: `${buttonFont}px`,
            color: "#ffffff"
        }
    ).setOrigin(0.5);


    // OFF 버튼

    const offButton = scene.add.rectangle(
        offX,
        y,
        buttonW,
        buttonH,
        0x444444
    );

    offButton.setStrokeStyle(2, 0xffffff);


    scene.add.text(
        offX,
        y,
        "OFF",
        {
            fontSize: `${buttonFont}px`,
            color: "#ffffff"
        }
    ).setOrigin(0.5);


    // 현재는 UI만 구현
    // 실제 배경음 / 효과음 제어는 나중에 연결
}