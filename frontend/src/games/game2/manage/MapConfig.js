// =====================================================
// 맵(배경) 설정표
// 감정(happy, calm, sad, angry)마다 어떤 이미지를 어떤 순서로 깔지 적어둔 파일입니다.
//
// - stages : 맵 "단계". 순서대로 바뀝니다. (angry: 1단계 night → 2단계 day)
// - layers : 한 단계 안에 겹쳐 놓는 이미지들. 위에 적을수록 "뒤쪽"에 그려집니다.
// - speed  : 이미지가 움직이는 빠르기. 1 = 바닥과 같은 속도, 숫자가 작을수록 천천히(멀리 있는 느낌)
// - front  : true면 캐릭터보다 "앞"에 그려집니다 (비, 나뭇잎 같은 것)
// =====================================================

const BASE = "/assets/game2/maps/";   // 맵 이미지가 들어있는 폴더 (public 폴더 기준)

// 이미지 한 장 설정을 만드는 도우미
// path  : maps 폴더 안의 파일 경로 (".png"는 빼고 적기)
// speed : 움직이는 속도 비율
// front : 캐릭터 앞에 그릴지 여부
function layer(path, speed, front = false) {
    return {
        key: path.split("/").pop(),      // 파일 이름이 곧 이미지 이름표(key)
        path: `${BASE}${path}.png`,      // 실제 파일 위치
        speed,
        front
    };
}

export const MAPS = {

    // ---------- 분노: 밤(화남) → 낮(화가 풀림) ----------
    angry: {
        stages: [
            {   // 1단계: night
                layers: [
                    layer("angry/night/angry_night_background", 0.05),
                    layer("angry/night/angry_night_mountain", 0.3),
                    layer("angry/night/angry_night_road", 1)
                ]
            },
            {   // 2단계: day
                layers: [
                    layer("angry/day/angry_day_background", 0.05),
                    layer("angry/day/angry_day_cloude_1", 0.10),
                    layer("angry/day/angry_day_cloude_2", 0.14),
                    layer("angry/day/angry_day_cloude_3", 0.18),
                    layer("angry/day/angry_day_cloude_4", 0.22),
                    layer("angry/day/angry_day_cloude_5", 0.26),
                    layer("angry/day/angry_day_mountain", 0.3),
                    layer("angry/day/angry_day_road", 1)
                ]
            }
        ]
    },

    // ---------- 평온: 한 단계 ----------
    calm: {
        stages: [
            {
                layers: [
                    layer("calm/calm_background", 0.05),
                    layer("calm/calm_flower_grass", 0.6),
                    layer("calm/calm_grass_road", 1)
                ]
            }
        ]
    },

    // ---------- 행복: 한 단계 ----------
    happy: {
        stages: [
            {
                layers: [
                    layer("happy/happy_background", 0.05),
                    layer("happy/happy_tree_grass", 0.6),
                    layer("happy/happy_road", 1),
                    layer("happy/happy_leaves", 0.5, true)   // 나뭇잎은 캐릭터 앞으로
                ]
            }
        ]
    },

    // ---------- 슬픔: 밤(비) → 낮(배) ----------
    sad: {
        stages: [
            {   // 1단계: night (비가 내림)
                layers: [
                    layer("sad/night/sad_night_background", 0.05),
                    layer("sad/night/sad_night_road", 1),
                    layer("sad/night/sad_night_rain", 0.3, true)   // 비는 캐릭터 앞으로
                ]
            },
            {   // 2단계: day (배가 보임)
                layers: [
                    layer("sad/day/sad_day_background", 0.05),
                    layer("sad/day/sad_day_boat", 0.2),
                    layer("sad/day/sad_day_road", 1)
                ]
            }
        ]
    }

    // tired(피곤)는 에셋이 아직 없어서 여기에 없습니다.
    // 에셋이 생기면 위와 똑같은 모양으로 tired: { ... } 를 추가하면 됩니다.
};

// 화면에 보여줄 감정 이름 (영어 → 한글)
export const EMOTION_LABEL = {
    happy: "행복",
    calm: "평온",
    tired: "피곤",
    sad: "슬픔",
    angry: "분노"
};
