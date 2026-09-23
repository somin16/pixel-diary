import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
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
    // 씬 실행 확인용 배경색
    this.cameras.main.setBackgroundColor("#223344");

    // 플레이어 이미지 로딩 확인
    const hasPlayerTexture = this.textures.exists("player_sheet");

    this.add
      .text(
        12,
        12,
        hasPlayerTexture
          ? "SCENE OK / IMAGE OK"
          : "SCENE OK / IMAGE MISSING",
        {
          fontSize: "16px",
          color: "#ffffff",
          backgroundColor: "#000000",
          padding: { x: 8, y: 6 },
        }
      )
      .setDepth(9999)
      .setScrollFactor(0);

    // 이미지가 없으면 플레이어 생성 중단
    if (!hasPlayerTexture) {
      console.error(
        "플레이어 이미지 로딩 실패: /assets/game2/Player/player_sheet.png"
      );
      return;
    }

    // 달리기 애니메이션 생성
    if (!this.anims.exists("player_sheet_run")) {
      this.anims.create({
        key: "player_sheet_run",
        frames: this.anims.generateFrameNumbers("player_sheet", {
          start: 0,
          end: 7,
        }),
        frameRate: 12,
        repeat: -1,
      });
    }

    // 플레이어 생성
    this.player = this.physics.add.sprite(
      0,
      0,
      "player_sheet",
      0
    );

    this.player.body.setAllowGravity(false);

    // 최초 화면 크기에 맞춰 배치
    this.updateLayout(this.scale.gameSize);

    // 달리기 실행
    this.player.play("player_sheet_run");

    // 회전 및 화면 크기 변경 시 다시 배치
    this.scale.on("resize", this.updateLayout, this);

    // 씬 종료 시 이벤트 정리
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.updateLayout, this);
    });
  }

  updateLayout(gameSize) {
    const { width, height } = gameSize;

    if (!this.player || width <= 0 || height <= 0) return;

    // 작은 화면에서도 캐릭터가 들어오도록 크기 제한
    const playerScale = Math.min(
      0.6,
      (width * 0.25) / 224,
      (height * 0.45) / 192
    );

    this.player.setScale(playerScale);

    // 화면 비율에 맞춰 배치
    this.player.setPosition(
      width * 0.3,
      height * 0.65
    );
  }
}
