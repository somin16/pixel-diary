// Game2에서 사용하는 이미지들을 불러오는 곳

export function loadAllSprite(scene) {
    // 플레이어 스프라이트 시트
    scene.load.spritesheet(
        "player",
        "/assets/game2/Player/player_sheet.png",
        {
            frameWidth: 224,
            frameHeight: 192
        }
    );
}