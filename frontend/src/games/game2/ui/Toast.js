// =====================================================
// 토스트 메시지
// 화면 아래에 안내 문구를 잠깐 보여줬다가 사라지게 합니다.
// 사용법: showToast(scene, "보여줄 문구");
// =====================================================

export function showToast(scene, message) {
    const { width, height } = scene.scale;

    // 화면 아래쪽 가운데에 검은 배경 글자
    const text = scene.add.text(width / 2, height * 0.92, message, {
        fontFamily: "Mona",
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "#000000cc",
        padding: { x: 14, y: 8 }
    });

    text.setOrigin(0.5).setDepth(1000);   // 가장 위에 보이게

    // 1.5초 기다렸다가 0.4초 동안 서서히 사라진 뒤 삭제
    scene.tweens.add({
        targets: text,
        alpha: 0,
        delay: 1500,
        duration: 400,
        onComplete: () => text.destroy()
    });
}
