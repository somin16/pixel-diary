import Phaser from "phaser";

export default class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {

        // player_sheet의 0번 프레임을 플레이어 기본 이미지로 사용
        super(scene, x, y, "player_sheet", 0);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 플레이어 크기
        this.setScale(0.7);

        // 자동 달리기 속도
        this.runSpeed = 150;

        // 플레이어가 생성된 Scene 저장
        this.scene = scene;

        // 화면 밖으로 나가지 않도록 설정
        this.setCollideWorldBounds(true);
    }

    // 자동 달리기
    playerMove() {

        // 화면 오른쪽 끝
        const rightLimit = this.scene.scale.width - this.displayWidth / 2;

        // 플레이어가 오른쪽 끝에 도달했으면
        // 더 이상 오른쪽으로 이동하지 않음
        if (this.x >= rightLimit) {

            this.x = rightLimit;
            this.setVelocityX(0);

        } else {

            // 오른쪽으로 자동 이동
            this.setVelocityX(this.runSpeed);
        }

        // 달리기 애니메이션
        this.play("player_run", true);

        // 오른쪽 바라보기
        this.setFlipX(false);
    }
}