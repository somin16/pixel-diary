import Phaser from "phaser";

export function createMenu(scene) {

    // 현재 화면의 가로 세로 크기 받기
    const { width, height } = scene.cameras.main;

    // 카메라 가운데위치
    const centerX = width / 2;     // X좌표 가운데
    const centerY = height / 2;     // Y좌표 가운데

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
    const menuOpenButton = scene.add.image(width - 25, 25, "menu_icon").setInteractive();
    menuOpenButton.setDepth(100);      // 레이어를 위에 설정
    menuOpenButton.setScrollFactor(0); // 가운데 고정
    menuOpenButton.setScale(2)          // 해상도x2
    .setOrigin(1, 0);        

    // 뒷배경
    const menuOpenButtonDetail = scene.add.rectangle(
        menuOpenButton.x + 3,
        menuOpenButton.y + 3,
        menuOpenButton.displayWidth,
        menuOpenButton.displayHeight,
        0x000000,
        1
    );
    menuOpenButtonDetail.setOrigin(1, 0);
    menuOpenButtonDetail.setScrollFactor(0);
    menuOpenButtonDetail.setDepth(menuOpenButton.depth - 1);

    // 메뉴 컨테이너
    const menuContainer = scene.add.container(0, 0);
    menuContainer.setScrollFactor(0);
    menuContainer.setDepth(101); 
    menuContainer.setVisible(false); // 처음엔 숨겨두고 호출되면 보이는 형식

    // 메뉴 배경
    // nieslice는 상하좌우 n픽셀은 건들지않고 크기를 조정할 수 있다.
    // (x,y, 텍스쳐이름, 프레임, 가로, 세로, 보호픽셀 좌,우,위,아래)
    const menuBackGround = scene.add.nineslice(centerX, centerY, "menu_window", 0, 125, 90, 2,2,2,2);
    menuBackGround.setScale(2);     // 해상도x2

    // 돌아가기 버튼
    const returnButton = scene.add.nineslice(centerX, height * 0.415 , "menu_window_button", 0, buttonWidth, buttonHeight, 2,2,2,2);
    returnButton.setInteractive();   // 클릭가능여부(없으면 클릭이 안됩니다)
    returnButton.setScrollFactor(0); // 가운데 고정
    returnButton.setScale(2);        // 해상도x2

    // 돌아가기 텍스트
    const returnText = scene.add.text(centerX , height * 0.415, "돌아가기", {
        fontFamily: "Mona",
        fontSize: "18px",
        fill: "#ffffff"
    }).setOrigin(0.5, 0.5); // 가운데 정렬

    // 게임종료 버튼
    const gameEndButton = scene.add.nineslice(centerX, height * 0.585, "menu_window_button", 0, buttonWidth, buttonHeight, 2,2,2,2);
    gameEndButton.setInteractive();
    gameEndButton.setScrollFactor(0);
    gameEndButton.setScale(2);

    // 게임종료 텍스트
    const gameEndText = scene.add.text(centerX , height * 0.585, "게임종료", {
        fontFamily: "Mona",
        fontSize: "18px",
        fill: "#ffffff"
    }).setOrigin(0.5, 0.5); // 가운데 정렬

    // 만든걸 다 컨에티너에 넣기
    menuContainer.add([backGround, menuBackGround, returnButton, returnText, gameEndButton, gameEndText]);

    // ==============버튼 클릭시==================
    // 해당하는 버튼을 눌렀을때 아래에있는 함수를 실행한다

    // 메뉴 버튼
    menuOpenButton.on('pointerdown', () => selectMenu(menuContainer, scene));

    // 돌아가기 버튼
    returnButton.on('pointerdown', () => selectRetrun(menuContainer, scene));

    // 게임종료 버튼(미구현)
    gameEndButton.on('pointerdown', () => selectGameEnd());
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

    // React에게 게임 종료 신호(이벤트) 보내기
    window.dispatchEvent(new CustomEvent("exitMiniGame"));
}
