import Phaser from "phaser";

import { createCharacterSelectUI } from "../ui/CharacterSelect";
import { restartOnResize } from "../ui/ResizeRestart";

export default class CharacterSelectScene extends Phaser.Scene {

    constructor() {
        super("CharacterSelectScene");
    }

    create() {

        createCharacterSelectUI(this);

        // 화면 크기가 바뀌면 다시 그리기
        restartOnResize(this);

    }
}