import Phaser from "phaser";

import { loadAllSprite } from "../preload/Preload";
import { createAllAnimations } from "../animations/Animations";
import Player from "../player/Player";
import GameControls from "../ui/GameControls";

export default class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }


    // -------------------------
    // 에셋 불러오기
    // -------------------------

    preload() {

        loadAllSprite(this);
    }


    // -------------------------
    // 게임 시작
    // -------------------------

    create() {

        // 애니메이션 생성
        createAllAnimations(this);


        // -------------------------
        // 바닥 생성
        // -------------------------

        const groundHeight = 100;

        const ground = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height - groundHeight / 2,
            this.scale.width,
            groundHeight,
            0x000000,
            0
        );


        // 바닥에 물리 적용
        this.physics.add.existing(
            ground,
            true
        );

        this.ground = ground;


        // -------------------------
        // 플레이어 생성
        // -------------------------

        this.player = new Player(
            this,
            150,
            this.scale.height - groundHeight - 70
        );


        // -------------------------
        // 플레이어와 바닥 충돌
        // -------------------------

        this.physics.add.collider(
            this.player,
            this.ground
        );


        // -------------------------
        // 모바일 조작 버튼
        // -------------------------

        this.controls = new GameControls(
            this,
            this.player
        );
    }


    // -------------------------
    // 매 프레임 실행
    // -------------------------

    update() {

        if (!this.player) {
            return;
        }

        this.player.updatePlayer();
    }


    // -------------------------
    // Scene 종료
    // -------------------------

    shutdown() {

        if (this.controls) {

            this.controls.destroy();

            this.controls = null;
        }
    }
}