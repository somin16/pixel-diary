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

    // ---------------------------------------------------
    // 이미지 오른쪽에 투명한 빈 공간을 붙인 새 이미지를 만든다
    // → 같은 물체(화산, 배)가 늦게 반복되게 하려는 용도
    // ---------------------------------------------------
    getPaddedKey(key, gap) {
        const padKey = `${key}_gap${gap}`;

        if (!this.scene.textures.exists(padKey)) {
            const src = this.scene.textures.get(key).getSourceImage();
            const pad = this.scene.textures.createCanvas(
                padKey,
                src.width + gap,
                src.height
            );

            pad.draw(0, 0, src);
            pad.setFilter(Phaser.Textures.FilterMode.NEAREST);   // 픽셀 뭉개짐 방지
        }

        return padKey;
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

        stage.layers.forEach((info, i) => {

            // gap 숫자는 "최소 간격". 화면 폭보다 좁으면 화면 폭만큼으로 자동 확장한다
            // → 화면에 같은 물체가 한 번에 한 개만 보이게 함
            const texKey = info.gap
                ? this.getPaddedKey(info.key, Math.max(info.gap, Math.ceil(width / scale)))
                : info.key;

            // 화면 "아래"에 붙여서 깐다 (세로로 반복되지 않게 높이는 그림 한 장만큼)
            // 깊이(depth): 숫자가 작을수록 뒤에 그려짐
            // front가 true면 캐릭터 앞(50), 아니면 맨 뒤쪽(-100부터)
            const tile = this.scene.add.tileSprite(0, height - artH, width, artH, texKey)
                .setOrigin(0)
                .setTileScale(scale, scale)
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
            // (속도 × 이미지별 비율 × 시간) 만큼 이미지를 옆으로 민다
            tile.offsetX += (scrollSpeed * tile.speedRate * delta) / 1000 / scale;

            // 그림 픽셀 "정수" 단위로만 움직여서 픽셀이 흔들리지 않게 한다
            tile.tilePositionX = Math.round(tile.offsetX);
        });
    }

    // 화면 크기가 바뀌었을 때 이미지 크기 다시 맞추기
    onResize(gameSize) {
        const scale = getPixelScale(gameSize.height);
        const artH = ART_HEIGHT * scale;

        this.layers.forEach((tile) => {
            tile.setSize(gameSize.width, artH);
            tile.setY(gameSize.height - artH);
            tile.setTileScale(scale, scale);
        });
    }

    // 정리 (게임을 나갈 때 호출)
    destroy() {
        this.scene.scale.off("resize", this.onResize, this);
        this.layers.forEach((tile) => tile.destroy());
        this.layers = [];
    }
}