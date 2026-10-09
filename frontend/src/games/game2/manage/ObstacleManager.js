import Phaser from "phaser";

// =====================================================
// 장애물 관리자
// 장애물을 일정 간격으로 만들고, 왼쪽으로 움직이고, 플레이어와 닿았는지 확인합니다.
// 지금은 장애물이 "회색 사각형"입니다. (나중에 이미지로 교체 예정)
//
// 크기 숫자는 "그림 픽셀" 단위입니다. 실제 크기 = 숫자 × 픽셀 배율(scene.pixel)
// → 배경, 캐릭터와 픽셀 크기가 항상 똑같아집니다.
// =====================================================


// ---------- 숫자만 바꿔서 난이도를 조절하는 곳 ----------

// 장애물 크기 (작을수록 피하기 쉬움)
const OBSTACLE_MIN_W = 9;
const OBSTACLE_MAX_W = 13;
const OBSTACLE_MIN_H = 11;
const OBSTACLE_MAX_H = 17;

// 플레이어 피격 판정을 몸보다 작게 만드는 값
// (캐릭터 그림에는 투명한 여백이 있어서, 몸 전체로 판정하면 억울하게 맞음)
const HIT_SIDE_SHRINK = 0.25;   // 몸의 좌우를 25%씩 뺌 (클수록 판정이 작아짐)
const HIT_TOP_SHRINK = 0.1;     // 머리 쪽을 10% 뺌
const HIT_FEET_RAISE = 3;       // 발바닥 쪽을 3 그림픽셀 올림 (클수록 점프 때 잘 피함)


export default class ObstacleManager {

    // scene  : 게임 화면 (GameScene)
    // player : 플레이어
    // onHit  : 플레이어가 장애물에 닿았을 때 실행할 함수
    constructor(scene, player, onHit) {
        this.scene = scene;
        this.player = player;
        this.onHit = onHit;

        // 장애물들을 모아두는 그룹 (중력 영향 없음)
        this.group = scene.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        // 플레이어와 장애물이 겹치는지 확인
        // 1) 먼저 두 번째 함수(isReallyHit)가 "진짜 닿았는지" 작은 판정으로 다시 확인하고
        // 2) 진짜 닿았을 때만 첫 번째 함수가 실행됨
        scene.physics.add.overlap(
            player,
            this.group,
            (p, obstacle) => {
                obstacle.destroy();   // 닿은 장애물은 사라짐
                this.onHit();         // 피격 처리 (GameScene에서 정의)
            },
            (p, obstacle) => this.isReallyHit(obstacle)
        );

        // 첫 장애물 예약
        this.scheduleNext();
    }


    // ---------------------------------------------------
    // 진짜로 닿았는지 확인 (몸보다 작은 판정 영역 사용)
    // 닿았으면 true, 아니면 false
    // ---------------------------------------------------
    isReallyHit(obstacle) {
        const body = this.player.body;       // 플레이어 몸
        const ob = obstacle.body;            // 장애물 몸

        // 줄인 플레이어 판정 영역 (왼쪽, 오른쪽, 위, 아래)
        const left = body.x + body.width * HIT_SIDE_SHRINK;
        const right = body.right - body.width * HIT_SIDE_SHRINK;
        const top = body.y + body.height * HIT_TOP_SHRINK;
        const bottom = body.bottom - HIT_FEET_RAISE * this.scene.pixel;

        // 두 사각형이 겹치는지 확인
        return (
            right > ob.x &&
            left < ob.right &&
            bottom > ob.y &&
            top < ob.bottom
        );
    }


    // ---------------------------------------------------
    // 다음 장애물이 나올 시간을 정한다
    // 게임이 빨라질수록 간격이 짧아집니다.
    // ---------------------------------------------------
    scheduleNext() {
        // 시작 속도 ÷ 지금 속도 (빨라지면 1보다 작아짐)
        const speedRate = this.scene.baseSpeed / this.scene.scrollSpeed;

        // 1.2초 ~ 2.2초 사이 랜덤 간격 × 속도 비율
        const delay = Phaser.Math.Between(1200, 2200) * speedRate;

        // delay 시간이 지나면 장애물을 만들고, 또 다음 장애물을 예약
        this.timer = this.scene.time.delayedCall(delay, () => {
            this.spawn();
            this.scheduleNext();
        });
    }


    // ---------------------------------------------------
    // 장애물 하나 만들기
    // ---------------------------------------------------
    spawn() {
        const scene = this.scene;
        const P = scene.pixel;   // 픽셀 배율

        // 장애물 크기는 랜덤 (그림 픽셀 × 배율)
        const w = Phaser.Math.Between(OBSTACLE_MIN_W, OBSTACLE_MAX_W) * P;
        const h = Phaser.Math.Between(OBSTACLE_MIN_H, OBSTACLE_MAX_H) * P;

        // 바닥 윗면의 y 좌표
        const groundTop = scene.groundTopY;

        // 화면 오른쪽 바깥에서 시작하는 사각형
        const rect = scene.add.rectangle(
            scene.scale.width + 50,   // x: 화면 오른쪽 밖
            groundTop - h / 2,        // y: 바닥 위에 서 있도록
            w,
            h,
            0x333333                  // 색: 진한 회색
        );

        rect.setStrokeStyle(P, 0xffffff);   // 흰 테두리 (그림 픽셀 1칸 두께)

        // 그룹에 넣으면 물리 효과가 붙는다
        this.group.add(rect);
        rect.body.setAllowGravity(false);
    }


    // ---------------------------------------------------
    // 매 프레임: 장애물을 왼쪽으로 움직이고, 화면 밖으로 나가면 지운다
    // ---------------------------------------------------
    update() {
        const speed = this.scene.worldSpeed ?? this.scene.scrollSpeed;

        this.group.getChildren().forEach((obstacle) => {
            obstacle.body.setVelocityX(-speed);   // 왼쪽으로 이동

            if (obstacle.x < -100) {              // 화면 왼쪽 밖으로 나가면
                obstacle.destroy();               // 삭제
            }
        });
    }


    // ---------------------------------------------------
    // 정리 (게임을 나갈 때 호출)
    // 화면이 끝날 때 Phaser가 장애물과 그룹을 알아서 지워줍니다.
    // 여기서 또 지우려고 하면 "이미 없는 걸 지우는" 오류가 나서
    // 타이머만 멈추고 나머지는 건드리지 않습니다.
    // ---------------------------------------------------
    destroy() {
        this.timer?.remove();
        this.group = null;
    }
}