import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  // perload: 이미지 불러오기
  preload() {

    // 이미지에는 모두 언더바를 넣는것으로 하겠습니다(가독성을 위해)

    // 플레이어 이미지
    this.load.image("player_stop", "/assets/game1/Player/stop.png");

    // 플레이어 이동 이미지
    this.load.image("player_move1", "/assets/game1/Player/move1.png");
    this.load.image("player_move2", "/assets/game1/Player/move2.png");
    this.load.image("player_move3", "/assets/game1/Player/move3.png");

    // 공격 이미지
    this.load.image("blade_1", "/assets/game1/Attacks/Blade/1.png");
    this.load.image("blade_2", "/assets/game1/Attacks/Blade/2.png");
    this.load.image("blade_3", "/assets/game1/Attacks/Blade/3.png");

    // 몬스터 이미지
    this.load.image("slime_stop", "/assets/game1/Monster/Nomal/slime.png"); // 슬라임(몬스터1)

    // 타일
    this.load.image("map1_tile1", "/assets/game1/Tile/map1/tile1.png");

    // 경험치 구슬
    this.load.image("expBall", "/assets/game1/Object/Exp/exp.png");

    // 경험치바
    this.load.image("Bar_BackGorund", "/assets/game1/Ui/Bar_BackGorund.png");
    this.load.image("expBar", "/assets/game1/Ui/expBar.png");
  }

  create() { // create: 말그대로 생성, 오브젝트를 작성하는 곳

    // 기본배경색(나중에 지울거임)
    this.cameras.main.setBackgroundColor("#2d2d2d");

    // 타일맵 깔기
    // 4000x4000에 규격에 맞춰서 깔아준다
    this.add.tileSprite(0, 0, 4000, 4000, "map1_tile1").setScale(2);

    // 플레이어 생성
    this.player = this.physics.add.sprite(400, 300, "player_stop");
    this.player.setDisplaySize(32, 32); // 해상도 조정

    // UI 작성
    // ====================경험치====================

    // 경험치바 위치
    const EXP_BAR_POS_X = this.cameras.main.width / 2;
    const EXP_BAR_POS_Y = this.cameras.main.height / 15;

    const ADD_EXP_POS_X = EXP_BAR_POS_X - 150;

    // 경험치 바 배경
    // nieslice는 상하좌우 n픽셀은 건들지않고 크기를 조정할 수 있다.
    // (x,y, 텍스쳐이름, 프레임, 가로, 세로, 보호픽셀 좌,우,위,아래)
    this.expBar = this.add.nineslice(EXP_BAR_POS_X, EXP_BAR_POS_Y, 'Bar_BackGorund', 0, 16, 8, 1, 1, 1, 1); 
    this.expBar.setScrollFactor(0); // 카메라를 따라오도록 설정한다
    this.expBar.width = 150; // 넓이 설정
    this.expBar.setDepth(100); // 레이어 우선순위(높을수록 우선)
    this.expBar.setScale(2);

    // 경험치
    this.addExpValue = this.add.nineslice(ADD_EXP_POS_X, EXP_BAR_POS_Y, 'expBar', 0, 16, 8, 1, 1, 1, 1); 
    this.addExpValue.setOrigin(0, 0.5); // 왼쪽에서 오른쪽으로 늘어나게 한다
    this.addExpValue.setScrollFactor(0); // 카메라를 따라오도록 설정한다
    this.addExpValue.setDepth(101); // 해당 스프라이트를 최상단 레이어에 놓는다
    this.addExpValue.setScale(2);

    this.MAX_EXP = 100; // 최대값 100%의 상수 설정
    this.expCount = 0; // 시작은 0으로

    this.addExpValue.setVisible(false); // 시작할때 채워지는 경험치 가리기


    // 경험치 구슬 그룹
    this.expBalls = this.physics.add.group();

    // 경험치 획득
    // 닿으면~ 파괴하고 AddExp(10)
    this.physics.add.overlap(this.player, this.expBalls, (player, expBalls) => {

      expBalls.destroy();
      this.addExp(10);

    },null, this
  );

    // ==================여기까지 경험치==================

    // 몬스터 생성

    // 몬스터 그룹
    this.monsters = this.physics.add.group();

    for (let i = 0; i < 3; i++) {
      // Phaser.Math.Between : 두 좌표 사이의 랜덤한 좌표
      let randomX = Phaser.Math.Between(200, 600);
      let randomY = Phaser.Math.Between(0, 100);

      let slime = this.monsters.create(randomX, randomY, "slime_stop");

      slime.hp = 3;
      slime.isHit = false;
      slime.setDisplaySize(32, 32);
    }

    // 카메라를 플레이어에 맞춰서 이동
    this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

    // 플레이어 움직임 애니메이션
    // anims: 이미지를 조합하여 애니메이션을 만들어준다
    this.anims.create({
      key: "move_animation",
      frames: [{ key: "player_move1" }, { key: "player_move2" }, { key: "player_move3" }],
      frameRate: 10,
      repeat: -1,
    });

    // 기본 공격(블레이드) 애니메이션
    this.anims.create({
      key: "blade_animation",
      frames: [{ key: "blade_1" }, { key: "blade_2" }, { key: "blade_3" }],
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
      this.player.play("move_animation", true);
    } else {
      // .stop : 애니메이션 중지
      this.player.stop();
      this.player.setTexture("player_stop"); // 중지하고 이미지 변경
    }

    // ===============||여기부터 몬스터||=================

    // 몬스터1(슬라임)

    this.monsters.getChildren().forEach((slime) => {
      if (slime.active) {
        // moveToObject: A가 B에게 C의 속도로 다가간다

        if (slime.isHit != true) {
          this.physics.moveToObject(slime, this.player, 100);
        }
      }
    });
  }

  // 경험치 구슬 생성
  expBallAdd(POS_X, POS_Y) {
    const expBall = this.expBalls.create(POS_X, POS_Y, "expBall");
    expBall.setScale(2);
  }

  addExp(Value) {

    this.expCount += Value;

    // 최대치 넘었을때 일단 고정해두기
    if (this.expCount >= this.MAX_EXP) {
      this.expCount = this.MAX_EXP;
    }

    if (this.expCount <= 0) {

      this.addExpValue.setVisible(false);
    }

    else {

      this.addExpValue.setVisible(true);

      const percent = this.expCount / this.MAX_EXP; //퍼센트 계산

      const EXP_BAR_PERCENT_VALUE = Math.max(2, 150 * percent);
      this.addExpValue.width = EXP_BAR_PERCENT_VALUE; 
    }
  }

  // 공격 애니메이션
  autoAttack() {

    // 플레이어의 위치를 받고
    const POS_X = this.player.x;
    const POS_Y = this.player.y;

    // 플레이어의 방향을 받는다
    const isLeft = this.player.flipX;

    // 좌우에 따라서 생성 위치를 변경
    const OFFSET_X = isLeft ? -50 : 50;

    // 이펙트 생성
    // 기본공격(블레이드)
    const atkEff = this.physics.add.sprite(POS_X + OFFSET_X, POS_Y, "blade_1");
    atkEff.setScale(4);
    atkEff.setFlipX(isLeft);
    atkEff.play("blade_animation");

    // 공격 판정
    // 유니티의 OnColider2D
    this.physics.add.overlap(atkEff, this.monsters, (damage, monster) => {
      // 이미 타격중인 몬스터는 무시함
      if (monster.isHit) return;

      // 타격 처리 시작
      monster.isHit = true;
      monster.hp -= 1; // 1만큼 체력 감소(차후에 공격력 할당)
      monster.setTint(0xffffff); // 히트효과

      // 넉백
      const knockback = 150;
      if (isLeft) {
        // 내가 왼쪽을 보고 쳤으면 슬라임을 더 왼쪽(- 방향)으로 밀어버림
        monster.body.setVelocityX(-knockback);
      } else {
        monster.body.setVelocityX(knockback);
      }

      // 위 아래
      monster.body.setVelocityY(Phaser.Math.Between(-100, 100));

      // 죽었으면~
      if (monster.hp <= 0) {
        this.expBallAdd(monster.x, monster.y);
        monster.destroy(); // 체력이 다 달면 없애기
      }

      // 살았으면~
      else {
        this.time.delayedCall(200, () => {
          if (monster.active) {
            monster.clearTint(); // 타격 이펙트 되돌리기
            monster.isHit = false;
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
