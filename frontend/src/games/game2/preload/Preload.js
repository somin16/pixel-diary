import { MAPS } from "../manage/MapConfig";

// =====================================================
// 이미지 불러오기
// 이미지 파일 경로는 전부 이 파일에서만 관리합니다.
// =====================================================

const BASE = "/assets/game2/maps/";   // 맵 이미지 폴더 (public 폴더 기준)

// 맵 이미지 목록: 이름(key) → 파일 위치 (".png"는 빼고)
// ※ key는 MapConfig.js 의 layer("...") 이름과 같아야 합니다.
const MAP_IMAGES = {
    angry_night_background: "angry/night/angry_night_background",
    angry_night_mountain: "angry/night/angry_night_mountain",
    angry_night_road: "angry/night/angry_night_road",
    angry_day_background: "angry/day/angry_day_background",
    angry_day_cloude_1: "angry/day/angry_day_cloude_1",
    angry_day_cloude_2: "angry/day/angry_day_cloude_2",
    angry_day_cloude_3: "angry/day/angry_day_cloude_3",
    angry_day_cloude_4: "angry/day/angry_day_cloude_4",
    angry_day_cloude_5: "angry/day/angry_day_cloude_5",
    angry_day_mountain: "angry/day/angry_day_mountain",
    angry_day_road: "angry/day/angry_day_road",
    calm_background: "calm/calm_background",
    calm_flower_grass: "calm/calm_flower_grass",
    calm_grass_road: "calm/calm_grass_road",
    happy_background: "happy/happy_background",
    happy_tree_grass: "happy/happy_tree_grass",
    happy_road: "happy/happy_road",
    happy_leaves: "happy/happy_leaves",
    sad_night_background: "sad/night/sad_night_background",
    sad_night_road: "sad/night/sad_night_road",
    sad_night_rain: "sad/night/sad_night_rain",
    sad_day_background: "sad/day/sad_day_background",
    sad_day_boat: "sad/day/sad_day_boat",
    sad_day_road: "sad/day/sad_day_road"
};

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
            const file = MAP_IMAGES[layer.key];

            if (!file) {
                console.warn("맵 이미지 목록에 없음:", layer.key);
                return;
            }

            // 이미 불러온 이미지는 다시 안 불러옴
            if (!scene.textures.exists(layer.key)) {
                scene.load.image(layer.key, `${BASE}${file}.png`);
            }
        });
    });
}