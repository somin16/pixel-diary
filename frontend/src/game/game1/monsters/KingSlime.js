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
        this.hp = 15 + monsterStatus;         // 체력
        this.damage = -10;                    // 대미지
        this.resistance = 0;                  // 공격을 받았을때 밀려나는 저항정도
                                              // ※ 1은 저항없음, 0에 가까울수록 안밀린다

        this.isHit = false; // 플레이어에게 공격을 받았는지 확인용
        this.setScale(3);   // 이미지 크기조정
        this.setDepth(10);     // 다른 몬스터에게 가려지지않도록 레이어를 조금 위로 설정
        this.play("king_slime_move_animation", true); // 애니메이션 재생

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
}