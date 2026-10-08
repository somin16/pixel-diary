export function errorMessageSpawn(scene, 
    message = "에러가 발생했습니다. \n 다시 시도해 주세요.") {

    const { width, height } = scene.cameras.main;

    const duration = 2500;
    const paddingX = 20;
    const paddingY = 12;

    // 텍스트
    const text = scene.add.text(0, 0, message, {
        fontFamily: "Mona",
        fontSize: "18px",
        color: "#000000",
        align: "center",
        wordWrap: {
            width: Math.min(320, width * 0.8 - paddingX * 2),
        },
    }).setOrigin(0.5);

    // 글자 크기에 맞춰 배경 크기 계산
    const boxWidth = text.width + paddingX * 2;
    const boxHeight = text.height + paddingY * 2;

    // 둥근 흰색 배경
    const background = scene.add.graphics();

    background.fillStyle(0xffffff, 1);
    background.fillRoundedRect(
        -boxWidth / 2,
        -boxHeight / 2,
        boxWidth,
        boxHeight,
        10
    );

    // 화면 하단에서 30px 위에 표시
    const toast = scene.add.container(
        width / 2,
        height - boxHeight / 2 - 30,
        [background, text]
    )
    .setScrollFactor(0)
    .setDepth(2000);

    // 지정한 시간이 지나면 삭제
    const hideTimer = window.setTimeout(() => {
        if (toast.active) {
            toast.destroy();
        }
    }, duration);

    // 도중에 직접 삭제해도 타이머 정리
    toast.once("destroy", () => {
        window.clearTimeout(hideTimer);
    });

    return toast;
}