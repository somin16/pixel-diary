import Phaser from "phaser";
import { MAPS } from "./MapConfig";

// =====================================================
// 맵 관리자
// 배경 이미지를 겹쳐서 깔고, 게임 속도에 맞춰 왼쪽으로 흘려보내는 역할입니다.
//
// 픽셀 게임이라 확대 배율은 항상 "정수"(1, 2, 3...)로만 씁니다.
// 소수점 배율을 쓰면 픽셀이 뭉개져서 저화질 그림처럼 보입니다.
// =====================================================

// 맵 이미지 한 장의 원래 세로 크기 (240 x 135 이미지)
export const ART_HEIGHT = 135;

// 화면 높이에 맞는 "정수" 확대 배율
// 배경, 캐릭터, 장애물이 전부 이 배율을 같이 써서 픽셀 크기가 똑같아집니다.
export function getPixelScale(screenHeight) {
    return Math.max(1, Math.round(screenHeight / ART_HEIGHT));
}

export default class MapManager {

    // scene   : 게임 화면 (GameScene)
    // emotion : 감정 이름 ("angry", "happy" 등)
    constructor(scene, emotion) {
        this.scene = scene;
        this.config = MAPS[emotion];   // 이 감정의 맵 설정
        this.layers = [];              // 지금 화면에 깔린 이미지들
        this.stageIndex = 0;           // 지금 몇 번째 단계인지 (0부터 시작)

        // 1단계 이미지를 깐다
        this.buildStage(0, false);

        // 화면 크기가 바뀌면(가로 전환 등) 이미지 크기도 맞춘다
        scene.scale.on("resize", this.onResize, this);
    }

    // 이 맵의 전체 단계 수 (angry는 2, happy는 1)
    get stageCount() {
        return this.config.stages.length;
    }

    // 정수 확대 배율
    get tileScale() {
        return getPixelScale(this.scene.scale.height);
    }

    // 도로(바닥) 두께 (그림 픽셀 단위)
    get groundUnits() {
        return this.config.ground ?? 24;
    }

    // 지금 단계의 글자색 설정
    get hudStyle() {
        return this.config.stages[this.stageIndex].hud;
    }

    // 그림이 화면에서 시작하는 y (위쪽 가장자리)
    // 화면이 그림보다 크면 남는 공간을 위아래로 똑같이 나눔 (정수로 내림해서 픽셀이 안 흔들림)
    // 화면이 그림보다 작으면(위가 잘리는 경우) 지금처럼 아래에 붙임
    get artTop() {
        const h = this.scene.scale.height;
        const artH = ART_HEIGHT * this.tileScale;

        return h >= artH ? Math.floor((h - artH) / 2) : h - artH;
    }

    // 그림이 끝나는 y (도로 아랫면). 바닥 높이는 이 값을 기준으로 계산함
    get artBottom() {
        return this.artTop + ART_HEIGHT * this.tileScale;
    }

    // 지금 단계의 장애물 이미지 { ground, air }
    get obstacleKeys() {
        return this.config.stages[this.stageIndex].obstacles;
    }

    // 지금 단계의 캐릭터 시트 이름표 ("" 또는 "_night")
    get playerSkin() {
        return this.config.stages[this.stageIndex].playerSkin ?? "";
    }
    
    // 지금 단계의 운석 꼬리 색 목록 (없으면 undefined)
    get trailColors() {
        return this.config.stages[this.stageIndex].trailColors;
    }

        // 이 맵의 공중 장애물이 빙글빙글 도는가
    get spinAir() {
        return this.config.spinAir ?? false;
    }

    // ---------------------------------------------------
    // 정수 배율로 미리 키운 텍스처를 만든다 (픽셀이 뭉개지지 않게 직접 확대)
    // gap이 있으면 오른쪽에 투명한 빈 공간도 같이 붙인다
    // ---------------------------------------------------
    getScaledKey(key, gap, scale) {
        const k = `${key}_g${gap}_x${scale}`;

        if (!this.scene.textures.exists(k)) {
            const src = this.scene.textures.get(key).getSourceImage();
            const tex = this.scene.textures.createCanvas(
                k,
                (src.width + gap) * scale,
                src.height * scale
            );

            const ctx = tex.getContext();
            ctx.imageSmoothingEnabled = false;   // 핵심: 뭉개지 않고 확대
            ctx.drawImage(src, 0, 0, src.width * scale, src.height * scale);

            tex.refresh();
            tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
        }

        return k;
    }

    // ---------------------------------------------------
    // 한 단계의 이미지들을 화면에 깐다
    // index : 몇 번째 단계
    // fade  : true면 부드럽게 나타남 (night → day 전환 때 사용)
    // ---------------------------------------------------
    buildStage(index, fade) {

        const oldLayers = this.layers;   // 이전 단계 이미지들 (나중에 지움)
        this.layers = [];
        this.stageIndex = index;

        const stage = this.config.stages[index];
        const { width, height } = this.scene.scale;
        const scale = this.tileScale;
        const artH = ART_HEIGHT * scale;   // 그림 한 장의 화면 높이

        // 그림 위쪽이 남으면 하늘색으로 채우고, 글자색도 이 단계에 맞춘다
        this.scene.cameras.main.setBackgroundColor(stage.sky ?? "#000000");
        this.scene.hud?.applyStyle(stage.hud);

        // 밤/낮에 맞는 캐릭터 시트로 바꾼다 (맨 처음엔 캐릭터가 아직 없어서 ?. 로 건너뜀)
        this.scene.player?.setSkin(stage.playerSkin ?? "");
        stage.layers.forEach((info, i) => {

            const gap = info.gap
                ? Math.max(info.gap, Math.ceil(width / scale))
                : 0;
            const texKey = this.getScaledKey(info.key, gap, scale);

             //  화면 맨 아래 대신 계산한 그림 위치(artTop) 사용
            const tile = this.scene.add.tileSprite(
                0,
                this.artTop,   // height - artH → this.artTop
                width,
                artH,
                texKey
            )
                .setOrigin(0)
                .setDepth(info.front ? 50 : -100 + i);

            // 이 이미지가 얼마나 빨리 움직일지 기억해 둔다
            tile.speedRate = info.speed;

            // 소수점까지 포함한 실제 이동량 (화면에는 정수로 반올림해서 보여줌)
            tile.offsetX = 0;

            // 전환할 때는 투명 → 불투명으로 서서히 나타나게 한다
            if (fade) {
                tile.setAlpha(0);
                this.scene.tweens.add({
                    targets: tile,
                    alpha: 1,
                    duration: 1500   // 1.5초 동안
                });
            }

            this.layers.push(tile);
        });

        // 이전 단계 이미지 정리
        if (fade) {
            // 새 이미지가 다 나타난 뒤(1.5초 후)에 이전 이미지를 지운다
            this.scene.time.delayedCall(1500, () => {
                oldLayers.forEach((tile) => tile.destroy());
            });
        } else {
            oldLayers.forEach((tile) => tile.destroy());
        }
    }

    // 단계를 바꾼다 (같은 단계면 아무것도 안 함)
    setStage(index) {
        if (index === this.stageIndex) {
            return;
        }
        this.buildStage(index, true);
    }

    // ---------------------------------------------------
    // 매 프레임 호출: 이미지를 왼쪽으로 흘려보낸다
    // delta       : 지난 프레임 이후 흐른 시간(밀리초)
    // scrollSpeed : 지금 화면에서 움직이는 속도(px/초)
    // ---------------------------------------------------
    update(delta, scrollSpeed) {
        const scale = this.tileScale;

        this.layers.forEach((tile) => {
            tile.offsetX += (scrollSpeed * tile.speedRate * delta) / 1000;
            tile.tilePositionX = Math.round(tile.offsetX / scale) * scale;
            });
    }

    // 화면 크기가 바뀌면 새 배율로 단계를 다시 깐다
    onResize() {
        this.buildStage(this.stageIndex, false);
    }

    // 정리 (게임을 나갈 때 호출)
    destroy() {
        this.scene.scale.off("resize", this.onResize, this);
        this.layers.forEach((tile) => tile.destroy());
        this.layers = [];
    }
}