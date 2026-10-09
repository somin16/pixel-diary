// =====================================================
// 게임 화면 위의 글자들 (점수 / 체력 / 시간)
// GameScene이 길어지지 않게 따로 뺀 파일입니다.
// =====================================================

// 초(숫자)를 "분:초" 글자로 바꾸기 (예: 125 → "2:05")
function formatTime(totalSeconds) {
    const sec = Math.max(0, Math.floor(totalSeconds));
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

// 글자 하나를 만드는 도우미 (글꼴, 크기, 색을 한 곳에서 관리)
function makeText(scene, x, y, size, color) {
    return scene.add.text(x, y, "", {
        fontFamily: "Mona",
        fontSize: `${size}px`,
        color,
        fontStyle: "bold"
    }).setDepth(100);
}

export default class GameHud {

    // scene : 게임 화면
    // cfg   : 모드 규칙표 (체력 사용 여부, 클리어 시간 등)
    constructor(scene, cfg) {
        this.scene = scene;
        this.cfg = cfg;

        this.scoreText = makeText(scene, 20, 20, 24, "#ffffff");   // 왼쪽 위: 점수
        this.hpText = makeText(scene, 20, 52, 22, "#ff8a8a");      // 그 아래: 체력
        this.timeText = makeText(scene, scene.scale.width / 2, 20, 24, "#ffffff")
            .setOrigin(0.5, 0);                                    // 위쪽 가운데: 시간
    }

    // 맵 단계가 바뀔 때마다 글자색/외곽선을 맞춘다
    applyStyle(style) {
        if (!style) {
            return;
        }

        [this.scoreText, this.timeText].forEach((t) => {
            t.setColor(style.text);
            t.setStroke(style.outline, 5);
        });

        this.hpText.setColor(style.hp);
        this.hpText.setStroke(style.outline, 5);
    }

    // 점수 글자 바꾸기
    setScore(score) {
        this.scoreText.setText(`SCORE : ${score}`);
    }

    // 체력 글자 바꾸기 (체력을 안 쓰는 모드는 빈칸)
    setHp(hp, maxHp) {
        this.hpText.setText(this.cfg.useHp ? `HP : ${hp} / ${maxHp}` : "");
    }

    // 시간 글자 바꾸기
    // 데일리 : "남은 시간 2:59" / 무한 : "경과 0:45"
    setTime(seconds) {
        const clear = this.cfg.clearSeconds;

        this.timeText.setText(
            clear > 0
                ? `남은 시간 ${formatTime(clear - seconds)}`
                : `경과 ${formatTime(seconds)}`
        );

        // 화면 크기가 바뀌어도 항상 가운데
        this.timeText.setX(this.scene.scale.width / 2);
    }
}