// 화면 크기가 바뀌면 씬을 다시 시작해서
// 버튼과 글자를 새 크기에 맞게 다시 그려주는 함수

export function restartOnResize(scene) {

    // 지금 화면 크기를 기억
    const startWidth = scene.scale.width;
    const startHeight = scene.scale.height;

    let timer = null;

    const onResize = (gameSize) => {

        // 크기가 그대로면 무시
        if (
            gameSize.width === startWidth &&
            gameSize.height === startHeight
        ) {
            return;
        }

        // 크기가 계속 변하는 중에는 기다렸다가 마지막에 한 번만 다시 시작
        timer?.remove();

        timer = scene.time.delayedCall(150, () => {
            scene.scene.restart();
        });
    };

    scene.scale.on("resize", onResize);

    // 씬이 끝나면 정리
    scene.events.once("shutdown", () => {

        scene.scale.off("resize", onResize);
        timer?.remove();

    });
}