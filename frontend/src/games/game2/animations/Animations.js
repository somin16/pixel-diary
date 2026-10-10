// Game2에서 사용하는 애니메이션을 만드는 곳

// 낮/밤 시트 목록: 낮은 이름 그대로, 밤은 뒤에 "_night"를 붙임
const SHEETS = [
    { texture: "player", suffix: "" },
    { texture: "player_night", suffix: "_night" },
];

export function createAllAnimations(scene) {

    // 이미 밤 애니메이션까지 만들어져 있으면 다시 만들지 않음
    if (scene.anims.exists("player_run_night")) {
        return;
    }

    SHEETS.forEach(({ texture, suffix }) => {

        // 달리기: 이미지 기준 1~4번 (Phaser frame 0~3)
        scene.anims.create({
            key: `player_run${suffix}`,
            frames: [0, 1, 2, 3].map((frame) => ({ key: texture, frame })),
            frameRate: 10,
            repeat: -1
        });

        // 점프: 이미지 기준 5~8번 (Phaser frame 4~7)
        scene.anims.create({
            key: `player_jump${suffix}`,
            frames: [4, 5, 6, 7].map((frame) => ({ key: texture, frame })),
            frameRate: 10,
            repeat: 0
        });

        // 슬라이드: 이미지 기준 9~11번 (Phaser frame 8~10)
        scene.anims.create({
            key: `player_slide${suffix}`,
            frames: [8, 9, 10].map((frame) => ({ key: texture, frame })),
            frameRate: 10,
            repeat: 0
        });
    });
}