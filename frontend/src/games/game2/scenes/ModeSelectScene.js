import Phaser from "phaser";
import { createModeSelectUI, loadModeSelectAssets } from "../ui/ModeSelect";  
import { restartOnResize } from "../ui/ResizeRestart";

export default class ModeSelectScene extends Phaser.Scene {

    constructor() {
        super("ModeSelectScene");
    }

    // 화면이 만들어지기 전에 이미지를 먼저 불러옴
    preload() {
        loadModeSelectAssets(this);
    }

    create() {

        createModeSelectUI(this);

        // 화면 크기가 바뀌면 다시 그리기
        restartOnResize(this);

    }
}