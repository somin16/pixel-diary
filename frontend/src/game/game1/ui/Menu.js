import Phaser from "phaser";

export function createMenu(scene) {

    // 카메라 가운데위치
    const centerX = scene.cameras.main.width / 2;     // X좌표 가운데
    const centerY = scene.cameras.main.height / 2;     // Y좌표 가운데

    // 현재 기기의 화면크기
    const sceneWidth = scene.scale.width;
    const sceneHeight = scene.scale.height;

    // 버튼 템플릿
    const buttonWidth = 100;   // 버튼 넓이
    const buttonHeight = 25;   // 버튼 높이

    // 반투명 검은배경을 게임 전체에 깔기
    const backGround = scene.add.rectangle(
        centerX,
        centerY,
        scene.cameras.main.width,
        scene.cameras.main.height,
        0x000000,
        0.7
    );
    
    // 메뉴아이콘을 화면기준 우측위에 생성
    const menuOpenButton = scene.add.image(sceneWidth - 25, sceneHeight / 15, "menu_icon").setInteractive();
    menuOpenButton.setDepth(100);      // 레이어를 위에 설정
    menuOpenButton.setScrollFactor(0); // 가운데 고정
    menuOpenButton.setScale(2);        // 해상도x2

    // 메뉴 컨테이너
    const menuContainer = scene.add.container(0, 0);
    menuContainer.setScrollFactor(0);
    menuContainer.setDepth(101); 
    menuContainer.setVisible(false); // 처음엔 숨겨두고 호출되면 보이는 형식

    // 메뉴 배경
    // nieslice는 상하좌우 n픽셀은 건들지않고 크기를 조정할 수 있다.
    // (x,y, 텍스쳐이름, 프레임, 가로, 세로, 보호픽셀 좌,우,위,아래)
    const menuBackGround = scene.add.nineslice(centerX, centerY - 50, "menu_window", 0, 125, 150, 2,2,2,2);
    menuBackGround.setScale(2);     // 해상도x2

    // 돌아가기 버튼
    const returnButton = scene.add.nineslice(centerX, centerY - 90, "menu_window_button", 0, buttonWidth, buttonHeight, 2,2,2,2);
    returnButton.setInteractive();   // 클릭가능여부(없으면 클릭이 안됩니다)
    returnButton.setScrollFactor(0); // 가운데 고정
    returnButton.setScale(2);        // 해상도x2

    // 돌아가기 텍스트
    const returnText = scene.add.text(centerX , centerY - 90, "돌아가기", {
        fontFamily: "Mona",
        fontSize: "18px",
        fill: "#ffffff"
    }).setOrigin(0.5, 0.5); // 가운데 정렬

    // 게임종료 버튼
    const gameEndButton = scene.add.nineslice(centerX, centerY, "menu_window_button", 0, buttonWidth, buttonHeight, 2,2,2,2);
    gameEndButton.setInteractive();
    gameEndButton.setScrollFactor(0);
    gameEndButton.setScale(2);

    // 게임종료 텍스트
    const gameEndText = scene.add.text(centerX , centerY, "게임종료", {
        fontFamily: "Mona",
        fontSize: "18px",
        fill: "#ffffff"
    }).setOrigin(0.5, 0.5); // 가운데 정렬

    // 소리 온오프 버튼
    const soundBtn = scene.add.image(centerX + 100, centerY - 175, "sound_icon_on");
    soundBtn.setInteractive();
    soundBtn.setScrollFactor(0);
    soundBtn.setScale(2);

    // 만든걸 다 컨에티너에 넣기
    menuContainer.add([backGround, menuBackGround, returnButton, returnText, gameEndButton, gameEndText, soundBtn]);

    // ==============버튼 클릭시==================
    // 해당하는 버튼을 눌렀을때 아래에있는 함수를 실행한다

    // 메뉴 버튼
    menuOpenButton.on('pointerdown', () => selectMenu(menuContainer, scene));

    // 돌아가기 버튼
    returnButton.on('pointerdown', () => selectRetrun(menuContainer, scene));

    // 게임종료 버튼(미구현)
    gameEndButton.on('pointerdown', () => selectGameEnd());

    // 사운드 버튼
    scene.isSoundOn = true; // 사운드 상태체크용 변수
    soundBtn.on('pointerdown', () => selectSound(soundBtn, scene));
}

// 메뉴 버튼 클릭시
function selectMenu(menuContainer, scene) {

    // 게임이 종료됐을땐, 메뉴 버튼이 눌리지 않도록 return
    if (scene.gameEnd == true) return;

    scene.isMenuOpen = true; // 메뉴켜짐

    // 게임시간 멈추기
    scene.physics.pause();
    scene.time.paused = true; 
        
    menuContainer.setVisible(true); // 메뉴창 띄우기
}

// 돌아가기 버튼 클릭시
function selectRetrun(menuContainer, scene) {

    scene.isMenuOpen = false; // 메뉴꺼짐

    // 게임시간을 다시 재생
    scene.physics.resume();
    scene.time.paused = false;

    menuContainer.setVisible(false); // 메뉴창 숨기기
}

// 게임종료 버튼 클릭시(현재는 임시로 홈화면으로 보내버립니다)
function selectGameEnd() {

    // 홈화면으로 보내기
    window.location.href = "/";
}

// 사운드 버튼 클릭시
function selectSound(soundBtn, scene) {

    if (scene.isSoundOn) {

        scene.isSoundOn = false;
        soundBtn.setTexture("sound_icon_off");
        // 게임 자체에 아직 소리가 없어서 이미지만 바뀝니다
    } 
    
    else {

        scene.isSoundOn = true;
        soundBtn.setTexture("sound_icon_on");
    }
}