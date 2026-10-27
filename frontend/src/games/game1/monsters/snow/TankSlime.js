import Phaser from "phaser";
import { updateHP } from "../../player/Hp";

export default class TankSlime extends Phaser.Physics.Arcade.Sprite {

    // 생성될 부모 클래스, x좌표, y좌표, 난이도 증가 가중치인 status 
    constructor(scene, x, y, monsterStatus) {

        super(scene, x, y, "tank_slime_bottom");
        this.spawnTop();

        // 현재 씬과 물리엔진 시스템에 this를 추가
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 공격 좌표
        this.attackOffset = { x: 20, y: 0 };

        // 스탯 
        this.isBoss = true;                   // 보스 확인용
        this.monsterID = 102;                 // 몬스터 번호 (보스몬스터는 101부터 시작하는걸로 구분하겠습니다)
        this.hp = 200 + monsterStatus;        // 체력
        this.damage = -15;                    // 대미지
        this.resistance = 0;                  // 공격을 받았을때 밀려나는 저항정도
                                              // ※ 1은 저항없음, 0에 가까울수록 안밀린다

        this.isHit = false; // 플레이어에게 공격을 받았는지 확인용
        this.setScale(3);   // 이미지 크기조정
        this.setDepth(10);     // 다른 몬스터에게 가려지지않도록 레이어를 조금 위로 설정
        this.play("tank_slime_bottom_move_animation", true); // 애니메이션 재생

        // 실제 피격판정 설정
        this.body.setSize(48, 32);

        // 패턴 확인용 변수
        this.isAttack = false;
        this.isDash = false;
        this.isBack = false;
        this.isStop = false
    }

    // 상부 소환
    spawnTop() {

        this.top = this.scene.add.sprite(this.x, this.y, "tank_slime_top");
        this.top.setScale(3);
        this.top.setDepth(11);

        this.once(Phaser.GameObjects.Events.DESTROY, () => {
            this.top?.destroy();
            this.bombTimer?.remove();
        });

        // 정확한 프레임에 발사하도록 설정
        this.top.on(Phaser.Animations.Events.ANIMATION_UPDATE, (animation, frame) => {

            // 발사 애니메이션이 아니면 무시
            if (animation.key !== "tank_slime_top_shot_animation") return;

            // 3프레임일때만
            if (frame.index === 3) this.fireBomb();
        });
    }

    // move와 비슷한거라고 생각하시면됩니다(return때문에 분리)
    preUpdate(time, delta) {

        super.preUpdate(time, delta);

        // 오류방지용(상부가 없으면 리턴)
        if (!this.top) return;

        // 위치 맞추기
        this.top.setPosition(this.x, this.y);

        // 현재 발사중인지 확인
        const isShooting = this.top.anims.isPlaying && this.top.anims.currentAnim?.key === "tank_slime_top_shot_animation";

        // 발사중, 대시중이 아닐때만
        if (!isShooting && !this.isDash) {

            // 상부는 하부랑 다르게 플레이어를 계속 바라본다
            this.top.setFlipX(this.x <= this.scene.player.x);
        }

        // 피격시 틴트 이펙트도 함께 적용
        if (this.isTinted) {

            if (this.tintFill) this.top.setTintFill(this.tintTopLeft);
            else this.top.setTint(this.tintTopLeft);
        }

        else this.top.clearTint();
    }

    // 움직임 애니메이션
    move(player) { // 매게변수 플레이어

        // 대시중이면 move()를 멈춘다
        if (this.isDash == true || this.isStop == true) return;

        if (this.moveAngle === undefined) this.lockDirection(player);

        const speed = this.isBack ? 45 : 80;
        const angle = this.isBack ? this.moveAngle + Math.PI : this.moveAngle;

        this.scene.physics.velocityFromRotation(angle, speed, this.body.velocity);
    }

    // 이동방향 결정
    lockDirection(player) {

        this.moveAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

        // 몬스터가 바라보는 방향에 따라 위치 변경
        // 플레이어를 기준으로 왼쪽에 있으면 오른쪽을 보고 반대면 왼쪽을 본다
        if (this.x > player.x) this.setFlipX(false);
        else this.setFlipX(true);
    }

    // 소환시 플레이어쪽으로 돌진준비
    readyAttackDash() {

        // 이미 돌진중이거나 몬스터가 죽었으면 취소(버그방지용)
        if (this.isDash || !this.active) return;

        // 상하부 둘다 플레이어를 바라봄
        this.setFlipX(this.x <= this.scene.player.x);
        this.top.setFlipX(this.x <= this.scene.player.x);

        // 패턴확인용 변수변경
        this.isAttack = true;
        this.isDash = true;

        // 시작전 정지
        this.body.setVelocity(0, 0);

        const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
                
        // 해당 방향쪽으로 세로 600 가로 100의 투명도 40%의 빨간색 네모(redZone)을 소환합니다
        const redZone = this.scene.add.rectangle(this.x, this.y, 600, 100, 0xff0000, 0.4)
                .setOrigin(0, 0.5)              // 중앙정렬
                .setRotation(angleToPlayer)     // 방향은 자신을 기준으로 플레이어쪽의 방향
                .setDepth(9);                   // 킹슬라임보다 레이어 한단계 낮게

        // 1초뒤에 준비를 멈추고 돌진을 적용
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
                this.top.play("tank_slime_top_open_animation", true); // 애니메이션 재생

                // 그 후 타이머 설정
                this.scene.tankSlimeAttackEvent = this.scene.time.addEvent({
                    delay: 4000,
                    callback: () => this.redayShotBomb(this.scene.player),
                    callbackScope: this.scene,
                    loop: true,
                });
            }
        });
    }

    // 공격 좌표 계산
    getAttackPosition() {

        const dir = this.top.flipX ? 1 : -1;
        const scale = 3;

        return {
            x: this.top.x + this.attackOffset.x * scale * dir,
            y: this.top.y + this.attackOffset.y * scale,
        };
    }

    // 플레이어를 향해 지속적으로 포탄을 발사
    redayShotBomb() {

        // 50%확률로 뒤로 이동한다
        const BACK_PERCENT = 50;
        const GET_PERCENT = Phaser.Math.Between(1, 100);

        if (GET_PERCENT <= BACK_PERCENT) this.isBack = true;
        else this.isBack = false; 

        this.lockDirection(this.scene.player);

        this.isStop = false;

        // playerReverse: 스프라이트를 반대로해서 재생
        if (this.isBack) this.playReverse("tank_slime_bottom_move_animation", true)
        else this.play("tank_slime_bottom_move_animation", true); // 애니메이션 재생

        this.SHOT_COUNT = 3;
        this.shots = 0;

        this.bombTargetX = this.scene.player.x;
        this.bombTargetY = this.scene.player.y;

        this.bombTimer =  this.scene.time.addEvent({

            delay: 1000,
            loop: false,
            repeat: this.SHOT_COUNT - 1,
            callback: () => {

                if (!this.active) return;

                this.top.setFlipX(this.x <= this.scene.player.x);

                this.top.play("tank_slime_top_shot_animation");
            }
        });
    }

    // 멈춤
    stopMove() {

        this.stopTimer = this.scene.time.addEvent({

            delay: 500,
            loop: false,

            callback: () => {

                if(!this.active) return;
                this.isStop = true;
                this.body.setVelocity(0, 0);
                this.stop(); // 애니메이션 잠시 종료
            }
        })
    }

    // 포탄 발사 준비로직
    fireBomb() {

        if (!this.active) return;

        const attackPos = this.getAttackPosition();
        this.spawnBomb(attackPos.x, attackPos.y, this.bombTargetX, this.bombTargetY);

        this.shots++;

        // 다음 발사가 노릴 좌표 갱신
        this.bombTargetX = this.scene.player.x;
        this.bombTargetY = this.scene.player.y;

        if (this.shots >= this.SHOT_COUNT) this.stopMove();
    }

    // 포탄 생성
    spawnBomb(posX, posY, targetX, targetY) {

        // 랜덤으로 나갈 스프라이트와 가중치
        const BOMB_TEXTURES = [
            { key: "snow", weight: 0.90},
            { key: "red_slime_move1", weight: 0.08 },
            { key: "box", weight: 0.02 }
        ];

        const roll = Math.random();
            let cumulative = 0;
            let bombKey = BOMB_TEXTURES[0].key; // 오차 대비 기본값

        for (const { key, weight } of BOMB_TEXTURES) {
            cumulative += weight;
            if (roll < cumulative) {
                bombKey = key;
                break;
            }
        }

        const bomb = this.scene.physics.add.sprite(posX, posY, bombKey);

        bomb.setScale(3);
        bomb.setDepth(11);

        this.scene.physics.moveTo(bomb, targetX, targetY, 1000);
        bomb.setFlipX(this.x <= this.scene.player.x);

        this.scene.physics.add.overlap(bomb, this.scene.player, (bomb, player) => {
        
            if(player.isDamage) return;
        
            updateHP(this.scene.player, this.damage, this.scene);
                    
            player.isDamage = true;
            player.setTint(0xff0000); // 피격 이펙트(붉은색)
        
            // 0.3초후에 피격종료(좀더 길게 잡은 이유는 투사체가 다소 느리기 때문에 연타방지)
            this.scene.time.delayedCall(300, () => {
                player.isDamage = false;
                player.clearTint(); // 피격 이펙트 제거
            });
        });

        // 안맞을 경우를 대비해서 4초후 자동파괴 로직
        this.scene.time.delayedCall(4000, () => {
            if(bomb.active) { 
                
                bomb.destroy();
            }
        })
    }
}