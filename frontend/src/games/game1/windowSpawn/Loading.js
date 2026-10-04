export function loadingWindowSpawn(scene, message = "기본 메세지") {

    const { width, height } = scene.cameras.main;

    const loadingWindow = scene.add.container(0, 0)
        .setScrollFactor(0)
        .setDepth(1000);

    const background = scene.add.rectangle(
        width / 2,
        height / 2,
        width,
        height,
        0x000000,
        0.7
    );

    const loadingText = scene.add.text(

        width / 2,
        height / 2,
        message, {

            fontFamily: "Mona",
            fontSize: "24px",
            color: "#ffffff",
        }
    ).setOrigin(0.5);

    let dotCount = 0;

    const dotTimer = scene.time.addEvent({
        delay: 400, // 0.4초마다 변경
        loop: true,
        callback: () => {
            dotCount = (dotCount + 1) % 4;

            loadingText.setText(
                message + ".".repeat(dotCount)
            );
        },
    });

    // 왼쪽 아래를 기준점으로 지정
    // 왼쪽 끝이 화면 너비보다 바깥에 있으므로 처음엔 보이지 않음
    const loadingSprite = scene.add.sprite(
        width + 10,
        height - 10,
        "loading_screen"
    )
    .setOrigin(0, 1)
    .setScale(4);

    loadingSprite.play("loading_screen_animation");

    // 만든거 다 넣기
    loadingWindow.add([background,loadingText, loadingSprite]);

    // 오른쪽 밖에서 왼쪽 밖까지 일정한 속도로 이동
    const moveTween = scene.tweens.add({
        targets: loadingSprite,
        x: -loadingSprite.displayWidth - 10,
        duration: 6000,
        ease: "Linear",
        repeat: -1,
    });

    // 로딩 화면이 지워질 때 같이 정리
    loadingWindow.once("destroy", () => {
        moveTween.remove();
        dotTimer.remove();
    });

    return loadingWindow;
}