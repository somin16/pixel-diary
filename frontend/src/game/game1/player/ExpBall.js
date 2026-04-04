import { levelUpMenu } from "../player/LevelUp.js";

// 경험치 구슬 생성
export function addExpBall(posX, posY, scene) {

    const expBall = scene.expBalls.create(posX, posY, "exp_ball");
    expBall.setScale(2);
}


export function overlapAddExp(scene) {
    // 경험치 획득
    // 닿으면~ 파괴하고 AddExp(10)
    scene.physics.add.overlap(scene.player, scene.expBalls, (player, expBalls) => {

      expBalls.destroy();
      addExp(50, scene.player, scene); // 경험치 수치

    },null, scene
  );
}

function addExp(Value, player ,scene) {

    player.expCount += Value; // 위에서 선언한 상수 expCount를 활용

    // 최대치 넘었을때 최대 경험치 수치만큼 깎고 레벨업 실행
    if (player.expCount >= player.MAX_EXP) {

      player.expCount -= player.MAX_EXP; // 최대 경험치의 수치만큼 깎기

      player.MAX_EXP += 10; // 레벨이 오를때마다 최대 경험치가 10씩 증가(임시)
      levelUpMenu(scene); // 레벨업 실행

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