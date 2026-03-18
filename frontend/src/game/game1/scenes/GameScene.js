import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  // preload 유니티에서 미리 이미지나 프리팹 에셋 선언하는 느낌?
  preload() {
    // 플레이어 이미지
    this.load.image("py_img", "/assets/game1/Py/stop.png");

    // 플레이어 이동 이미지
    this.load.image("move1", "/assets/game1/Py/move1.png");
    this.load.image("move2", "/assets/game1/Py/move2.png");
    this.load.image("move3", "/assets/game1/Py/move3.png");

    // 공격 이미지
    this.load.image("atk1_1", "/assets/game1/Attacks/attack1/1.png");
    this.load.image("atk1_2", "/assets/game1/Attacks/attack1/2.png");
    this.load.image("atk1_3", "/assets/game1/Attacks/attack1/3.png");

    // 몬스터 이미지
    this.load.image("slime_img", "/assets/game1/Monster/Nomal/slime.png"); // 슬라임(몬스터1)

    // 타일
    this.load.image("map1_tile1", "/assets/game1/Tile/map1/tile1.png");
  }

  create() {
    // 기본배경색(나중에 지울거임)
    this.cameras.main.setBackgroundColor("#2d2d2d");

    // 타일맵 깔기
    this.add.tileSprite(0, 0, 4000, 4000, "map1_tile1").setScale(2);

    // 플레이어 생성
    this.player = this.physics.add.sprite(400, 300, "py_img");
    this.player.setDisplaySize(32, 32); // 해상도 조정

    // 몬스터 생성

    // 몬스터 그룹
    this.monsters = this.physics.add.group();

    for (let i = 0; i < 3; i++) {
      // Phaser.Math.Between : 두 좌표 사이의 랜덤한 좌표
      let randomX = Phaser.Math.Between(200, 600);
      let randomY = Phaser.Math.Between(0, 100);

      let monster1 = this.monsters.create(randomX, randomY, "slime_img");

      monster1.hp = 3;
      monster1.isHit = false;
      monster1.setDisplaySize(32, 32);
    }

    // 카메라를 플레이어에 맞춰서 이동
    this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

    // 플레이어 움직임 애니메이션
    this.anims.create({
      key: "move_ani",
      frames: [{ key: "move1" }, { key: "move2" }, { key: "move3" }],
      frameRate: 10,
      repeat: -1,
    });

    // anims: 애니메이션
    // 1번 공격 애니메이션
    this.anims.create({
      key: "atk1_ani",
      frames: [{ key: "atk1_1" }, { key: "atk1_2" }, { key: "atk1_3" }],
      frameRate: 10,
      repeat: 0,
    });

    // 정해진 딜레이(ms)마다 이벤트 발생
    // 자동공격 이벤트
    this.time.addEvent({
      delay: 1500,
      callback: this.autoAttack,
      callbackScope: this,
      loop: true,
    });

    // 방향키 입력
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    // 기본 설정
    const speed = 150; // 속도
    this.player.body.setVelocity(0); // 중력x

    let isMove = false;

    // 방향키 입력에 따른 플레이어 이동 로직
    // 왼쪽
    if (this.cursors.left.isDown) {
      isMove = true;

      this.player.body.setVelocityX(-speed);
      this.player.setFlipX(true); // 좌우반전
    }
    // 오른쪽
    else if (this.cursors.right.isDown) {
      isMove = true;

      this.player.body.setVelocityX(speed);
      this.player.setFlipX(false); // 좌우반전
    }

    // 위아래
    if (this.cursors.up.isDown) {
      this.player.body.setVelocityY(-speed);
      isMove = true;
    } else if (this.cursors.down.isDown) {
      this.player.body.setVelocityY(speed);
      isMove = true;
    }

    // 이동시 ~ 애니메이션
    if (isMove) {
      this.player.play("move_ani", true);
    } else {
      // player.stop : 애니메이션 중지
      this.player.stop();
      this.player.setTexture("py_img"); // 중지하고 이미지 변경
    }

    // ===============||여기부터 몬스터||=================

    // 몬스터1(슬라임)

    this.monsters.getChildren().forEach((monster1) => {
      if (monster1.active) {
        // moveToObject: A가 B에게 C의 속도로 다가간다

        if (monster1.isHit != true) {
          this.physics.moveToObject(monster1, this.player, 100);
        }
      }
    });
  }

  // 공격 애니메이션
  autoAttack() {
    const PosX = this.player.x;
    const PosY = this.player.y;

    const isLeft = this.player.flipX;

    const offsetX = isLeft ? -50 : 50;

    // 이펙트 생성
    const atkEff = this.physics.add.sprite(PosX + offsetX, PosY, "atk1_1");
    atkEff.setScale(4);
    atkEff.setFlipX(isLeft);
    atkEff.play("atk1_ani");

    // 공격 판정
    // 유니티의 OnColider2D
    this.physics.add.overlap(atkEff, this.monsters, (atk, moster) => {
      // 이미 타격중인 몬스터는 무시함
      if (moster.isHit) return;

      // 타격 처리 시작
      moster.isHit = true;
      moster.hp -= 1; // 1만큼 체력 감소(차후에 공격력 할당)
      moster.setTint(0xffffff); // 히트효과

      // 넉백
      const knockback = 250;
      if (isLeft) {
        // 내가 왼쪽을 보고 쳤으면 슬라임을 더 왼쪽(- 방향)으로 밀어버림
        moster.body.setVelocityX(-knockback);
      } else {
        moster.body.setVelocityX(knockback);
      }

      // 위 아래
      moster.body.setVelocityY(Phaser.Math.Between(-100, 100));

      // 죽었으면~
      if (moster.hp <= 0) {
        moster.destroy(); // 체력이 다 달면 없애기
      }

      // 살았으면~
      else {
        this.time.delayedCall(200, () => {
          if (moster.active) {
            moster.clearTint(); // 타격 이펙트 되돌리기
            moster.isHit = false;
          }
        });
      }
    });

    // animationcomplete: 애니메이션이 끝날때
    atkEff.on("animationcomplete", () => {
      atkEff.destroy();
    });
  }
}
