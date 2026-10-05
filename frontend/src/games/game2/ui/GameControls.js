import Phaser from "phaser";

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

        // -------------------------
        // 점프 버튼
        // 왼쪽 아래
        // -------------------------

        this.jumpButton = this.scene.add.rectangle(
            0,
            0,
            110,
            90,
            0x000000,
            0.45
        );

        this.jumpButton
            .setStrokeStyle(3, 0xffffff, 0.8)
            .setScrollFactor(0)
            .setDepth(100)
            .setInteractive();


        this.jumpText = this.scene.add.text(
            0,
            0,
            "JUMP",
            {
                fontFamily: "Mona",
                fontSize: "22px",
                color: "#ffffff",
                fontStyle: "bold"
            }
        );

        this.jumpText
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(101);


        // -------------------------
        // 슬라이드 버튼
        // 오른쪽 아래
        // -------------------------

        this.slideButton = this.scene.add.rectangle(
            0,
            0,
            110,
            90,
            0x000000,
            0.45
        );

        this.slideButton
            .setStrokeStyle(3, 0xffffff, 0.8)
            .setScrollFactor(0)
            .setDepth(100)
            .setInteractive();


        this.slideText = this.scene.add.text(
            0,
            0,
            "SLIDE",
            {
                fontFamily: "Mona",
                fontSize: "22px",
                color: "#ffffff",
                fontStyle: "bold"
            }
        );

        this.slideText
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(101);


        // -------------------------
        // 점프 버튼
        // -------------------------

        this.jumpButton.on(
            "pointerdown",
            () => {

                this.player.jump();

                this.jumpButton.setAlpha(0.7);
            }
        );

        this.jumpButton.on(
            "pointerup",
            () => {

                this.jumpButton.setAlpha(1);
            }
        );

        this.jumpButton.on(
            "pointerout",
            () => {

                this.jumpButton.setAlpha(1);
            }
        );


        // -------------------------
        // 슬라이드 버튼
        // -------------------------

        this.slideButton.on(
            "pointerdown",
            () => {

                this.player.slide();

                this.slideButton.setAlpha(0.7);
            }
        );

        this.slideButton.on(
            "pointerup",
            () => {

                this.slideButton.setAlpha(1);
            }
        );

        this.slideButton.on(
            "pointerout",
            () => {

                this.slideButton.setAlpha(1);
            }
        );
    }


    // -------------------------
    // 버튼 위치
    // -------------------------

    resize() {

        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        const bottomMargin = 70;


        // -------------------------
        // 점프
        // 왼쪽 아래
        // -------------------------

        const jumpX = 80;
        const jumpY = height - bottomMargin;

        this.jumpButton.setPosition(
            jumpX,
            jumpY
        );

        this.jumpText.setPosition(
            jumpX,
            jumpY
        );


        // -------------------------
        // 슬라이드
        // 오른쪽 아래
        // -------------------------

        const slideX = width - 80;
        const slideY = height - bottomMargin;

        this.slideButton.setPosition(
            slideX,
            slideY
        );

        this.slideText.setPosition(
            slideX,
            slideY
        );
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
        this.jumpText.destroy();

        this.slideButton.destroy();
        this.slideText.destroy();
    }
}