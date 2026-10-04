import Phaser from "phaser";

import { createSettingsUI } from "../ui/Settings";
import { restartOnResize } from "../ui/ResizeRestart";

export default class SettingsScene extends Phaser.Scene {

    constructor() {
        super("SettingsScene");
    }

    create() {

        createSettingsUI(this);

        // 화면 크기가 바뀌면 다시 그리기
        restartOnResize(this);
    }
}