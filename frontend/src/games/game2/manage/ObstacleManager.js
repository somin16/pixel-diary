import Phaser from "phaser";

import { OBSTACLE_TUNING } from "./MapConfig";   // 장애물별 조절표

// =====================================================
// 장애물 관리자
// 장애물을 일정 간격으로 만들고, 왼쪽으로 움직이고, 플레이어와 닿았는지 확인합니다.
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
const HIT_SIDE_SHRINK = 0.35;   // 몸의 좌우를 N%씩 뺌 (클수록 판정이 작아짐)
const HIT_TOP_SHRINK = 0.3;     // 머리 쪽을 N% 뺌
const HIT_FEET_RAISE = 3;       // 발바닥 쪽을 3 그림픽셀 올림 (클수록 점프 때 잘 피함)

// 장애물 이미지의 판정을 그림보다 작게 (투명 여백 때문에 억울하게 맞는 것 방지)
const OBSTACLE_SIDE_SHRINK = 0.15;   // 좌우를 15%씩 뺌
const OBSTACLE_TOP_SHRINK = 0.1;     // 위쪽을 10% 뺌

// 공중 장애물 설정 (그림 픽셀 단위)
const AIR_BOTTOM_UNITS = 18;     // 공중 장애물의 "아랫면"이 바닥에서 떠 있는 높이
const AIR_CHANCE = 0.4;          // 공중 장애물이 나올 확률 (0.4 = 40%)

// 슬라이드 중 플레이어 판정 높이 (발바닥 기준, 그림 픽셀)
// 반드시 AIR_BOTTOM_UNITS 보다 작아야 슬라이드로 피할 수 있음
const SLIDE_HIT_HEIGHT = 15;

// 지면 장애물 이미지 아래쪽의 투명 여백 (그림 픽셀). 떠 보이면 이 값을 키우세요
const GROUND_FOOT_PAD = 1;

// 장애물 크기 단위: 이 숫자가 "기본 크기(배경과 같은 픽셀 크기)"
// MapConfig의 scale이 3이면 기본, 2면 약 2/3, 1이면 약 1/3 크기
const OBSTACLE_SCALE_BASE = 3;

// 판정 영역을 눈으로 볼지 여부 (true = 초록: 플레이어 / 빨강: 장애물)
// 숫자를 조절할 때는 true로 두고 확인하세요. 커밋 전에는 false로!
const SHOW_HITBOX = false;

// 회전하는 공중 장애물 설정
const AIR_SPIN_MS = 1000;     // 한 바퀴 도는 시간(밀리초). 작을수록 빨리 돎
const AIR_SPIN_RAISE = 4;    // 회전 장애물은 모서리가 아래로 튀어나와서 그만큼 더 띄움 (그림 픽셀)

// 회전 공중 장애물(운석) 효과 설정
const METEOR_TRAIL = true;                    // 불꽃 꼬리를 붙일지 (false면 꼬리 없음)
const AIR_SPIN_SPEED_MULT = 1.3;              // 일반 장애물보다 이 배수만큼 빠르게 날아옴 (1 = 같은 속도)
const TRAIL_COLORS = [0xffd27a, 0xff8a3d];    // 꼬리 불꽃 색 (밝은 노랑, 주황 중 랜덤)
const TRAIL_TEXTURE = "fx_spark";

// 헬퍼 함수 하나 추가 (ObstacleManager.js 상단, ensureSparkTexture 근처)
function toTintArray(colors) {
    if (!colors) return TRAIL_COLORS;
    return colors.map(c =>
        typeof c === "string"
            ? Phaser.Display.Color.HexStringToColor(c).color   // "#ff6b3d" -> 0xff6b3d
            : c
    );
}

// 불꽃 한 점짜리 텍스처를 코드로 만든다 (처음 한 번만)
function ensureSparkTexture(scene) {
    if (scene.textures.exists(TRAIL_TEXTURE)) {
        return;
    }

    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 1, 1);
    g.generateTexture(TRAIL_TEXTURE, 1, 1);
    g.destroy();
}

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

        // 판정 영역을 그릴 도화지 (SHOW_HITBOX가 true일 때만)
        if (SHOW_HITBOX) {
            this.debugGfx = scene.add.graphics().setDepth(100);
        }

        // 첫 장애물 예약
        this.scheduleNext();
    }


    // ---------------------------------------------------
    // 진짜로 닿았는지 확인 (몸보다 작은 판정 영역 사용)
    // 닿았으면 true, 아니면 false
    // ---------------------------------------------------
    isReallyHit(obstacle) {
        const body = this.player.body;
        const ob = obstacle.body;
        const P = this.scene.pixel;

        const left = body.x + body.width * HIT_SIDE_SHRINK;
        const right = body.right - body.width * HIT_SIDE_SHRINK;
        const bottom = body.bottom - HIT_FEET_RAISE * P;

        // 슬라이드 중에는 판정 높이를 낮춰서 공중 장애물 밑으로 지나가게 함
        const top = this.player.isSliding
            ? bottom - SLIDE_HIT_HEIGHT * P
            : body.y + body.height * HIT_TOP_SHRINK;

        // (장애물마다 붙어 있는 값을 사용, 없으면 기본값)
        const side = obstacle.hitSide ?? OBSTACLE_SIDE_SHRINK;
        const topCut = obstacle.hitTop ?? OBSTACLE_TOP_SHRINK;
        const obLeft = ob.x + ob.width * side;
        const obRight = ob.right - ob.width * side;
        const obTop = ob.y + ob.height * topCut;

        return (
            right > obLeft &&
            left < obRight &&
            bottom > obTop &&
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
        const groundTop = scene.groundTopY;

        // 지금 단계의 장애물 이미지 (MapConfig.js 의 stage.obstacles)
        const keys = scene.map.obstacleKeys;

        let obstacle;

        if (keys?.ground || keys?.air) {
            // ---------- 이미지 장애물 ----------
            const useAir = keys.air && (!keys.ground || Math.random() < AIR_CHANCE);
            const spin = useAir && scene.map.spinAir;   // 이 맵의 공중 장애물은 회전?

            const imgKey = useAir ? keys.air : keys.ground;     // 이번에 나올 이미지 이름
            const tune = OBSTACLE_TUNING[imgKey] ?? {};         // 이 장애물의 조절값 (없으면 빈 값)

             const s = Math.max(
                1,
                Math.round(P * (tune.scale ?? OBSTACLE_SCALE_BASE) / OBSTACLE_SCALE_BASE)
            );

            obstacle = scene.add.image(scene.scale.width + 50, 0, imgKey)
                .setScale(s);   

            // 이 장애물만의 판정 축소값을 장애물에 붙여둠 (isReallyHit에서 꺼내 씀)
            obstacle.hitSide = tune.hitSide ?? OBSTACLE_SIDE_SHRINK;
            obstacle.hitTop = tune.hitTop ?? OBSTACLE_TOP_SHRINK;

                        if (spin) {
                // 회전은 "중심" 기준이어야 제자리에서 돌아감
                obstacle.setOrigin(0.5);
                obstacle.y = groundTop
                    - (AIR_BOTTOM_UNITS + AIR_SPIN_RAISE) * P
                    - obstacle.displayHeight / 2;

                // 왼쪽으로 굴러가듯 반시계 방향으로 계속 회전
                const tween = scene.tweens.add({
                    targets: obstacle,
                    angle: -360,
                    duration: AIR_SPIN_MS,
                    repeat: -1
                });

                // 운석처럼 더 빠르게 날아오게 (update에서 이 배수를 곱함)
                obstacle.speedMult = AIR_SPIN_SPEED_MULT;

                // 장애물을 따라다니며 불꽃을 뿌리는 꼬리
                let trail = null;

                if (METEOR_TRAIL) {
                    ensureSparkTexture(scene);

                    trail = scene.add.particles(0, 0, TRAIL_TEXTURE, {
                        follow: obstacle,                 // 장애물 위치에서 계속 생성
                        frequency: 30,                    // 30ms마다 (작을수록 꼬리가 진함)
                        lifespan: 450,                    // 불꽃이 남아 있는 시간(밀리초)
                        speedX: { min: 40, max: 160 },    // 오른쪽(뒤쪽)으로 흩어짐
                        speedY: { min: -30, max: 30 },
                        scale: { start: P * 2, end: 0 },  // 점점 작아짐
                        alpha: { start: 1, end: 0 },      // 점점 투명해짐
                        tint: toTintArray(scene.map.trailColors)  // 지금 단계의 색, 없으면 기본색
                    }).setDepth(-1);                      // 장애물 바로 뒤에 그려짐
                }

                // 장애물이 사라지면 회전과 꼬리도 정리
                obstacle.once("destroy", () => {
                    tween.stop();

                    if (!trail || !trail.active) {
                        return;   // 꼬리가 없거나 화면 종료로 이미 같이 지워진 경우
                    }

                    trail.stopFollow();   // 따라다니기 중단
                    trail.stop();         // 새 불꽃은 그만, 남은 불꽃은 자연스럽게 사라짐

                    // 남은 불꽃이 다 사라질 때쯤 파티클 자체를 지움
                    scene.time.delayedCall(500, () => {
                        if (trail.active) {
                            trail.destroy();
                        }
                    });
                });
            } else {
                // 일반 장애물: 아래 가운데 기준
                obstacle.setOrigin(0.5, 1);
                obstacle.y = useAir
                    ? groundTop - AIR_BOTTOM_UNITS * P
                    : groundTop + GROUND_FOOT_PAD * s;
            }
        } else {
            // ---------- 이미지가 없는 경우: 회색 사각형 ----------
            const w = Phaser.Math.Between(OBSTACLE_MIN_W, OBSTACLE_MAX_W) * P;
            const h = Phaser.Math.Between(OBSTACLE_MIN_H, OBSTACLE_MAX_H) * P;

            obstacle = scene.add.rectangle(
                scene.scale.width + 50,
                groundTop - h / 2,
                w,
                h,
                0x333333
            );

            obstacle.setStrokeStyle(P, 0xffffff);
        }

        // 그룹에 넣으면 물리 효과가 붙는다 (setScale 뒤에 넣어야 판정 크기가 맞음)
        this.group.add(obstacle);
        obstacle.body.setAllowGravity(false);
    }

        // ✅ 지금 판정 영역을 네모로 그려서 보여줌 (isReallyHit과 같은 계산)
    drawHitboxes() {
        const g = this.debugGfx;
        const P = this.scene.pixel;
        const pb = this.player.body;

        g.clear();

        // 플레이어 판정 (초록)
        const pl = pb.x + pb.width * HIT_SIDE_SHRINK;
        const pr = pb.right - pb.width * HIT_SIDE_SHRINK;
        const pBottom = pb.bottom - HIT_FEET_RAISE * P;
        const pTop = this.player.isSliding
            ? pBottom - SLIDE_HIT_HEIGHT * P
            : pb.y + pb.height * HIT_TOP_SHRINK;

        g.lineStyle(2, 0x00ff00).strokeRect(pl, pTop, pr - pl, pBottom - pTop);

        // 장애물 판정 (빨강)
        g.lineStyle(2, 0xff0000);
        this.group.getChildren().forEach((o) => {
            const b = o.body;
            const side = o.hitSide ?? OBSTACLE_SIDE_SHRINK;
            const topCut = o.hitTop ?? OBSTACLE_TOP_SHRINK;
            const l = b.x + b.width * side;
            const r = b.right - b.width * side;
            const t = b.y + b.height * topCut;

            g.strokeRect(l, t, r - l, b.bottom - t);
        });
    }

    // ---------------------------------------------------
    // 매 프레임: 장애물을 왼쪽으로 움직이고, 화면 밖으로 나가면 지운다
    // ---------------------------------------------------
    update() {
        const speed = this.scene.worldSpeed ?? this.scene.scrollSpeed;

        this.group.getChildren().forEach((obstacle) => {
            obstacle.body.setVelocityX(-speed * (obstacle.speedMult ?? 1));   // 회전 장애물은 더 빠르게

            if (obstacle.x < -100) {              // 화면 왼쪽 밖으로 나가면
                obstacle.destroy();               // 삭제
            }
        });
        if (SHOW_HITBOX) {  
            this.drawHitboxes();
        }
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