// =====================================================
// 맵(배경) 설정표
// 감정(happy, calm, sad, angry)마다 어떤 이미지를 어떤 순서로 깔지 적어둔 파일입니다.
// ※ 이미지 파일 경로는 preload/Preload.js 의 MAP_IMAGES 에 있습니다.
//
// - ground : 도로(바닥) 두께. "그림 픽셀" 단위 (맵 이미지 240x135 기준)
// - stages : 맵 "단계". 순서대로 바뀝니다. (angry: 1단계 night → 2단계 day)
// - sky    : 그림 위쪽이 남을 때 채울 하늘색 (그림 맨 윗줄 색과 맞추세요)
// - hud    : 글자색(text), 외곽선색(outline), 체력 글자색(hp)
// - layers : 한 단계 안에 겹쳐 놓는 이미지들. 위에 적을수록 "뒤쪽"에 그려집니다.
//
// layer(key, speed, front, gap)
//   key   : 이미지 이름 (Preload.js 의 MAP_IMAGES 이름과 같아야 함)
//   speed : 움직이는 빠르기. 1 = 바닥과 같은 속도, 작을수록 천천히
//   front : true면 캐릭터보다 "앞"에 그려짐 (비, 나뭇잎 같은 것)
//   gap   : 이미지 오른쪽에 붙일 빈 공간(그림 픽셀). 같은 물체가 너무 자주 반복될 때 사용
//   offsetY : 위아래 위치 조절(그림 픽셀). +는 아래로, -는 위로. 기본 0
// =====================================================

function layer(key, speed, front = false, gap = 0, offsetY = 0) {
    return { key, speed, front, gap, offsetY };   
}

export const MAPS = {

    // ---------- 분노: 밤(화남) → 낮(화가 풀림) ----------
    angry: {
        ground: 20,
        spinAir: true,
        stages: [
            {   // 1단계: night
                obstacles: { ground: "angry_night_obstacle_ground", air: "angry_night_obstacle_air" },
                trailColors: ["#ff6b3d", "#ffb347"],  
                playerSkin: "_night",
                sky: "#120b38",
                hud: { text: "#ffffff", outline: "#ff6060", hp: "#ffffff" },
                layers: [
                    layer("angry_night_background", 0.05, false, 0, 0),
                    layer("angry_night_mountain", 0.02, false, 240),   // 화산 간격 넓힘
                    layer("angry_night_road", 1, false, 0, 0)
                ]
            },
            {   // 2단계: day
                obstacles: { ground: "angry_day_obstacle_ground", air: "angry_day_obstacle_air" },
                trailColors: ["#4998cc", "#15166b"],    
                sky: "#bfe6f7",
                hud: { text: "#ffffff", outline: "#15165f", hp: "#ffffff" },
                layers: [
                    layer("angry_day_background", 0.05, false, 0, 0),
                    layer("angry_day_cloude_1", 0.06, false, 20, 0),
                    layer("angry_day_cloude_2", 0.06, false, 40, 0),
                    layer("angry_day_cloude_3", 0.06, false, 60, 0),
                    layer("angry_day_cloude_4", 0.06, false, 80, 0),
                    layer("angry_day_cloude_5", 0.06, false, 100, 0),
                    layer("angry_day_mountain", 0.01, false, 240, 0),
                    layer("angry_day_road", 1, false, 0, 0)
                ]
            }
        ]
    },

    // ---------- 평온: 한 단계 ----------
    calm: {
        ground: 14,   // 평온맵은 풀이 얇아서 바닥을 낮춤 (떠 있으면 줄이고, 파묻히면 키우기)
        stages: [
            {
                obstacles: { ground: "calm_obstacle_ground", air: "calm_obstacle_air" },
                trailColors: ["#bed114", "#faad42"],    
                sky: "#cdebe6",
                hud: { text: "#003b1b", outline: "#95d6a4", hp: "#003b1b" },
                layers: [
                    layer("calm_background", 0.05, false, 0, 0),
                    layer("calm_flower_grass", 0.6, false, 0, -40),
                    layer("calm_grass_road", 1, false, 0, 0)
                ]
            }
        ]
    },

    // ---------- 행복: 한 단계 ----------
    happy: {
        ground: 16,
        spinAir: true,
        stages: [
            {
                obstacles: { ground: "happy_obstacle_ground", air: "happy_obstacle_air" },
                trailColors: ["#ffbcb0", "#fff178"],    
                sky: "#ffecaf",
                hud: { text: "#003a05", outline: "#b6da86", hp: "#003a05" },
                layers: [
                    layer("happy_background", 0.05, false, 0, 0),
                    // layer("happy_tree_grass", 0.1, false, 0, 100),
                    layer("happy_road", 1, false, 0, 0),
                    layer("happy_leaves", 1.5, true)   // 나뭇잎은 캐릭터 앞으로
                ]
            }
        ]
    },

    // ---------- 슬픔: 밤(비) → 낮(배) ----------
    sad: {
        ground: 24,
        stages: [
            {   // 1단계: night (비가 내림)
                obstacles: { ground: "sad_night_obstacle_ground", air: "sad_night_obstacle_air" },
                trailColors: ["#ff6b3d", "#ffb347"],    
                playerSkin: "_night",
                sky: "#1c263b",
                hud: { text: "#ffffff", outline: "#3b5c92", hp: "#ffffff" },
                layers: [
                    layer("sad_night_background", 0.05, false, 0, 0),
                    layer("sad_night_road", 1, false, 0, 0),
                    layer("sad_night_rain", 1.5, true, 0, 0)   // 비는 캐릭터 앞으로
                ]
            },
            {   // 2단계: day (배가 보임)
                obstacles: { ground: "sad_day_obstacle_ground", air: "sad_day_obstacle_air" },
                sky: "#c9ecfb",
                hud: { text: "#ffffff", outline: "#4c7fb3", hp: "#ffffff" },
                layers: [
                    layer("sad_day_background", 0.05, false, 0, 0),
                    layer("sad_day_boat", 0.01, false, 240),   // 배 간격 넓힘
                    layer("sad_day_road", 1, false, 0, 0)
                ]
            }
        ]
    },

    tired: {
        ground: 6,   
        spinAir: true,
        stages: [
            {   // 1단계: night
                obstacles: { ground: "tired_night_obstacle_ground", air: "tired_night_obstacle_air" },
                trailColors: ["#251915", "#6c6b80"],    
                playerSkin: "_night",
                sky: "#808fa3",
                hud: { text: "#ffffff", outline: "#221f30", hp: "#ffffff" },
                layers: [
                    layer("tired_night_background", 0.03, false, 0, 0),
                    layer("tired_night_building_1", 0.10, false, 0, 0),   // 가장 뒤
                    layer("tired_night_building_2", 0.20, false, 0, 0),
                    layer("tired_night_building_3", 0.35, false, 0, 0),
                    layer("tired_night_building_4", 0.55, false, 0, 0),   // 가장 앞
                    layer("tired_night_road", 1, false, 0, 0)
                ]
            },
            {   // 2단계: day
                obstacles: { ground: "tired_day_obstacle_ground", air: "tired_day_obstacle_air" },
                trailColors: ["#ffaaa3", "#ffa8b6"],    
                sky: "#ffc7bd",
                hud: { text: "#ffffff", outline: "#8a3a4a", hp: "#ffffff" },
                layers: [
                    layer("tired_day_background", 0.03, false, 0, 0),
                    layer("tired_day_building_1", 0.10, false, 0, 0),
                    layer("tired_day_building_2", 0.20, false, 0, 0),
                    layer("tired_day_building_3", 0.35, false, 0, 0),
                    layer("tired_day_building_4", 0.55, false, 0, 0),
                    layer("tired_day_road", 1, false, 0, 0)
                ]
            }
        ]
    }
};

// =====================================================
// 장애물별 크기/판정 조절표
// - scale   : 그림 크기 배수. 반드시 "정수"(1, 2)만! 소수점은 픽셀이 뭉개짐
// - hitSide : 좌우 판정을 몇 %씩 줄일지 (0~0.4). 클수록 판정이 좁아져서 잘 피함
// - hitTop  : 위쪽 판정을 몇 % 줄일지 (0~0.4). 클수록 위로 점프할 때 잘 피함
// =====================================================
export const OBSTACLE_TUNING = {
    angry_night_obstacle_ground: { scale: 3, hitSide: 0.34, hitTop: 0.1 },
    angry_night_obstacle_air:    { scale: 3, hitSide: 0.15, hitTop: 0.1 },
    angry_day_obstacle_ground:   { scale: 3, hitSide: 0.34, hitTop: 0.1 },
    angry_day_obstacle_air:      { scale: 3, hitSide: 0.15, hitTop: 0.1 },
    sad_night_obstacle_ground:   { scale: 2, hitSide: 0.2, hitTop: 0.1 },
    sad_night_obstacle_air:      { scale: 2, hitSide: 0.15, hitTop: 0.1 },
    sad_day_obstacle_ground:     { scale: 2, hitSide: 0.2, hitTop: 0.1 },
    sad_day_obstacle_air:        { scale: 2, hitSide: 0.15, hitTop: 0.1 },
    tired_night_obstacle_ground: { scale: 2, hitSide: 0.15, hitTop: 0.1 },
    tired_night_obstacle_air:    { scale: 2, hitSide: 0.15, hitTop: 0.1 },
    tired_day_obstacle_ground:   { scale: 2, hitSide: 0.15, hitTop: 0.1 },
    tired_day_obstacle_air:      { scale: 2, hitSide: 0.15, hitTop: 0.1 },
    calm_obstacle_ground:        { scale: 2, hitSide: 0.15, hitTop: 0.1 },
    calm_obstacle_air:           { scale: 2, hitSide: 0.15, hitTop: 0.1 },
    happy_obstacle_ground:       { scale: 3, hitSide: 0.15, hitTop: 0.1 },
    happy_obstacle_air:          { scale: 2, hitSide: 0.15, hitTop: 0.1 }
};

// 화면에 보여줄 감정 이름 (영어 → 한글)
export const EMOTION_LABEL = {
    happy: "행복",
    calm: "평온",
    tired: "피곤",
    sad: "슬픔",
    angry: "분노"
};