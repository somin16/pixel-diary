import { PIXEL, createPixelBox, createPixelButton } from "./PixelUI";

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
    const panelH = canRetry ? 260 : 200;
    const top = cy - panelH / 2;

    // 어두운 배경 (뒤쪽 버튼이 눌리지 않게 막아줌. depth가 클수록 앞에 그려짐)
    scene.add.rectangle(0, 0, width, height, PIXEL.shadow, 0.7)
        .setOrigin(0)
        .setDepth(500)
        .setInteractive();

    // 창
    createPixelBox(scene, { x: cx, y: cy, w: 360, h: panelH, depth: 501 });

    // 제목, 점수
    addText(scene, cx, top + 50, title, 40, true);
    addText(scene, cx, top + 105, `SCORE : ${score}`, 24, false);

    // 버튼 (무한 모드만 다시 하기가 있음)
    let y = top + 160;

    if (canRetry) {
        createPixelButton(scene, {
            x: cx, y, w: 220, h: 44, label: "다시 하기", fill: PIXEL.sun,
            fontSize: 22, depth: 502, onClick: onRetry
        });
        y += 56;
    }

    createPixelButton(scene, {
        x: cx, y, w: 220, h: 44, label: "나가기", fill: PIXEL.lilac,
        fontSize: 22, depth: 502, onClick: onExit
    });
}


// 글자 하나 추가
function addText(scene, x, y, label, size, bold) {
    return scene.add.text(x, y, label, {
        fontFamily: PIXEL.font,
        fontSize: `${size}px`,
        color: PIXEL.inkText,
        fontStyle: bold ? "bold" : "normal"
    }).setOrigin(0.5).setDepth(502);
}