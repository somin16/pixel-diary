// =====================================================
// 결과 창 (CLEAR! / GAME OVER)
// 점수와 버튼을 보여줍니다.
//   - 버튼은 [다시 하기](선택) + [나가기]
// =====================================================

// scene   : 게임 화면
// options : { title, score, canRetry, onRetry, onExit }
export function showResultPanel(scene, options) {

    const { title, score, canRetry, onRetry, onExit } = options;

    const { width, height } = scene.scale;
    const cx = width / 2;
    const cy = height / 2;

    // 창 높이 (버튼이 1개면 작게, 2개면 크게)
    const panelH = canRetry ? 240 : 190;
    const top = cy - panelH / 2;

    // 어두운 배경 + 창 (depth가 클수록 앞에 그려짐)
    scene.add.rectangle(cx, cy, width, height, 0x000000, 0.5).setDepth(500);
    scene.add.rectangle(cx, cy, 360, panelH, 0x333333)
        .setStrokeStyle(3, 0xffffff)
        .setDepth(501);

    // 제목, 점수
    addText(scene, cx, top + 45, title, 40, true);
    addText(scene, cx, top + 95, `SCORE : ${score}`, 24, false);

    // 버튼 (무한 모드만 다시 하기가 있음)
    let y = top + 145;

    if (canRetry) {
        addButton(scene, cx, y, "다시 하기", onRetry);
        y += 55;
    }

    addButton(scene, cx, y, "나가기", onExit);
}


// 글자 하나 추가
function addText(scene, x, y, label, size, bold) {
    return scene.add.text(x, y, label, {
        fontFamily: "Mona",
        fontSize: `${size}px`,
        color: "#ffffff",
        fontStyle: bold ? "bold" : "normal"
    }).setOrigin(0.5).setDepth(502);
}


// 버튼 하나 추가
function addButton(scene, x, y, label, onClick) {
    const box = scene.add.rectangle(x, y, 220, 44, 0x8f9596)
        .setStrokeStyle(3, 0x333333)
        .setDepth(502)
        .setInteractive({ useHandCursor: true });

    addText(scene, x, y, label, 22, true).setDepth(503);

    // 마우스를 올리면 밝아짐
    box.on("pointerover", () => box.setFillStyle(0xa6adae));
    box.on("pointerout", () => box.setFillStyle(0x8f9596));
    box.on("pointerdown", onClick);
}
