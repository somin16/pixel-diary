import Phaser from "phaser";
import { updateHP } from "../../player/Hp";

export default class MagicSlime extends Phaser.Physics.Arcade.Sprite {

    // 생성될 부모 클래스, x좌표, y좌표, 난이도 증가 가중치인 status 
    constructor(scene, x, y, monsterStatus) {

        // scene의 x좌표 y좌표에 해당 스프라이트를 가진 개체 소환
        super(scene, x, y, "magic_slime");

        // 현재 씬과 물리엔진 시스템에 this(마법사 슬라임)을 추가
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 스탯 
        this.isElite = false;          // 엘리트 몬스터 확인용
        this.monsterID = 5;            // 몬스터 번호
        this.hp = 20 + monsterStatus;  // 체력
        this.damage = -5;              // 대미지
        this.resistance = 0;           // 공격을 받았을때 밀려나는 저항정도
                                       // ※ 1은 저항없음, 0에 가까울수록 안밀린다

        this.isHit = false; // 플레이어에게 공격을 받았는지 확인용
        this.setScale(2);   // 이미지 크기조정
        this.play("magic_slime_move_animation", true);

        // 패턴 확인용
        this.isAttack = false;

        // 공격 타이머
	    scene.magicSlimeAttackEvent = scene.time.addEvent({
            delay: 5000,
            callback: () => this.attackReady(scene.player),
            callbackScope: scene,
            loop: true,
	    });

        // 페이저기능, 애니메이션이 넘어갈때마다 작동
        this.on(Phaser.Animations.Events.ANIMATION_UPDATE, this.cheackAnimationFrame, this);
    }

    // 움직임 애니메이션
    move(player) { // 매게변수 플레이어

        if (this.isHit) return; // 플레이어게 공격을 받는중이면 실행x

        // 공격중이여도 move()를 멈춘다
        if (this.isAttack == true) return; 

        // 스프라이트 프레임 받기
        const thisFrame = this.anims.currentFrame.index;

        // 8번 프레임에 들어오면 활성화
        if ([8].includes(thisFrame)) {
        
            this.fireBallShot = true;
        }

        // 슬라임이 플레이어에게 33의 속도로 다가간다
        this.scene.physics.moveToObject(this, player, 33);

        // 몬스터가 바라보는 방향에 따라 위치 변경
        // 플레이어를 기준으로 왼쪽에 있으면 오른쪽을 보고 반대면 왼쪽을 본다
        if (this.x > player.x) this.setFlipX(false);
        else this.setFlipX(true);
    }

    // 애니메이션 프레임 체크
    cheackAnimationFrame() { 

        const thisFrame = this.anims.currentFrame.index;

        // 6번째 프레임에 발사
        if ([6].includes(thisFrame)) {
            this.shootFireBall();
        }
    }

    // 공격
    attackReady() {

        if (!this.active) return;

        this.isAttack = true;

        this.body.setVelocity(0,0);
        this.play("magic_slime_attack_animation", true);

        // 패턴이 끝나면 다시 움직이기
        this.scene.time.delayedCall(1500, () => {

            this.isAttack = false;
            this.play("magic_slime_move_animation", true);
        });
    }

    // 화염구 발사
    shootFireBall() {

        const posX = this.x;
        const posY = this.y;

        this.fireBallShot = false;

        // 화염구 생성
        const fireBallEff = this.scene.physics.add.sprite(posX, posY, "fire_ball");
        fireBallEff.setScale(1.5);
        fireBallEff.setDepth(1);

        this.scene.physics.moveToObject(fireBallEff, this.scene.player, 200);

        // 피격 이펙트(지금 모든 대미지 로직이 몬스터에 묶여 있기에 구분을 위해 하나 새로 만들었습니다)
        this.scene.physics.add.overlap(fireBallEff, this.scene.player, (fireball, player) => {

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
            if(fireBallEff.active) { 
                
                fireBallEff.destroy();
            }
        })
    }
}