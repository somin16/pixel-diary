import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    // 플레이어 이미지 불러오기
    this.load.image(
      "player_stop",
      "/assets/game2/Player/player_stop.png"
    );

    this.load.image(
      "player_move1",
      "/assets/game2/Player/player_move1.png"
    );

    this.load.image(
      "player_move2",
      "/assets/game2/Player/player_move2.png"
    );

    this.load.image(
      "player_jump",
      "/assets/game2/Player/player_jump.png"
    );
  }

  create() {
    // 플레이어 생성
    this.player = this.physics.add.sprite(
      300,
      500,
      "player_move1"
    );

    // 달리기 애니메이션 생성
    this.anims.create({
      key: "player_run",
      frames: [
        { key: "player_move1" },
        { key: "player_move2" }
      ],
      frameRate: 8,
      repeat: -1
    });

    // 달리기 애니메이션 실행
    this.player.play("player_run");
  }
}