import Phaser from "phaser";

export default class Player extends Phaser.Physics.Arcade.Sprite {

    // 생성될 부모 클래스, x좌표, y좌표
    constructor(scene, x, y) {

        // scene의 x좌표 y좌표에 player_stop이미지를 가진 개체를 소환
        super(scene, x, y, 'player_stop');
        scene.add.existing(this);     
        scene.physics.add.existing(this); 

        this.hp = 100; // 기본 체력
        this.MAX_HP = 100; // 최대 체력

        this.expCount = 0; // 경험치값
        this.MAX_EXP = 100; // 최대 경험치값

        this.damage = 1; // 기본 공격력
        this.speed = 0; // 레벨업시 추가될 이동속도 계산용
        this.autoHeal = 1; // 자동 회복 가중치
        this.isDead = false; // 플레이어 사망 감지용

        // 플레이어가 가지고 있는 무기
        this.bladeLevel = 1; // 블레이드는 기본무기
        this.arrowLevel = 0; // 그 외는 0레벨로 시작
        this.fireBallLevel = 0;

        // 그 외
        this.isDamage = false; // 플레이어 피격 감지(무적시간)
        this.setScale(2); // 해상도 조정
    }

    // 플레이어 이동
    playerMove(cursors, wasd) {

        // 기본 설정
        const DEFAULT_SPEED = 150; // 기본 속도
        this.setVelocity(0); // 중력x

        let isMove = false; // 움직이고 있는지 감지

        // 방향키 입력에 따른 플레이어 이동 로직
        // WASD도 추가했습니다.
        // 왼쪽
        if (cursors.left.isDown || wasd.A.isDown) {
            
            isMove = true;

            this.setVelocityX(-DEFAULT_SPEED - 15 * this.speed); // 기본속도 + 레벨업 보상으로 받은 이동속도도 함께 계산
            this.setFlipX(true); // 좌우반전

        }

            // 오른쪽
            else if (cursors.right.isDown || wasd.D.isDown) {
            isMove = true;

            this.setVelocityX(DEFAULT_SPEED + 15 * this.speed);
            this.setFlipX(false); // 좌우반전
        }

        // 위아래
        if (cursors.up.isDown || wasd.W.isDown) {

            this.setVelocityY(-DEFAULT_SPEED - 15 * this.speed);
            isMove = true;

        } 
        
        else if (cursors.down.isDown || wasd.S.isDown) {

            this.setVelocityY(DEFAULT_SPEED + 15 * this.speed);
            isMove = true;
        }

        // 이동시 ~ 애니메이션
        if (isMove) {

            this.play("move_animation", true);
        } 
        
        else {
        
            // .stop : 애니메이션 중지
            this.stop();
            this.setTexture("player_stop"); // 중지하고 이미지 변경
        }
    }
}