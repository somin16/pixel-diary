import Phaser from "phaser";
import { createModeSelectUI } from "../ui/ModeSelect";
import { restartOnResize } from "../ui/ResizeRestart";

export default class ModeSelectScene extends Phaser.Scene {

    constructor() {
        super("ModeSelectScene");
    }

    create() {

        createModeSelectUI(this);

        // 화면 크기가 바뀌면 다시 그리기
        restartOnResize(this);

    }
}