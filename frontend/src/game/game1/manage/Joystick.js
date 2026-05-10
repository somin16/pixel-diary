import Phaser from 'phaser';
import VirtualJoystick from 'phaser3-rex-plugins/plugins/virtualjoystick.js';

export function createJoystick(scene) {

    // 현재 화면의 가로 세로 크기 받기
    const { width, height } = scene.cameras.main;

    // VirtualJoystick: 페이저에서 지원하는 조이스틱 플러그인
    scene.joyStick = new VirtualJoystick(scene, {

        // 위치
        x: width / 2,                
        y: height / 1.33,              
        radius: 60, // 조이스틱 이동 반경               
            
        // 베이스 디자인(조이스틱 밑배경)
        base: scene.add.circle(0, 0, 80, 0x888888, 0.4), 
            
        // 손잡이 디자인(실제 조작되는 조이스틱)
        thumb: scene.add.circle(0, 0, 40, 0xcccccc, 0.8),
            
        // 8방향 이동
        dir: '8dir',
                         
        // 살짝 터치했을 땐 무시하는 민감도
        forceMin: 16,                
    });

    // 조이스틱을 화면 맨 위로(메뉴보단 아래여야 하기에 500은 넘지않게)
    // 조이스틱은 base와 thumb를 따로 지정해줘야함
    scene.joyStick.base.setDepth(100);
    scene.joyStick.thumb.setDepth(101);
}