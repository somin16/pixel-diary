import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    // 플레이어 스프라이트 시트 불러오기
    this.load.spritesheet(
      "player_sheet",
      "/assets/game2/Player/player_sheet.png",
      {
        frameWidth: 224,
        frameHeight: 192,
      }
    );
  }

  create() {
    // 달리기 애니메이션 생성
    if (!this.anims.exists("player_sheet_run")) {
      this.anims.create({
        key: "player_sheet_run",
        frames: this.anims.generateFrameNumbers(
          "player_sheet",
          {
            start: 0,
            end: 7,
          }
        ),
        frameRate: 12,
        repeat: -1,
      });
    }

    // 플레이어 생성 — 기존 위치 유지
    this.player = this.physics.add.sprite(
      300,
      500,
      "player_sheet",
      0
    );

    // 새 스프라이트에 맞춰 크기 조절
    this.player.setScale(0.6);

    // 지금은 달리기만 확인하므로 중력 적용하지 않기
    this.player.body.setAllowGravity(false);

    // 달리기 애니메이션 실행
    this.player.play("player_sheet_run");
  }
}
