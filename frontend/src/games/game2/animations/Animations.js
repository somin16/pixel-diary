// Game2에서 사용하는 애니메이션을 만드는 곳

export function createAllAnimations(scene) {

    // 이미 애니메이션이 만들어져 있으면 다시 만들지 않음
    if (scene.anims.exists("player_run")) {
        return;
    }

    // 플레이어 달리기 애니메이션
    scene.anims.create({
        key: "player_run",

        frames: [
            { key: "player", frame: 7 },
            { key: "player", frame: 8 }
        ],

        frameRate: 8,
        repeat: -1
    });
}