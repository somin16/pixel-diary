import Phaser from 'phaser';

// 게임 시작시 스코어 초기화
// 사실 이건 그냥 GameScene.js에 넣어도 되는 부분입니다만, 그래도 한번에 보는게 편하니까 여기에 뒀습니다
export function createScore(scene) {

    // 게임 시작시에 0점
    scene.gameScore = 0;
}

// 점수 추가
export function addScore(addScoreValue, scene) {

    // 보스 전투 도중에는 점수가 오르지 않습니다(보스전에서 버텨서 점수를 버는 꼼수방지)
    if (scene.isBossSpawn != true) {

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