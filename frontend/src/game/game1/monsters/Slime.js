import Phaser from "phaser";

export default class Slime extends Phaser.Physics.Arcade.Sprite {

    // 생성될 부모 클래스, x좌표, y좌표, 난이도 증가 가중치인 status 
    constructor(scene, x, y, monsterStatus) {

        // scene의 x좌표 y좌표에 slime_move1의 이미지를 가진 개체를 소환
        super(scene, x, y, "slime_move1");

        // 현재 씬과 물리엔진 시스템에 this(슬라임)을 추가
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 스탯 
        this.monsterID = 1;            // 몬스터 번호
        this.hp = 5 + monsterStatus;   // 체력
        this.damage = -5;              // 대미지
        this.resistance = 1;           // 공격을 받았을때 밀려나는 저항정도
                                       // ※ 1은 저항없음, 0에 가까울수록 안밀린다

        this.isHit = false; // 플레이어에게 공격을 받았는지 확인용
        this.setScale(2);   // 이미지 크기조정
        this.play("slime_animation", true); // 애니메이션 재생
    }

    // 슬라임 움직임 애니메이션
    // 굳이 slimeMove라고 안적어도 이미 클래스 선언에서 다 분리가 돼서 그냥 move라고 적었습니다
    move(player) { // 매게변수 플레이어

        if (this.isHit) return; // 플레이어게 공격을 받는중이면 실행x

        // 슬라임이 플레이어에게 50의 속도로 다가간다
        this.scene.physics.moveToObject(this, player, 50);

        // 몬스터가 바라보는 방향에 따라 위치 변경
        // 플레이어를 기준으로 왼쪽에 있으면 오른쪽을 보고 반대면 왼쪽을 본다
        if (this.x > player.x) this.setFlipX(false);
        else this.setFlipX(true);
    }
}