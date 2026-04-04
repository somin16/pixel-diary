import Phaser from "phaser";

export default class CubeGolem extends Phaser.Physics.Arcade.Sprite {

    // 생성될 부모 클래스, x좌표, y좌표, 난이도 증가 가중치인 status 
    constructor(scene, x, y, monsterStatus) {

        // scene의 x좌표 y좌표에 cube_golem_move의 이미지를 가진 개체를 소환
        super(scene, x, y, "cube_golem_move");

        // 현재 씬과 물리엔진 시스템에 this(큐브 골렘)을 추가
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 스탯 
        this.monsterID = 2;             // 몬스터 번호
        this.hp = 20 + monsterStatus;    // 체력
        this.damage = -7;               // 대미지
        this.resistance = 0;            // 공격을 받았을때 밀려나는 저항정도
                                        // ※ 1은 저항없음, 0에 가까울수록 안밀린다
        
        this.isHit = false;  // 플레이어에게 공격을 받았는지 확인용
        this.setScale(3);   // 이미지 크기조정
        this.play("cube_golem_animation"); // 애니메이션 재생
    }

    // 큐브골렘 움직임 애니메이션
    // 굳이 slimeMove라고 안적어도 이미 클래스 선언에서 다 분리가 돼서 그냥 move라고 적었습니다
    move(player) { // 매게변수 플레이어

        // ※ 큐브골렘은 공격을 받는중에도 플레이어에게 다가간다[if(isHit) return이 없다]
        
        // 현재 큐브골렘의 애니메이션 프레임을 tihsFrame으로 받고
        const thisFrame = this.anims.currentFrame.index;

        // 그게 1,4,7,10번째 프레임이면 이동을 멈추고
        if ([1, 4, 7, 10].includes(thisFrame)) {

            this.body.setVelocity(0, 0);
        } 
        
        // 아니면 100의 속도로 플레이어에게 다가간다
        else {

            this.scene.physics.moveToObject(this, player, 100);
            
            // 자연스러운 애니메이팅을 위해 큐브골렘이 움직일때만 방향을 전환한다
            if (this.x > player.x) this.setFlipX(false);
            else this.setFlipX(true);
        }
    }
}