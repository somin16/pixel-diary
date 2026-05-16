import Phaser from 'phaser';
import { loadAllSprite } from '../preload/Preload';
import { createAllAnimations } from '../animations/Animations';
import { createModeSelectUI } from '../ui/ModeSelect';

export default class ModeSelectScene extends Phaser.Scene {
    constructor() {
        super('ModeSelectScene'); 
    }

    // perload: 이미지 불러오기
    preload() {
    
        // 모든 이미지 불러오기(preload/Preload.js)
        loadAllSprite(this);
    }

    create() {

        // 모든 애니메이션 불러오기(aniations/Aniations.js)
        createAllAnimations(this);

        // 모드선택 버튼 UI 생성(ui/ModeSelect.js)
        createModeSelectUI(this);
    }
}