import { MAPS } from "./MapConfig";

// =====================================================
// 맵 관리자
// 배경 이미지를 겹쳐서 깔고, 게임 속도에 맞춰 왼쪽으로 흘려보내는 역할입니다.
// =====================================================

// 맵 이미지 한 장의 원래 세로 크기 (240 x 135 이미지)
const IMAGE_HEIGHT = 135;

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

    // 이미지를 화면 높이에 딱 맞추기 위한 확대 비율
    get tileScale() {
        return this.scene.scale.height / IMAGE_HEIGHT;
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

        const { width, height } = this.scene.scale;
        const scale = this.tileScale;

        this.config.stages[index].layers.forEach((info, i) => {

            // tileSprite = 좌우로 계속 이어 붙는 이미지
            const tile = this.scene.add.tileSprite(0, 0, width, height, info.key)
                .setOrigin(0)
                .setTileScale(scale, scale)
                // 깊이(depth): 숫자가 작을수록 뒤에 그려짐
                // front가 true면 캐릭터 앞(50), 아니면 맨 뒤쪽(-100부터)
                .setDepth(info.front ? 50 : -100 + i);

            // 이 이미지가 얼마나 빨리 움직일지 기억해 둔다
            tile.speedRate = info.speed;

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
    // scrollSpeed : 지금 게임 속도
    // ---------------------------------------------------
    update(delta, scrollSpeed) {
        const scale = this.tileScale;

        this.layers.forEach((tile) => {
            // (속도 × 이미지별 비율 × 시간) 만큼 이미지를 옆으로 민다
            tile.tilePositionX +=
                (scrollSpeed * tile.speedRate * delta) / 1000 / scale;
        });
    }

    // 화면 크기가 바뀌었을 때 이미지 크기 다시 맞추기
    onResize(gameSize) {
        const scale = gameSize.height / IMAGE_HEIGHT;

        this.layers.forEach((tile) => {
            tile.setSize(gameSize.width, gameSize.height);
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
