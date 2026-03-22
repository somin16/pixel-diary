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

    // 공통으로 사용하는 UI바 배경
    this.load.image("Bar_BackGround", "/assets/game1/Ui/Bar_BackGround.png");

    // HP바
    this.load.image("hpBar", "/assets/game1/Ui/hpBar.png");

    // 경험치 구슬
    this.load.image("expBall", "/assets/game1/Object/Exp/exp.png");

    // 경험치바
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
    this.player.hp = 100;
    this.player.isDamage = false; // 플레이어 피격 감지(무적시간)
    this.player.setScale(2); // 해상도 조정

    // UI 작성

    // ======================HP=====================

    // 배경
    this.hpBar = this.add.nineslice(0, 0, 'Bar_BackGround', 0, 8, 4, 1, 1, 1, 1);
    this.hpBar.width = 20;
    this.hpBar.setDepth(100); // 레이어 우선순위(높을수록 우선)
    this.hpBar.setScale(2); // setScale: 해상도 조정, N배만큼 키워준다

    // 실제 차오르는 체력
    this.addHPValue = this.add.nineslice(0, 0, 'hpBar', 0, 8, 4, 1, 1, 1, 1);
    this.addHPValue.width = 20;
    this.addHPValue.setDepth(101);
    this.addHPValue.setOrigin(0, 0.5);
    this.addHPValue.setScale(2); // setScale: 해상도 조정, N배만큼 키워준다

    this.MAX_HP = 100;


    // ====================경험치====================

    // 경험치바 위치
    const EXP_BAR_POS_X = this.cameras.main.width / 2;
    const EXP_BAR_POS_Y = this.cameras.main.height / 15;

    // 차오르는 경험치바 한정 위치
    const ADD_EXP_POS_X = EXP_BAR_POS_X - 150;

    // 경험치 바 배경(expBar)
    // nieslice는 상하좌우 n픽셀은 건들지않고 크기를 조정할 수 있다.
    // (x,y, 텍스쳐이름, 프레임, 가로, 세로, 보호픽셀 좌,우,위,아래)
    this.expBar = this.add.nineslice(EXP_BAR_POS_X, EXP_BAR_POS_Y, 'Bar_BackGround', 0, 16, 8, 1, 1, 1, 1); 
    this.expBar.setScrollFactor(0); // 카메라를 따라오도록 설정한다
    this.expBar.width = 150; // 배경UI 넓이 설정
    this.expBar.setDepth(100); // 레이어 우선순위(높을수록 우선)
    this.expBar.setScale(2); // setScale: 해상도 조정, N배만큼 키워준다

    // 경험치
    this.addExpValue = this.add.nineslice(ADD_EXP_POS_X, EXP_BAR_POS_Y, 'expBar', 0, 16, 8, 1, 1, 1, 1); 
    this.addExpValue.setOrigin(0, 0.5); // 왼쪽에서 오른쪽으로 늘어나게 한다
    this.addExpValue.setScrollFactor(0); // 카메라를 따라오도록 설정한다
    this.addExpValue.setDepth(101); // 해당 스프라이트를 최상단 레이어에 놓는다
    this.addExpValue.setScale(2);

    this.MAX_EXP = 100; // 경험치 최댓값 상수 설정
    this.expCount = 0; // 시작은 0으로

    this.addExpValue.setVisible(false); // setVisible: 개체 보이기/숨기기(기본 true)
                                        // 시작할때 채워지는 경험치 가리기


    // 경험치 구슬 그룹
    this.expBalls = this.physics.add.group();

    // 경험치 획득
    // 닿으면~ 파괴하고 AddExp(10)
    this.physics.add.overlap(this.player, this.expBalls, (player, expBalls) => {

      expBalls.destroy();
      this.addExp(2);

    },null, this
  );

    // ==================여기까지 경험치==================

    // 몬스터 그룹
    this.monsters = this.physics.add.group();

    // 몬스터 피격시~
    this.physics.add.overlap(this.player, this.monsters, (player, monster) => {

      if (player.isDamage) return; // 피해 입는중이면 패스

      this.hpRecount(monster.damage);

      player.isDamage = true;
      player.setTint(0xff0000); // 피격 이펙트(붉은색)

      // 0.2초후에 피격종료
      this.time.delayedCall(200, () => {
        player.isDamage = false;
        player.clearTint(); // 피격 이펙트 제거
      });

    }, null, this
  );

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

    // 몬스터생성 이벤트
    this.time.addEvent({
      delay: 2000,
      callback: this.monsterSpawn,
      callbackScope: this,
      loop: true,
    })

    // 방향키 입력
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {

    // 기본 설정
    const speed = 150; // 속도
    this.player.body.setVelocity(0); // 중력x

    let isMove = false;

    // HP바 위치
    this.hpBar.setPosition(this.player.x , this.player.y + 25);
    this.addHPValue.setPosition(this.player.x - (this.hpBar.width / 2 + 10), this.player.y + 25);    

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
    } 
    
    else if (this.cursors.down.isDown) {

      this.player.body.setVelocityY(speed);
      isMove = true;
    }

    // 이동시 ~ 애니메이션
    if (isMove) {

      this.player.play("move_animation", true);
    } 
    
    else {
      
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
          this.physics.moveToObject(slime, this.player, 50);
        }
      }
    });
  }

  // 몬스터 스폰 클래스(기존의 반복문을 대체)
  monsterSpawn() {

    // 생성범위
    const SPAWN_RADIUS = 400;
    // Between을 통해 랜덤한 각도를 뽑아낸다
    const RANDOM_ANGLE = Phaser.Math.FloatBetween(0, Math.PI * 2);

    // 플레이어의 현재 위치와 비교하여 원의 테두리 좌표에 몬스터가 스폰될 위치를 정합니다
    const SPAWN_X = this.player.x + Math.cos(RANDOM_ANGLE) * SPAWN_RADIUS;
    const SPAWN_Y = this.player.y + Math.sin(RANDOM_ANGLE) * SPAWN_RADIUS;

    // 설명: 플레이어를 기준으로 반지름이 400인 원을 그린뒤 그 원의 테두리를 기준으로 랜덤하게 몬스터를 소환한다

    // 슬라임 생성
    let slime = this.monsters.create(SPAWN_X, SPAWN_Y, "slime_stop");
    slime.hp = 3;
    slime.damage = -5;
    slime.isHit = false;
    slime.setScale(2);
  }

  // 경험치 구슬 생성
  expBallAdd(POS_X, POS_Y) {
    const expBall = this.expBalls.create(POS_X, POS_Y, "expBall");
    expBall.setScale(2);
  }

  // 경험치 추가
  addExp(Value) { // 매게변수명 Value를 받는다

    this.expCount += Value; // 위에서 선언한 상수 expCount를 활용

    // 최대치 넘었을때 일단 고정해두기
    if (this.expCount >= this.MAX_EXP) {
      this.expCount = this.MAX_EXP;
    }

    // 0보다 작으면 안보여야하니 .setVisible을 꺼준다
    if (this.expCount <= 0) {

      this.addExpValue.setVisible(false);
    }

    else {

      this.addExpValue.setVisible(true);

      const percent = this.expCount / this.MAX_EXP; //퍼센트 계산

      const EXP_BAR_PERCENT_VALUE = Math.max(2, 150 * percent);// 2: setScale 즉 처음 생성될때부터 이미지 크기 정해놓는것
																													     // 150 * percent인 이유: 150이 기본 크기여서 150의 n%로 하면 딱 맞는다  
      this.addExpValue.width = EXP_BAR_PERCENT_VALUE; // 계산 완료된걸 넣어준다
    }
  }

  // hp가 변화됐을때 적용되는 클래스, 기본적으로 EXP와 작동방식이 같다
  hpRecount(Value) {

    this.player.hp += Value;

    // 최대 HP
    if (this.player.hp >= this.MAX_HP) {

      this.player.hp = this.MAX_HP;
    }

    // 0이 되면, 나중에 여기에 게임오버를 넣을것
    // 지금은 그냥 체력바 꺼지고 끝
    if (this.player.hp <= 0) {
      this.addHPValue.setVisible(false);
    }

    else {
      const percent = this.player.hp / this.MAX_HP;

      const HP_BAR_PERCENT_VALUE = Math.max(2, 20 * percent);
      this.addHPValue.width = HP_BAR_PERCENT_VALUE
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
      monster.setTintFill(0xffffff); // 히트효과
                                     // setTint와는 조금 다른 setTintFill은 스프라이트의 명도 조절이 아닌 스프라이트 위에 색 자체를 덮어버린다

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

        // 0.15초후에 무적판정 종료
        this.time.delayedCall(150, () => {
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
