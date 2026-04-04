export function TimerSetting(scene) {

    // ====================타이머===================

    scene.gamePlayTime = 300; // 기본모드는 5분에서 시작
    scene.timeOver = false;

    // 타이머 텍스트 구성
    scene.timerText = scene.add.text(
      scene.cameras.main.width / 2,    // x좌표
      scene.cameras.main.height / 35,  // y좌표
      "05:00" , {  // 기본 텍스트(5분)
      fontSize: "32px",
      fontFamily: "Arial",
      fill: "#000000",
    })
    .setOrigin(0.5)     // 중앙
    .setScrollFactor(0) // 카메라에 맞춰서 고정
    .setDepth(100);     // UI니까 레이어 맨앞으로

    scene.time.addEvent({
      delay: 1000,
      callback: () => { // 보통은 클래스를 따로 만들지만 관리하기 쉽도록 UI에 같이 묶어두겠습니다.

        if (scene.timeOver == false) { // 오류방지를 위해 timeOver가 false일때만 시간 계산을 하도록 설정

        scene.gamePlayTime--; // 1초마다 타이머감소

        // 분, 초 계산
        const minutes = Math.floor(scene.gamePlayTime / 60);
        const seconds = scene.gamePlayTime % 60;

        // 값이 한자릿수면 앞에다가 0을 붙여준다.
        const minutesText = String(minutes).padStart(2, '0');
        const secondsText = String(seconds).padStart(2, '0');

        // 최종값을 텍스트에 세팅
        scene.timerText.setText(`${minutesText}:${secondsText}`);

        }
      },

      callbackScope: scene,
      loop: true
    });
}

// 타이머가 끝났는지 확인
export function TimerEnd(scene) {

    // ===========타이머가 끝나면============
    if (scene.gamePlayTime < 0 && scene.timeOver == false) {

      // 원래는 보스가 나와야하지만 아직 구현이 안되어있음으로 타이머 파괴로 대체
      scene.timerText.destroy();
      scene.timeOver = true; // 시간이 끝났으니 시간 계산을 더 하지 않도록 timeOver를 true로 변경
    }
}