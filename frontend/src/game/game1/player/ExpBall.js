import { levelUpMenu } from "../player/LevelUp.js";

// 경험치 구슬 생성
export function addExpBall(posX, posY, scene) {

  const expBall = scene.expBalls.create(posX, posY, "exp_ball");
  expBall.setScale(2);
  expBall.type = "small"; // 구분을 위해 type을 추가
}

// 큰 경험치 구슬 생성
export function addBigExpBall(posX, posY, scene) {

  const expBigBall = scene.expBalls.create(posX, posY, "exp_ball_big");
  expBigBall.setScale(2);
  expBigBall.type = "big"; // 작은 경험치와 구분하기 위해 type을 추가
}


export function overlapAddExp(scene) {

  // 경험치 획득
  // 닿으면~ 파괴하고 AddExp(10)
  scene.physics.add.overlap(scene.player, scene.expBalls, (player, expBalls) => {

    // 경험치 중복획득 현상 방지용
    if (!expBalls.active) return;

    expBalls.disableBody(true, true);
    expBalls.destroy();

    // 타입에 따라 주는양을 다르게 한다
    if (expBalls.type == "small") {

      addExp(50, scene.player, scene); // 경험치 수치
    }

    else if (expBalls.type == "big") {

      // 큰 경험치 구슬의 경우 현재 플레이어의 최대 경험치의 수치만큼 올려준다
      // 쉽게 말해서 무조건 1레벨업만큼의 경험치를 주는것
      addExp(scene.player.MAX_EXP, scene.player, scene);
    }

  },null, scene);
}

function addExp(value, player ,scene) {

    player.expCount += value;

    // 최대치 넘었을때 최대 경험치 수치만큼 깎고 레벨업 실행
    // if로 하면 addExp가 모종의 이유로 두번연속 작동되었을때 코드가 꼬일수도 있음으로 while로 교체
    while(player.expCount >= player.MAX_EXP) {

      player.expCount -= player.MAX_EXP; // 최대 경험치의 수치만큼 깎기
      player.MAX_EXP += 10; // 레벨이 오를때마다 최대 경험치가 10씩 증가(임시)

      // 최대치 넘었을때 최대 경험치 수치만큼 깎고 레벨업 실행
      if (!scene.isLevelUpOpen) { // 레벨업 창이 열려있는지 확인

        scene.isLevelUpOpen = true; // 중복 방지를 위해 레벨업창이 열려있음을 감지하는 isLevelUpOpen을 추가
        levelUpMenu(scene); // 레벨업 실행
      }
    }

    // 0보다 작으면 안보여야하니 .setVisible을 꺼준다
    if (player.expCount <= 0) {

      scene.addExpValue.setVisible(false);
    }

    else {

      scene.addExpValue.setVisible(true);

      const percent = player.expCount / player.MAX_EXP; //퍼센트 계산

      const expBarPercentValue = Math.max(2, 150 * percent);// 2: setScale 즉 처음 생성될때부터 이미지 크기 정해놓는것
                                                            // 150 * percent인 이유: 150이 기본 크기여서 150의 n%로 하면 딱 맞는다  
      scene.addExpValue.width = expBarPercentValue; // 계산 완료된걸 exp바에 넣어준다
    }
}