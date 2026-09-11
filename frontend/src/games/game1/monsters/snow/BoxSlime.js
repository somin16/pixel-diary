import Phaser from "phaser";

export default class BoxSlime extends Phaser.Physics.Arcade.Sprite {

    // 생성될 부모 클래스, x좌표, y좌표, 난이도 증가 가중치인 status 
    constructor(scene, x, y, monsterStatus) {

        // scene의 x좌표 y좌표에 해당 스프라이트를 가진 개체 소환
        super(scene, x, y, "box_slime");

        // 물리엔진 추가
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 스탯 
        this.isElite = true;           // 엘리트 몬스터 확인용(박스 슬라임은 엘리트 몬스터의 보상을 주기에 엘리트로 설정)
        this.monsterID = 15;           // 몬스터 번호
        this.hp = 15 + monsterStatus;  // 체력
        this.damage = -2;              // 대미지
        this.resistance = 1;           // 공격을 받았을때 밀려나는 저항정도
                                       // ※ 1은 저항없음, 0에 가까울수록 안밀린다

        this.isHit = false; // 플레이어에게 공격을 받았는지 확인용
        this.setScale(2);   // 이미지 크기조정
        this.play("box_slime_move_animation", true);
    }

    // 움직임 애니메이션
    move(player) { // 매게변수 플레이어

        if (this.isHit) return; // 플레이어게 공격을 받는중이면 실행x

        // 이동속도
        this.scene.physics.moveToObject(this, player, 55);

        // 몬스터가 바라보는 방향에 따라 위치 변경
        // 플레이어를 기준으로 왼쪽에 있으면 오른쪽을 보고 반대면 왼쪽을 본다
        if (this.x > player.x) this.setFlipX(false);
        else this.setFlipX(true);
    }
}