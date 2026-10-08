import { MAPS } from "../manage/MapConfig";

// =====================================================
// 이미지 불러오기
// =====================================================

// 플레이어 이미지 불러오기
export function loadAllSprite(scene) {
    // 플레이어 스프라이트 시트 (한 장에 동작이 여러 개 들어있는 이미지)
    scene.load.spritesheet(
        "player",
        "/assets/game2/Player/player_sheet.png",
        {
            frameWidth: 32,    // 한 칸 가로 크기
            frameHeight: 32    // 한 칸 세로 크기
        }
    );
}

// 선택한 감정의 맵 이미지만 불러오기
// (안 쓰는 맵까지 다 불러오면 느려지기 때문)
export function loadMapAssets(scene, emotion) {
    const map = MAPS[emotion];

    if (!map) {
        return;
    }

    map.stages.forEach((stage) => {
        stage.layers.forEach((layer) => {
            // 이미 불러온 이미지는 다시 안 불러옴
            if (!scene.textures.exists(layer.key)) {
                scene.load.image(layer.key, layer.path);
            }
        });
    });
}
