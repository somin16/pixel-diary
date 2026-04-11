import Phaser from "phaser";

export default class Phalanx extends Phaser.Physics.Arcade.Sprite {

    // 생성될 부모 클래스, x좌표, y좌표, 난이도 증가 가중치인 status 
    constructor(scene, x, y, monsterStatus) {

        // scene의 x좌표 y좌표에 phalanx_move1의 이미지를 가진 개체를 소환
        super(scene, x, y, "phalanx_move1");

        // 현재 씬과 물리엔진 시스템에 this를 추가
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 스탯 
        // 난이도 조절을 위해 현재 버전은 다소 하향시켜놨습니다
        this.monsterID = 11;                  // 몬스터 번호 (엘리트몬스터는 11부터 시작하는걸로 구분하겠습니다)
        this.hp = 50 + (monsterStatus * 5);   // 체력
        this.damage = -8;                     // 대미지
        this.resistance = 0;                  // 공격을 받았을때 밀려나는 저항정도
                                              // ※ 1은 저항없음, 0에 가까울수록 안밀린다

        this.isHit = false; // 플레이어에게 공격을 받았는지 확인용
        this.setScale(2);   // 이미지 크기조정
        this.play("phalanx_animation", true); // 애니메이션 재생
    }

    // 움직임 애니메이션
    move(player) { // 매게변수 플레이어

        // 플레이어에게 85의 속도로 다가간다
        this.scene.physics.moveToObject(this, player, 85);

        // 몬스터가 바라보는 방향에 따라 위치 변경
        // 플레이어를 기준으로 왼쪽에 있으면 오른쪽을 보고 반대면 왼쪽을 본다
        if (this.x > player.x) this.setFlipX(false);
        else this.setFlipX(true);
    }
}