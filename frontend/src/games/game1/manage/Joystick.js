import Phaser from 'phaser';
import VirtualJoystick from 'phaser3-rex-plugins/plugins/virtualjoystick.js';

export function createJoystick(scene) {

    // VirtualJoystick: 페이저에서 지원하는 조이스틱 플러그인
    const joystick = new VirtualJoystick(scene, {

        // 위치(이제 위치는 별로 상관없음)
        x: 0,          
        y: 0,             
        radius: 60, // 조이스틱 이동 반경               
            
        // 베이스 디자인(조이스틱 밑배경)
        base: scene.add.circle(0, 0, 80, 0x6e6e6e, 0.2), 
            
        // 손잡이 디자인(실제 조작되는 조이스틱)
        thumb: scene.add.circle(0, 0, 40, 0x6e6e6e, 0.35),
            
        // 8방향 이동
        dir: '8dir',
                         
        // 살짝 터치했을 땐 무시하는 민감도
        forceMin: 16,                
    });

    // 기존 코드에서도 사용이 가능하도록 scene.joystick을 이걸로 지정
    scene.joystick = joystick;

    // 조이스틱을 화면 맨 위로(메뉴보단 아래여야 하기에 500은 넘지않게)
    joystick.base.setDepth(100);
    joystick.thumb.setDepth(101);

    // 카메라가 움직여도 화면 기준 위치 유지
    joystick.setScrollFactor(0);

    // 기본 베이스 터치 대신 아래의 화면 터치 이벤트로 시작
    joystick.base.disableInteractive();

    // 처음에는 숨김
    joystick.setVisible(false);

    // 현재 조이스틱
    let activePointer = null;

    // 화면을 누를때
    const handlePointerDown = (pointer, currentlyOver) => {

        // 조작중이면 패스
        if (activePointer !== null) return;

        // 버튼위에서는 작동하지않음
        if (currentlyOver.length > 0) return;

        activePointer = pointer;

        // 누른 화면 위치로 조이스틱 이동
        joystick.setPosition(pointer.x, pointer.y);
        joystick.setVisible(true); // 표기켜기

        // 지금 누른 위치로 조작
        joystick.touchCursor.onKeyDownStart(pointer);
    };

    // 조작을 중단했을때
    const handlePointerUp = (pointer) => {

        if (pointer !== activePointer) return;

        joystick.touchCursor.onKeyUp(pointer);
        joystick.setVisible(false); // 표기끄기

        activePointer = null;
    };

    // 만든것들을 조이스틱의 각 이벤트에 할당
    scene.input.on('pointerdown', handlePointerDown);
    scene.input.on('pointerup', handlePointerUp);
    scene.input.on('pointerupoutside', handlePointerUp);

    // 씬 재시작 시 이벤트가 중복 등록되지 않도록 정리
    scene.events.once('shutdown', () => {
        scene.input.off('pointerdown', handlePointerDown);
        scene.input.off('pointerup', handlePointerUp);
        scene.input.off('pointerupoutside', handlePointerUp);
    });
}