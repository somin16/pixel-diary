import Phaser from "phaser";

export default class KingSlime extends Phaser.Physics.Arcade.Sprite {

    // 생성될 부모 클래스, x좌표, y좌표, 난이도 증가 가중치인 status 
    constructor(scene, x, y, monsterStatus) {

        // scene의 x좌표 y좌표에 king_slime_move의 이미지를 가진 개체를 소환
        super(scene, x, y, "king_slime_move");

        // 현재 씬과 물리엔진 시스템에 this를 추가
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 스탯 
        this.isBoss = true;                   // 보스 확인용
        this.monsterID = 101;                 // 몬스터 번호 (보스몬스터는 101부터 시작하는걸로 구분하겠습니다)
        this.hp = 200 + monsterStatus;         // 체력
        this.damage = -10;                    // 대미지
        this.resistance = 0;                  // 공격을 받았을때 밀려나는 저항정도
                                              // ※ 1은 저항없음, 0에 가까울수록 안밀린다

        this.isHit = false; // 플레이어에게 공격을 받았는지 확인용
        this.setScale(3);   // 이미지 크기조정
        this.setDepth(10);     // 다른 몬스터에게 가려지지않도록 레이어를 조금 위로 설정
        this.play("king_slime_move_animation", true); // 애니메이션 재생

        // 킹슬라임의 실제 피격판정 설정
        this.body.setSize(48, 32);

        // 패턴 확인용 변수
        this.isAttack = false;
        this.isDash = false;
    }

    // 움직임 애니메이션
    move(player) { // 매게변수 플레이어

        // 킹슬라임?이 공격중이면 move()를 멈춘다
        if (this.isAttack == true) return;

        // 플레이어에게 65의 속도로 다가간다
        this.scene.physics.moveToObject(this, player, 65);

        // 몬스터가 바라보는 방향에 따라 위치 변경
        // 플레이어를 기준으로 왼쪽에 있으면 오른쪽을 보고 반대면 왼쪽을 본다
        if (this.x > player.x) this.setFlipX(false);
        else this.setFlipX(true);
    }

    // 킹슬라임?의 돌진패턴
    readyAttackDash(player) {

        // 이미 돌진중이거나 몬스터가 죽었으면 취소(버그방지용)
        if (this.isDash || !this.active) return;

        // 패턴확인용 변수변경
        this.isAttack = true;
        this.isDash = true;

        // 패턴 시작전에 잠시 정지하고 애니메이션을 재생
        this.body.setVelocity(0, 0);
        this.play("king_slime_dash_ready_animation", true);

        // 킹슬라임?이 플레이어를 바라보는 방향을 구하고
        const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        
        // 해당 방향쪽으로 세로 500 가로 120의 투명도 40%의 빨간색 네모(redZone)을 소환합니다
        const redZone = this.scene.add.rectangle(this.x, this.y, 500, 120, 0xff0000, 0.4)
            .setOrigin(0, 0.5)              // 중앙정렬
            .setRotation(angleToPlayer)     // 방향은 자신을 기준으로 플레이어쪽의 방향
            .setDepth(9);                   // 킹슬라임보다 레이어 한단계 낮게

        // 1.5초뒤에 준비를 멈추고 돌진을 적용
        this.scene.time.delayedCall(1500, () => {

            this.startAttackDash(angleToPlayer, redZone);
        });
    }

    // 돌진 시작
    startAttackDash(angle, redZone) {

        // 만약에 보스가 죽었으면 실행하지않는다(버그방지용)
        if (!this.active) {
            redZone.destroy();
            return;
        }

        // 패턴 도중에 대미지를 20으로 변경합니다
        const defaultDamage = this.damage; // 원래 대미지를 미리 받아놓고 돌진이 종료되면 돌려받는다
        this.damage = -20;

        // 공격범위 없애기
        redZone.destroy();

        // 돌진 애니메이션 재생
        this.play("king_slime_dash_animation", true);

        // 바라보고 있던 위치로 500의 속도로 달려간다
        this.scene.physics.velocityFromRotation(angle, 500, this.body.velocity);

        // 1초가 지나면 돌진을 종료한다
        this.scene.time.delayedCall(1000, () => {
            
            if (this.active) {  // 버그 방지용 조건문

                // 패턴 확인용 변수 끄기
                this.isDash = false;
                this.isAttack = false;

                // 패턴이 끝났으니 대미지도 원래대로
                this.damage = defaultDamage;

                // 기본(움직임) 애니메이션 재생
                this.play("king_slime_move_animation", true);
            }
        });
    }

    // 점프와 돌진중에 랜덤선택
    selectAttack(player) {

        // 돌진을 기준점으로 잡는다(70%)
        const DASH_PERCENT = 70;

        // Between을 통해 1부터 100사이의 랜덤수를 뽑는다
        const JUMP_PERCENT = Phaser.Math.Between(1, 100); 

        // 70%확률로 돌진, 30%확률로 점프를 사용한다
        if (JUMP_PERCENT <= DASH_PERCENT) this.readyAttackDash(player);
        else this.readyAttackJump(player);
    }

    // 점프 시작
    readyAttackJump(player) {

        // 이미 다른 공격 중이거나 죽었으면 취소(버그 방지용)
        if (this.isAttack || !this.active) return;

        this.isAttack = true;
        this.body.setVelocity(0, 0); // 패턴 준비도중엔 제자리 고정

        // 애니메이션 재생
        this.play("king_slime_jump_1_animation", true);

        // 1초후 실행
        this.scene.time.delayedCall(1000, () => {

            this.startAttackJump(player)
        })
    }

    // 점프 시작
    startAttackJump(player) {

        // 죽었으면 취소(버그 방지용)
        if (!this.active) return;

        // 점프 도중의 애니메이션 재생
        this.play("king_slime_jump_2_animation", true);

        // 물리충돌 해제(모션도중에는 판정이 없어진다)
        this.body.checkCollision.none = true; 

        // tweens : 특정 위치로 n초동안 이동시킬때 사용
        this.scene.tweens.add({

            targets: this,          // 누구를 이동시킬건가(this{킹슬라임})
            y: this.y - 1200,       // 현재 위치에서 어디 y좌표까지? (위로 1200픽셀)
            duration: 800,          // 0.8초안에
            ease: 'Sine.easeOut',   // 이동을 부드럽게 해주는 효과
            onComplete: () => {     // onComplete: 종료될때 작동

                // 이동후, 0.8초뒤에 내려찍기 함수를 실행 
                this.scene.time.delayedCall(800, () => {
                    this.endAttackJump(player);
                });
            }
        });
    }

    // 점프 후 내려찍기
    endAttackJump(player) {

        // 죽었으면 취소(버그방지용)
        if (!this.active) return;

        // 플레이어 위치 받아오기
        const targetX = player.x;
        const targetY = player.y;

        // 공격범위 표시
        // 플레이어의 위치에 120의 넓이와 투명도 40%의 빨간색 동그라미(redZone)를 소환
        const redZone = this.scene.add.circle(targetX, targetY, 120, 0xff0000, 0.4)
            .setDepth(9);

        // 킹슬라임의 위치를 플레이어의 머리위로 이동
        this.x = targetX;
        this.y = targetY - 1200; 

        // 공격범위(redZone) 생성 후 1.5초 뒤에 그 위치에 내려찍기 시작
        this.scene.time.delayedCall(1500, () => {

            // 버그방지용
            if (!this.active) {
                redZone.destroy();
                return;
            }

            // tweens을 이용해 내려찍기 이동을 구현
            this.scene.tweens.add({

                targets: this,
                y: targetY,             // 받아둔 플레이어의 y위치로
                duration: 200,          // 0.2초 만에 빠르게 이동
                ease: 'Expo.easeIn',    // 점점 빨라지는 이동효과
                onComplete: () => {     // onComplete: 종료될때 작동
                    
                    // 공격범위 장판 지우기
                    redZone.destroy();

                    // 물리 판정 다시키기
                    this.body.checkCollision.none = false;

                    // shake: 흔들림 효과
                    // 0.2초동안 0.03의 강도로 카메라 흔들기
                    this.scene.cameras.main.shake(200, 0.02);

                    // 착지시 애니메이션
                    this.play("king_slime_jump_3_animation", true);

                    // 1초 동안 멈춘뒤 공격로직 완전히 종료
                    this.scene.time.delayedCall(1000, () => {

                        if (this.active) {

                            this.isAttack = false;
                            this.play("king_slime_move_animation", true);
                        }
                    });
                }
            });
        });
    }
}