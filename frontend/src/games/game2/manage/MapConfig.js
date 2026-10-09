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
// =====================================================

function layer(key, speed, front = false, gap = 0) {
    return { key, speed, front, gap };
}

export const MAPS = {

    // ---------- 분노: 밤(화남) → 낮(화가 풀림) ----------
    angry: {
        ground: 24,
        stages: [
            {   // 1단계: night
                sky: "#02012b",
                hud: { text: "#ffffff", outline: "#1a1030", hp: "#ff8a8a" },
                layers: [
                    layer("angry_night_background", 0.05),
                    layer("angry_night_mountain", 0.3, false, 240),   // 화산 간격 넓힘
                    layer("angry_night_road", 1)
                ]
            },
            {   // 2단계: day
                sky: "#bfe6f7",
                hud: { text: "#ffffff", outline: "#7a3a1a", hp: "#ff6b6b" },
                layers: [
                    layer("angry_day_background", 0.05),
                    layer("angry_day_cloude_1", 0.10),
                    layer("angry_day_cloude_2", 0.14),
                    layer("angry_day_cloude_3", 0.18),
                    layer("angry_day_cloude_4", 0.22),
                    layer("angry_day_cloude_5", 0.26),
                    layer("angry_day_mountain", 0.3),
                    layer("angry_day_road", 1)
                ]
            }
        ]
    },

    // ---------- 평온: 한 단계 ----------
    calm: {
        ground: 14,   // 평온맵은 풀이 얇아서 바닥을 낮춤 (떠 있으면 줄이고, 파묻히면 키우기)
        stages: [
            {
                sky: "#cdebe6",
                hud: { text: "#ffffff", outline: "#2f5d3a", hp: "#ff6b81" },
                layers: [
                    layer("calm_background", 0.05),
                    layer("calm_flower_grass", 0.6),
                    layer("calm_grass_road", 1)
                ]
            }
        ]
    },

    // ---------- 행복: 한 단계 ----------
    happy: {
        ground: 16,
        stages: [
            {
                sky: "#fff3c4",
                hud: { text: "#ffffff", outline: "#a8602a", hp: "#ff4d6d" },
                layers: [
                    layer("happy_background", 0.05),
                    layer("happy_tree_grass", 0.6),
                    layer("happy_road", 1),
                    layer("happy_leaves", 0.5, true)   // 나뭇잎은 캐릭터 앞으로
                ]
            }
        ]
    },

    // ---------- 슬픔: 밤(비) → 낮(배) ----------
    sad: {
        ground: 24,
        stages: [
            {   // 1단계: night (비가 내림)
                sky: "#0b1230",
                hud: { text: "#ffffff", outline: "#10203a", hp: "#ff8a8a" },
                layers: [
                    layer("sad_night_background", 0.05),
                    layer("sad_night_road", 1),
                    layer("sad_night_rain", 0.3, true)   // 비는 캐릭터 앞으로
                ]
            },
            {   // 2단계: day (배가 보임)
                sky: "#c9ecfb",
                hud: { text: "#ffffff", outline: "#1a4a7a", hp: "#ff6b6b" },
                layers: [
                    layer("sad_day_background", 0.05),
                    layer("sad_day_boat", 0.2, false, 240),   // 배 간격 넓힘
                    layer("sad_day_road", 1)
                ]
            }
        ]
    }

    // tired(피곤)는 에셋이 아직 없어서 여기에 없습니다.
};

// 화면에 보여줄 감정 이름 (영어 → 한글)
export const EMOTION_LABEL = {
    happy: "행복",
    calm: "평온",
    tired: "피곤",
    sad: "슬픔",
    angry: "분노"
};