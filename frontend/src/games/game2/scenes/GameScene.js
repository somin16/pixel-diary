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

        const groundHeight = 100;

        const ground = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height - groundHeight / 2,
            this.scale.width,
            groundHeight,
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
            groundHeight / 2 -
            this.player.body.height / 2;


        // =========================
        // 바닥 충돌
        // =========================

        this.physics.add.collider(
            this.player,
            this.ground
        );
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