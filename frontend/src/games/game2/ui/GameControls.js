import Phaser from "phaser";
import { PIXEL, createPixelButton } from "./PixelUI";

// =====================================================
// 게임 화면의 점프 / 슬라이드 버튼
// 누르는 순간 바로 동작하도록 onPress를 씁니다. (손을 뗄 때까지 기다리면 반응이 느려서)
// =====================================================

export default class GameControls {

    constructor(scene, player) {

        this.scene = scene;
        this.player = player;

        this.createButtons();

        scene.scale.on(
            Phaser.Scale.Events.RESIZE,
            this.resize,
            this
        );

        this.resize();
    }


    // -------------------------
    // 버튼 생성
    // -------------------------

    createButtons() {

        // 점프 버튼 (왼쪽 아래)
        this.jumpButton = createPixelButton(this.scene, {
            x: 0,
            y: 0,
            w: 110,
            h: 90,
            label: "JUMP",
            fill: PIXEL.sun,
            fontSize: 22,
            depth: 100,
            onPress: () => this.player.jump()
        });

        // 슬라이드 버튼 (오른쪽 아래)
        this.slideButton = createPixelButton(this.scene, {
            x: 0,
            y: 0,
            w: 110,
            h: 90,
            label: "SLIDE",
            fill: PIXEL.mint,
            fontSize: 22,
            depth: 100,
            onPress: () => this.player.slide()
        });

        this.jumpButton.setScrollFactor(0);
        this.slideButton.setScrollFactor(0);
    }


    // -------------------------
    // 버튼 위치
    // -------------------------

    resize() {

        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        const bottomMargin = 70;

        // 점프: 왼쪽 아래
        this.jumpButton.moveTo(80, height - bottomMargin);

        // 슬라이드: 오른쪽 아래
        this.slideButton.moveTo(width - 80, height - bottomMargin);
    }


    // -------------------------
    // 정리
    // -------------------------

    destroy() {

        this.scene.scale.off(
            Phaser.Scale.Events.RESIZE,
            this.resize,
            this
        );

        this.jumpButton.destroy();
        this.slideButton.destroy();
    }
}