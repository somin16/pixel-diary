import Phaser from "phaser";

import { loadAllSprite } from "../preload/Preload";
import { createAllAnimations } from "../animations/Animations";
import Player from "../player/Player";

export default class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    preload() {
        loadAllSprite(this);
    }

    create() {

        createAllAnimations(this);

        // 현재 게임 화면 크기에 맞춰 플레이어 위치 지정
        const startX = this.scale.width * 0.2;
        const startY = this.scale.height * 0.7;

        this.player = new Player(
            this,
            startX,
            startY
        );
    }

    update() {

        this.player.playerMove();
    }
}