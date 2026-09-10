import Phaser from "phaser";
import { spawnBoxSlime, spawnRudolpSlime, spawnSantaSlime } from "../Monsters";

export default class XmasSlime extends Phaser.Physics.Arcade.Sprite {

    // 생성될 부모 클래스, x좌표, y좌표, 난이도 증가 가중치인 status 
    constructor(scene, x, y, monsterStatus) {

        // scene의 x좌표 y좌표에 해당 스프라이트를 가진 개체 소환
        super(scene, x, y, "x_mas_slime");

        // 물리엔진 추가
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 스탯 
        this.isElite = false;          // 엘리트 몬스터 확인용
        this.monsterID = 12;           // 몬스터 번호
        this.hp = 99999 + monsterStatus;// 체력(이 몬스터는 무적입니다)
        this.damage = -7;              // 대미지
        this.resistance = 0;           // 공격을 받았을때 밀려나는 저항정도
                                       // ※ 1은 저항없음, 0에 가까울수록 안밀린다

        this.isHit = false; // 플레이어에게 공격을 받았는지 확인용
        this.setScale(2);   // 이미지 크기조정
        this.play("x_mas_slime_move_animation", true);

        // ======크리스마스 슬라임 전용 스탯=======
        this.dashCount = 0;
        this.dashCooldown = false;
    }

    // 움직임 애니메이션
    move(player) { // 매게변수 플레이어

        if (!this.isDash) {

            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

            this.scene.physics.velocityFromRotation(angle, 400 , this.body.velocity);

            // 몬스터가 바라보는 방향에 따라 위치 변경
            // 플레이어를 기준으로 왼쪽에 있으면 오른쪽을 보고 반대면 왼쪽을 본다
            if (this.x > player.x) this.setFlipX(false);
            else this.setFlipX(true);

            this.isDash = true;
        }

        // 플레이어와 800이상의 거리가 벌어지면 다시 한번 돌진
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        
        // 카운트가 2 이하일땐 계속 이동
        if (distance > 800 && this.dashCount < 2 && this.isDash == true && this.dashCooldown == false) {

            this.dashCount++;
            console.log("오름");

            this.isDash = false;
            this.dashCooldown = true;

            // 에러 방지를 위해 300ms동안에는 dashCooldown을 건드리지않음
            this.scene.time.delayedCall(300, ()=> {
                this.dashCooldown = false;
            });
        }

        // 마지막 돌진시엔 자동처치하고 3마리의 몬스터를 소환
        if (distance > 900 && this.dashCount == 2) {

            spawnSantaSlime(this.x, this.y, this.scene);
            spawnBoxSlime(this.x + 20, this.y + 20, this.scene);
            spawnRudolpSlime(this.x - 20, this.y - 20, this.scene);

            // 와장창 느낌을 위해 카메라 흔들기
            this.scene.cameras.main.shake(200, 0.01);
            this.destroy();
        }
    }
}