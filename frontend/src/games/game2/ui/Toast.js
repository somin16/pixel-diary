import { PIXEL, createPixelBox } from "./PixelUI";

// =====================================================
// 토스트 메시지
// 화면 아래에 안내 문구를 잠깐 보여줬다가 사라지게 합니다.
// 사용법: showToast(scene, "보여줄 문구");
// =====================================================

export function showToast(scene, message) {
    const { width, height } = scene.scale;

    // 글자를 먼저 만들어서 크기를 잰 뒤, 그 크기에 맞는 픽셀 상자를 만든다
    const text = scene.add.text(0, 0, message, {
        fontFamily: PIXEL.font,
        fontSize: "18px",
        color: PIXEL.inkText
    }).setOrigin(0.5);

    const box = createPixelBox(scene, {
        x: width / 2,
        y: height * 0.9,
        w: Math.ceil(text.width) + 40,
        h: Math.ceil(text.height) + 24,
        depth: 1000   // 가장 위에 보이게
    });

    box.add(text);

    // 1.5초 기다렸다가 0.4초 동안 서서히 사라진 뒤 삭제
    scene.tweens.add({
        targets: box,
        alpha: 0,
        delay: 1500,
        duration: 400,
        onComplete: () => box.destroy()
    });
}