import Phaser from 'phaser';
import { loadAllSprite } from '../preload/Preload';
import { createAllAnimations } from '../animations/Animations';
import { createModeSelectUI } from '../ui/ModeSelect';

// zuStand 함수 불러오기
import { useGetCoinStore } from "../../../store/useCoinStore";

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

        // 게임 시작할때 한번만 미리 코인 값 가져오기
        useGetCoinStore.getState().startGetCoin();

        // 모든 애니메이션 불러오기(aniations/Aniations.js)
        createAllAnimations(this);

        // 모드선택 버튼 UI 생성(ui/ModeSelect.js)
        createModeSelectUI(this);
    }
}