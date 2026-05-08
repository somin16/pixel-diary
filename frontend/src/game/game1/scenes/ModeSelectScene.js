import Phaser from 'phaser';
import { loadAllSprite } from '../preload/Preload';
import { createAllAnimations } from '../animations/Animations';

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

        // 현재 화면의 가로 세로 크기 받기
        const { width, height } = this.cameras.main;

        // 중앙 설정
        const centerX = width / 2;
        const centerY = height / 2;

        // 상단 타이틀(게임 모드 선택)
        this.add.text(centerX, centerY - 250, '게임 모드 선택', {
            fontFamily: 'Mona',
            fontSize: '40px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 일반모드 버튼
        this.createModeButton("basic", centerX - 85, centerY, () => {

                // 클릭 이벤트
                this.scene.start('GameScene');
            }
        );

        
        // 무한모드 버튼
        this.createModeButton("infinity", centerX + 85, centerY, () => {

                // 클릭 이벤트
                console.log("구현 X");
            }
        );
    }

    // 버튼 생성 함수 (모드타입, xy좌표, 클릭 이벤트 자동연결)
    createModeButton(modType, x, y, onClick) {

        // 선택지 버튼 크기
        const btnWidth = 150;
        const btnHeight = 250;

        // UI 다 담아둘 컨테이너
        const container = this.add.container(x, y);

        // 배경(원래라면 스프라이트로 이미지를 넣어서 구현하는게 맞지만, 
        // 코드로 구현하는 창도 크게 나쁘지 않아서 임시로 사용하겠습니다)
        const background = this.add.rectangle(0, 0, btnWidth, btnHeight, 0x222222, 0.8)
            .setStrokeStyle(3, 0xffffff);

        // 모드 이름
        let modName = this.add.text(0, -btnHeight / 2 + 40, "", {
            fontFamily: 'Mona',
            fontSize: '24px', 
            color: '#ffd700'
        }).setOrigin(0.5);

        // 모드 설명
        let modInfo = this.add.text(0, btnHeight / 2 - 50, "", {
            fontFamily: 'Mona',
            fontSize: '16px', 
            color: '#ffffff', 
            align: 'center',
            wordWrap: { width: btnWidth - 40 } 
        }).setOrigin(0.5);

        // 모드 이미지
        let modImageView = this.add.sprite(0, 0, "");
        modImageView.setScale(3);

        // 기본이면..
        if (modType == "basic") {

            // 모드 이름
            modName.setText("일반 모드");

            // 모드 설명
            modInfo.setText("기본적인 모드입니다!");

            // 모드 설명 이미지
            modImageView.setTexture("slime_move1");
            modImageView.play("slime_animation", true);
        }

        // 아니면..(무한모드)
        else {

            // 모드 이름
            modName.setText("무한 모드");

            // 모드 설명
            modInfo.setText("구현중..");

            // 모드 설명 이미지
            modImageView.setTexture("phalanx_move1");
            modImageView.play("phalanx_animation", true);
        }

        // 만든거 다 넣기
        container.add([background, modName, modInfo, modImageView]);

        // 컨테이너 전체를 클릭범위로 지정(setSize)
        container.setSize(btnWidth, btnHeight);
        container.setInteractive({ useHandCursor: true });

        // 클릭 이벤트 연결
        container.on('pointerdown', onClick);
    }
}