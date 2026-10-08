// Game2에서 사용하는 애니메이션을 만드는 곳

export function createAllAnimations(scene) {

    // 이미 애니메이션이 만들어져 있으면 다시 만들지 않음
    if (scene.anims.exists("player_run")) {
        return;
    }


    // =========================
    // 달리기
    // 이미지 기준 1~4번
    // Phaser frame 기준 0~3
    // =========================

    scene.anims.create({
        key: "player_run",

        frames: [
            { key: "player", frame: 0 },
            { key: "player", frame: 1 },
            { key: "player", frame: 2 },
            { key: "player", frame: 3 },
        ],

        frameRate: 10,
        repeat: -1
    });


    // =========================
    // 점프
    // 이미지 기준 5~8번
    // Phaser frame 기준 4~7
    // =========================

    scene.anims.create({
        key: "player_jump",

        frames: [
            { key: "player", frame: 4 },
            { key: "player", frame: 5 },
            { key: "player", frame: 6 },
            { key: "player", frame: 7 },
        ],

        frameRate: 10,
        repeat: 0
    });


    // =========================
    // 슬라이드
    // 이미지 기준 9~11번
    // Phaser frame 기준 8~10
    // =========================

    scene.anims.create({
        key: "player_slide",

        frames: [
            { key: "player", frame: 8 },
            { key: "player", frame: 9 },
            { key: "player", frame: 10 },
        ],

        frameRate: 10,
        repeat: 0
    });
}