export function createCharacterSelectUI(scene) {

    const { width, height } = scene.scale;


    // =========================
    // 화면 크기에 맞춘 값 계산
    // =========================

    // 캐릭터 박스 (정사각형)
    const boxSize = Math.min(180, width * 0.22, height * 0.36);
    const boxY = height * 0.42;

    // 선택 버튼
    const buttonW = Math.min(180, width * 0.22);
    const buttonH = Math.min(70, height * 0.16);
    const buttonY = height * 0.82;

    // 글자 크기
    const titleSize = Math.max(20, Math.min(32, height * 0.08));
    const buttonFont = Math.max(14, Math.min(20, height * 0.05));


    // =========================
    // 제목
    // =========================

    scene.add.text(
        width / 2,
        height * 0.12,
        "캐릭터 변경",
        {
            fontSize: `${titleSize}px`,
            color: "#ffffff"
        }
    ).setOrigin(0.5);


    // =========================
    // 캐릭터 1, 2, 3
    // =========================

    createCharacterBox(scene, width * 0.25, boxY, boxSize, "캐릭터 1");
    createCharacterBox(scene, width * 0.5, boxY, boxSize, "캐릭터 2");
    createCharacterBox(scene, width * 0.75, boxY, boxSize, "캐릭터 3");


    // =========================
    // 선택 버튼
    // 현재는 비활성화
    // =========================

    const selectButton = scene.add.rectangle(
        width / 2,
        buttonY,
        buttonW,
        buttonH,
        0x333333
    );

    selectButton.setStrokeStyle(2, 0x777777);


    scene.add.text(
        width / 2,
        buttonY,
        "선택",
        {
            fontSize: `${buttonFont}px`,
            color: "#777777"
        }
    ).setOrigin(0.5);


    // 현재는 캐릭터가 준비되지 않았기 때문에
    // 선택 버튼에 클릭 이벤트를 넣지 않음


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
// 캐릭터 박스
// =========================

function createCharacterBox(scene, x, y, size, characterName) {

    const box = scene.add.rectangle(
        x,
        y,
        size,
        size,
        0x222222
    );

    box.setStrokeStyle(3, 0xffffff);

    // 박스 크기에 맞춘 글자 크기
    const nameFont = Math.max(14, Math.min(22, size * 0.12));
    const subFont = Math.max(12, Math.min(20, size * 0.11));


    // 캐릭터 이름

    scene.add.text(
        x,
        y - size * 0.14,
        characterName,
        {
            fontSize: `${nameFont}px`,
            color: "#ffffff"
        }
    ).setOrigin(0.5);


    // 준비중

    scene.add.text(
        x,
        y + size * 0.14,
        "준비중",
        {
            fontSize: `${subFont}px`,
            color: "#aaaaaa"
        }
    ).setOrigin(0.5);
}