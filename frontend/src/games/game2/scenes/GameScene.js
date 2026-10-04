import Phaser from "phaser";

import { loadAllSprite } from "../preload/Preload";
import { createAllAnimations } from "../animations/Animations";
import Player from "../player/Player";

export default class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }


    // =========================
    // 게임 모드
    // =========================

    init(data) {

        this.gameMode = data.gameMode;

    }


    // =========================
    // 이미지 불러오기
    // =========================

    preload() {

        loadAllSprite(this);

    }


    // =========================
    // 게임 시작
    // =========================

    create() {

        createAllAnimations(this);


        // =========================
        // 바닥
        // =========================

        this.groundHeight = 100;

        const ground = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height - this.groundHeight / 2,
            this.scale.width,
            this.groundHeight,
            0x444444
        );

        this.physics.add.existing(ground, true);

        this.ground = ground;


        // =========================
        // 플레이어 생성
        // =========================

        this.player = new Player(
            this,
            150,
            100
        );


        // =========================
        // 플레이어를 바닥 위에 정확하게 배치
        // 실제 Physics Body 기준
        // =========================

        this.player.y =
            ground.y -
            this.groundHeight / 2 -
            this.player.body.height / 2;


        // =========================
        // 바닥 충돌
        // =========================

        this.physics.add.collider(
            this.player,
            this.ground
        );


        // =========================
        // 화면 크기가 바뀌면 바닥도 맞추기
        // (가로 전환 등)
        // =========================

        this.scale.on("resize", this.resizeGround, this);

        // 씬이 끝나면 이벤트 해제
        this.events.once("shutdown", () => {
            this.scale.off("resize", this.resizeGround, this);
        });


        // 시작할 때도 한 번 맞춰줌
        this.resizeGround(this.scale.gameSize);
    }


    // =========================
    // 바닥 크기/위치 다시 맞추기
    // =========================

    resizeGround(gameSize) {

        if (!this.ground || !this.ground.body) {
            return;
        }

        const w = gameSize.width;
        const h = gameSize.height;

        this.ground.setPosition(
            w / 2,
            h - this.groundHeight / 2
        );

        this.ground.setSize(w, this.groundHeight);

        // 물리 바디도 새 크기로 갱신
        this.ground.body.updateFromGameObject();
    }


    // =========================
    // 매 프레임
    // =========================

    update() {

        if (!this.player) {
            return;
        }

        this.player.updatePlayer();

    }
}