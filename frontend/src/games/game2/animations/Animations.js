// Game2에서 사용하는 애니메이션을 만드는 곳

export function createAllAnimations(scene) {

    // 이미 애니메이션이 만들어져 있으면 다시 만들지 않음
    if (scene.anims.exists("player_run")) {
        return;
    }


    // -------------------------
    // 달리기
    // 이미지 기준 1~9번
    // Phaser frame 기준 0~8
    // -------------------------

    scene.anims.create({
        key: "player_run",

        frames: [
            { key: "player", frame: 0 },
            { key: "player", frame: 1 },
            { key: "player", frame: 2 },
            { key: "player", frame: 3 },
            { key: "player", frame: 4 },
            { key: "player", frame: 5 },
            { key: "player", frame: 6 },
            { key: "player", frame: 7 },
            { key: "player", frame: 8 }
        ],

        frameRate: 10,
        repeat: -1
    });


    // -------------------------
    // 점프
    // 이미지 기준 12번부터
    // Phaser frame 기준 11~19
    // -------------------------

    scene.anims.create({
        key: "player_jump",

        frames: [
            { key: "player", frame: 11 },
            { key: "player", frame: 12 },
            { key: "player", frame: 13 },
            { key: "player", frame: 14 },
            { key: "player", frame: 15 },
            { key: "player", frame: 16 },
            { key: "player", frame: 17 },
            { key: "player", frame: 18 },
            { key: "player", frame: 19 }
        ],

        frameRate: 10,
        repeat: 0
    });


    // -------------------------
    // 슬라이드
    // 이미지 기준 21~25번
    // Phaser frame 기준 20~24
    // -------------------------

    scene.anims.create({
        key: "player_slide",

        frames: [
            { key: "player", frame: 20 },
            { key: "player", frame: 21 },
            { key: "player", frame: 22 },
            { key: "player", frame: 23 },
            { key: "player", frame: 24 }
        ],

        frameRate: 10,
        repeat: 0
    });
}