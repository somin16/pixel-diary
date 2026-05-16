import Phaser, { Scale } from 'phaser';

// 게임 시작시 스코어 초기화
// 사실 이건 그냥 GameScene.js에 넣어도 되는 부분입니다만, 그래도 한번에 보는게 편하니까 여기에 뒀습니다
export function createScore(scene) {

    // 게임 시작시에 0점
    scene.gameScore = 0;
}

// 점수 추가
export function addScore(addScoreValue, scene) {

    // 보스 전투 도중에는 점수가 오르지 않습니다(보스전에서 버텨서 점수를 버는 꼼수방지)
    if (scene.isBossSpawn == false) {

        // 티켓을 썻으면 추가되는 점수가 2배로 증가
        if(scene.isTicketUse == true) {

            addScoreValue *= 2;
        }

        // 점수를 더하고 텍스트에 세팅한다
        scene.gameScore += addScoreValue
        scene.scoreText.text = "SCORE: " + scene.gameScore;
    }
}

// 스코어가 잠겼다라는 연출을 주기위한 함수
export function lockScore(scene) {

    // MONA 폰트에 자물쇠 이모지가 지원이 돼서 넣어봤습니다(꽤 이쁩니다)
    scene.scoreText.text = "🔒 SCORE: " + scene.gameScore;
}

// 스코어 점수 UI 생성
export function createScoreUI(scene) {

    // 스코어 텍스트 구성
    scene.scoreText = scene.add.text(
      scene.cameras.main.width / 9.5,    // x좌표
      scene.cameras.main.height / 6.85,  // y좌표
      "SCORE: 0" , {  // 기본 텍스트
      fontFamily: "Mona",
      fontSize: "16px",
      fill: "#000000",
    })
    .setOrigin(0)       // UI를 좌측에 고정시킨다
    .setScrollFactor(0) // 카메라에 맞춰서 고정
    .setDepth(100);     // UI니까 레이어 맨앞으로
}

// 게임 종료 시 점수 정산 화면 띄우기
export function gameClear(scene) {

    // 게임 종료 true
    scene.gameEnd = true;

    // 게임 정지
    scene.physics.pause();
    scene.time.paused = true;

    // 조이스틱 파괴(단순 가시성을 위한것입니다)
    scene.joyStick.destroy();

    // UI 그룹 및 위치조정
    scene.gameEndUI = scene.add.container(0, 0);
    scene.gameEndUI.setScrollFactor(0);
    scene.gameEndUI.setDepth(500);

    // 가로세로 중앙
    const centerX = scene.cameras.main.width / 2;
    const centerY = scene.cameras.main.height / 2;

    // 플레이어가 보유중인 재화(우선 테스트로 30할당)
    // 차후에 API 연동이 진행될 부분입니다
    let coin = 30;

    // 최종점수(1000점은 게임 클리어 보너스)
    // 여기서 scene.gameScore부분은 차후에 API 연동시 따로 저장이 되도록 구현 예정
    let finalScore = scene.gameScore + 1000;

    // 티켓 썻으면 1000점 추가
    if (scene.isTicketUse == true) finalScore += 1000;

    // 코인으로 환산된 점수
    let addCoin = finalScore / 10;

    // 최종 연산이 완료된 수치(연출을 위해)
    // 차후에 API 연동시 게임 결과가 나오는 순간에 reultCoin을 미리 보유재화에 넣는 식으로 구현 할 것입니다(연산도중에 게임이 종료될 가능성을 생각해서) 
    let resultCoin = coin + addCoin;

    // 반투명 검은배경을 게임 전체에 깔기
    const backGround = scene.add.rectangle(
      centerX,
      centerY,
      scene.cameras.main.width,
      scene.cameras.main.height,
      0x000000,
      0.8
    );

    // 게임 클리어 텍스트
    const gameOverText = scene.add.text(centerX, centerY / 3, "CLEAR!", {
      fontFamily: "Mona",
      fontSize: "48px",
      fontStyle: "bold",
      fill: "#24b400"
    }).setOrigin(0.5);

    // 점수 텍스트
    const finalScoreText = scene.add.text(centerX, centerY - 50, "SCORE: " + finalScore, {
        fontFamily: "Mona",
        fontSize: "24px",
        fill: "#ffef84"
    }).setOrigin(0.5);

    // 코인 이미지
    const coinIcon = scene.add.image(centerX - 25, centerY / 0.95, "coin")
    .setOrigin(0.5).setScale(2);

    // 코인 텍스트
    const coinText = scene.add.text(coinIcon.x + 25, centerY / 0.95, coin, {
        fontFamily: "Mona",
        fontSize: "32px",
        fill: "#ffd670"
    }).setOrigin(0, 0.5); // 왼쪽을 기준으로 중앙

    // 추가되는 코인 텍스트
    const addCoinText = scene.add.text(centerX, centerY / 0.9, "+" + Math.floor(addCoin), {
        fontFamily: "Mona",
        fontSize: "24px",
        fill: "#ffef84"
    }).setOrigin(0, 0.5); // 왼쪽을 기준으로 왼쪽 끝

    // 보물상자 발견 이미지
    const gameEndImage = scene.physics.add.sprite(centerX, centerY / 1.5, "game_end_image")
    gameEndImage.setDepth(101);
    gameEndImage.setScrollFactor(0);
    gameEndImage.setScale(4);
    gameEndImage.play("game_end_image_animation", true);

    // 홈으로 돌아가기 버튼 배경
    const returnHomeButton = scene.add.rectangle(centerX, centerY / 0.75, 250, 60, 0x44aa44)
      .setScrollFactor(0) // 이거 안하면 이상한곳에서 스폰돼서 클릭이 안된다
      .setInteractive()   // 이걸 넣어줘야 클릭이 가능
      .on('pointerdown', () => { // 누를때 작동

        window.location.href = "/";
      }).setVisible(false); // 처음엔 안보이게

    // 홈으로 돌아가기 버튼 텍스트
    const returnHomeButtonText = scene.add.text(centerX, centerY / 0.75, "메인 화면으로 이동!", {
      fontFamily: "Mona",
      fontSize: "24px",
      fill: "#ffffff"
    }).setOrigin(0.5).setVisible(false); // 처음엔 안보이게


    // 재시작 버튼 배경
    const restartGameButton = scene.add.rectangle(centerX, centerY / 0.65, 250, 60, 0x00AAFF)
      .setScrollFactor(0) // 이거 안하면 이상한곳에서 스폰돼서 클릭이 안된다
      .setInteractive()   // 이걸 넣어줘야 클릭이 가능
      .on('pointerup', () => { // 누를때 작동

        scene.gameEnd = false;
        scene.scene.start('ModeSelectScene'); // 생각해보니까 모드 선택 화면으로 보내는게 맞을거같아서 모드 선택화면으로 이동하는걸로 변경했습니다
      }).setVisible(false); // 처음엔 안보이게

    // 재시작 버튼 텍스트
    const restartGameButtonText = scene.add.text(centerX, centerY / 0.65, "한번 더 플레이하기!", {
      fontFamily: "Mona",
      fontSize: "24px",
      fill: "#ffffff"
    }).setOrigin(0.5).setVisible(false); // 처음엔 안보이게

    // 이건 제가 만든 함수가 아니라 자바스크립트 자체기능입니다
    // setTimeout: n밀리초(ms)뒤에 작동(맨아래로 내리면 수치가 있습니다)
    // 페이저 기능 냅두고 갑자기 이걸 쓰는 이유는 퍼즈로 인해 게임이 멈춘 상태여서 페이저 기능을 사용을 못합니다
    // 그래서 대신 자바스크립트 함수를 사용했습니다
    setTimeout(() => {

        const duration = 1000; // 1초동안 코인이 상승
        const tickRate = 20;   // 20ms마다 코인이 증가
        const upTime = duration / tickRate;

        // 코인이 20ms당 얼마나 오를것인가? 를 계산
        const coinTick = addCoin / upTime;

        // setInterval: 정해진 시간(틱)마다 반복
        const countTimer = setInterval(() => {

            // 게임이 재시작 됐을때, 오류방지용 조건문
            if (!addCoinText.active || !coinText.active) {
                
                clearInterval(countTimer);
                return; 
            }

            // 20ms마다 coinTick만큼 코인이 증가하고
            // 증가한만큼 부여되는 코인이 줄어드는 연출
            coin += coinTick;
            addCoin -= coinTick;

            // 증가되는 코인 텍스트 갱신
            addCoinText.setText("+" + Math.floor(addCoin));

            // 모든 코인을 처음에 미리 계산해둔 최종수치만큼(resultCoin) 다 넣었다면?
            if (coin >= resultCoin) {

                // 값을 맞춰주기 위해 코인을 최종수치로 고정해줍니다
                coin = resultCoin;
                addCoinText.destroy();      // 0개가 되면 지워줍니다
                clearInterval(countTimer);  // 메모리누수를 막기위해 countTimer를 지워줍니다

                // 정산이 끝나면 홈, 다시시작 버튼을 보여주기
                returnHomeButton.setVisible(true);
                returnHomeButtonText.setVisible(true);
                restartGameButton.setVisible(true);
                restartGameButtonText.setVisible(true);
            }

            // 최종코인 텍스트 갱신
            coinText.setText(Math.floor(coin));

        }, tickRate); // tickRate의 속도로 반복

    }, 1000); // 1초뒤에 작동

    // 만든걸 모두 gameEndUI에 넣기
    scene.gameEndUI.add([

        backGround,
        gameEndImage,
        gameOverText,
        finalScoreText,
        coinIcon,
        coinText,
        addCoinText,
        returnHomeButton,
        returnHomeButtonText,
        restartGameButton,
        restartGameButtonText
    ]);
}