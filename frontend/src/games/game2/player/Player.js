import Phaser from "phaser";

export default class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {

        // player 스프라이트 시트의 7번 프레임 사용
        super(scene, x, y, "player", 7);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;

        // 플레이어 크기
        this.setScale(0.5);

        // 자동 달리기 속도
        this.runSpeed = 150;

        // 점프 힘
        this.jumpPower = -400;

        // 플레이어 중력
        this.setGravityY(800);

        // 최대 점프 횟수
        this.maxJumpCount = 2;

        // 현재 점프 횟수
        this.jumpCount = 0;

        // 슬라이드 상태
        this.isSliding = false;

        // 키보드 입력
        this.cursors = scene.input.keyboard.createCursorKeys();

        // 스페이스바
        this.spaceKey = scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        // 월드 경계 충돌은 사용하지 않음
        // → 천장 판정 제거
    }


    // =========================
    // 매 프레임 플레이어 처리
    // =========================

    updatePlayer() {

        // 플레이어는 직접 이동하지 않음
        // 쿠키런 스타일이므로 플레이어 X 위치 고정
        this.setVelocityX(0);


        // 착지 여부
        const isGrounded =
            this.body.blocked.down ||
            this.body.touching.down;


        // 착지하면 점프 횟수 초기화
        if (isGrounded) {
            this.jumpCount = 0;
        }


        // =========================
        // 점프
        // ↑ / Space
        // =========================

        const jumpPressed =
            Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.spaceKey);

        if (jumpPressed) {
            this.jump();
        }


        // =========================
        // 슬라이드
        // ↓
        // =========================

        const slidePressed =
            Phaser.Input.Keyboard.JustDown(this.cursors.down);

        if (slidePressed) {
            this.slide();
        }


        // =========================
        // 애니메이션
        // =========================

        // 슬라이드 중
        if (this.isSliding) {

            this.play("player_slide", true);

        }

        // 공중
        else if (!isGrounded) {

            this.play("player_jump", true);

        }

        // 땅
        else {

            this.play("player_run", true);
        }


        // 오른쪽 바라보기
        this.setFlipX(false);
    }


    // =========================
    // 점프
    // =========================

    jump() {

        // 슬라이드 중에는 점프 불가능
        if (this.isSliding) {
            return;
        }


        // 최대 2단 점프
        if (this.jumpCount >= this.maxJumpCount) {
            return;
        }


        this.jumpCount++;

        this.setVelocityY(this.jumpPower);

        // 점프 애니메이션
        this.play("player_jump", true);
    }


    // =========================
    // 슬라이드
    // =========================

    slide() {

        // 이미 슬라이드 중이면 무시
        if (this.isSliding) {
            return;
        }


        // 공중에서는 슬라이드 불가능
        const isGrounded =
            this.body.blocked.down ||
            this.body.touching.down;

        if (!isGrounded) {
            return;
        }


        this.isSliding = true;

        // 슬라이드 애니메이션
        this.play("player_slide", true);


        // 0.5초 후 슬라이드 종료
        this.scene.time.delayedCall(500, () => {

            this.isSliding = false;

        });
    }
}