import { gameOver } from "../manage/GameOver";

// HP업데이트(회복, 피해 모두 관리)
export function updateHP(player, value, scene) {

    player.hp += value;

    // 최대 HP를 초과하면 최대HP의 수치로 고정
    if (player.hp >= player.MAX_HP) {

        player.hp = player.MAX_HP;
    }

    // 체력이 0이 되면 게임오버를 실행
    if (player.hp <= 0 && player.isDead == false) { // 반복 방지를 위해 isDead로 구분

        player.isDead = true;
        gameOver(scene) // 게임오버 실행
    }

    else {
        // 현재 hp가 전체 hp의 몇%인가를 계산
        const percent = player.hp / player.MAX_HP;
        const hpBarPercentValue = Math.max(2, 20 * percent);

        // 해당 값을 토대로 HP UI의 크기를 조정
        scene.addHPValue.width = hpBarPercentValue
    }
}

// 플레이어 체력 자연회복 이벤트
export function addEventupdataHP(scene) {

    scene.time.addEvent({
    delay: 1000,
    callback: () => updateHP(scene.player, 1, scene), // 수치가 들어가는 클래스일 경우엔 괄호랑 화살표도 써줘야한다
    callbackScope: scene,
    loop: true,
    });
}