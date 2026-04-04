// 게임 종료
export function gameOver(scene) {

    // 연속작동 방지를 위해 isDead를 true로 변경
    scene.player.isDead = true;

    // 게임정지
    scene.physics.pause();
    scene.time.paused = true;

    // UI 그룹 및 위치조정
    scene.gameEndUI = scene.add.container(0, 0);
    scene.gameEndUI.setScrollFactor(0);
    scene.gameEndUI.setDepth(500);

    // 가로세로 중앙
    const centerX = scene.cameras.main.width / 2;
    const centerY = scene.cameras.main.height / 2;

    // 반투명 검은배경을 게임 전체에 깔기
    const backGround = scene.add.rectangle(
      centerX,
      centerY,
      scene.cameras.main.width,
      scene.cameras.main.height,
      0x000000,
      0.7
    );

    // 게임오버 텍스트
    const gameOverText = scene.add.text(centerX, centerY - 150, "GAME OVER", {
      fontSize: "48px",
      fontStyle: "bold",
      fill: "#ff4444",
      fontFamily: "Arial"
    }).setOrigin(0.5);

    // 재시작 버튼 위치
    const restartButtonPosY = centerY + 30;

    // 재시작 버튼 배경
    const restartButtonBackground = scene.add.rectangle(centerX, restartButtonPosY, 250, 60, 0x44aa44)
      .setScrollFactor(0) // 이거 안하면 이상한곳에서 스폰돼서 클릭이 안된다
      .setInteractive()   // 이걸 넣어줘야 클릭이 가능
      .on('pointerdown', () => { // 누를때 작동

        scene.scene.restart(); // 페이저에는 게임 재시작 기능이 따로 존재
      });

    // 재시작 버튼 텍스트
    const restartButtonText = scene.add.text(centerX, restartButtonPosY, "다시 도전하기!", {
      fontSize: "24px",
      fontStyle: "bold",
      fill: "#ffffff",
      fontFamily: "Arial"
    }).setOrigin(0.5);

    // 만든걸 모두 gameEndUI에 넣기
    scene.gameEndUI.add([backGround,gameOverText,restartButtonBackground,restartButtonText]);
  }