import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  // perload: 이미지 불러오기
  preload() {

    // 이미지에는 모두 언더바를 넣는것으로 하겠습니다(가독성을 위해)

    // ========================플레이어 + 공격 이펙트=========================
    // 플레이어 이미지
    this.load.image("player_stop", "/assets/game1/Player/player_stop.png");

    // 플레이어 이동 이미지
    this.load.image("player_move1", "/assets/game1/Player/player_move1.png");
    this.load.image("player_move2", "/assets/game1/Player/player_move2.png");
    this.load.image("player_move3", "/assets/game1/Player/player_move3.png");

    // 공격 이미지
    this.load.image("blade_1", "/assets/game1/Attacks/Blade/blade_1.png");
    this.load.image("blade_2", "/assets/game1/Attacks/Blade/blade_2.png");
    this.load.image("blade_3", "/assets/game1/Attacks/Blade/blade_3.png");


    // ======================몬스터===================================
    // 몬스터 이미지

    // 슬라임(몬스터1)
    this.load.image("slime_stop", "/assets/game1/Monster/Nomal/slime_stop.png");


    // =======================타일======================================

    // 타일
    this.load.image("map1_tile1", "/assets/game1/Tile/map1/map1_tile1.png");


    // =========================UI=======================================
    // 공통으로 사용하는 UI바 배경
    this.load.image("background_bar", "/assets/game1/Ui/background_bar.png");

    // HP바
    this.load.image("hp_bar", "/assets/game1/Ui/hp_bar.png");

    // 경험치바
    this.load.image("exp_bar", "/assets/game1/Ui/exp_bar.png");

    // 레벨업 창 배경
    this.load.image("level_up_background", "/assets/game1/Ui/level_up_background.png");


    // 레벨업시에 사용할 아이콘들
    // =====================스킬 아이콘=====================================

    // 블레이드
    this.load.image("blade_icon", "/assets/game1/Ui/Skill_Icon/blade_icon.png");

    // 화살
    this.load.image("arrow_icon", "/assets/game1/Ui/Skill_Icon/arrow_icon.png");

    // 공격력
    this.load.image("damage_icon","/assets/game1/Ui/Skill_Icon/damage_icon.png");

    // 이동속도
    this.load.image("speed_icon","/assets/game1/Ui/Skill_Icon/speed_icon.png");


    // =====================오브젝트=========================================
    // 경험치 구슬
    this.load.image("exp_ball", "/assets/game1/Object/Exp/exp_ball.png");

    // 상자
    this.load.image("chest_level_1", "/assets/game1/Object/Chest/chest_level_1.png");

    // 고기(회복 아이템)
    this.load.image("meat", "/assets/game1/Object/DropItem/meat.png");

  }

  create() { // create: 말그대로 생성, 오브젝트를 작성하는 곳

    // 기본배경색(나중에 지울거임)
    this.cameras.main.setBackgroundColor("#2d2d2d");

    // 타일맵 깔기
    // 4000x4000에 규격에 맞춰서 깔아준다
    this.add.tileSprite(0, 0, 4000, 4000, "map1_tile1").setScale(2);

    // 플레이어 생성
    this.player = this.physics.add.sprite(400, 300, "player_stop");
    this.player.hp = 100; // 기본 체력
    this.player.damage = 1; // 기본 공격력
    this.player.speed = 0; // 레벨업시 추가될 이동속도 계산용
    this.player.isDamage = false; // 플레이어 피격 감지(무적시간)
    this.player.setScale(2); // 해상도 조정

    // UI 작성

    // ======================HP=====================

    // 배경
    this.hpBar = this.add.nineslice(0, 0, 'background_bar', 0, 8, 4, 1, 1, 1, 1);
    this.hpBar.width = 20;
    this.hpBar.setDepth(100); // 레이어 우선순위(높을수록 우선)
    this.hpBar.setScale(2); // setScale: 해상도 조정, N배만큼 키워준다

    // 실제 차오르는 체력
    this.addHPValue = this.add.nineslice(0, 0, 'hp_bar', 0, 8, 4, 1, 1, 1, 1);
    this.addHPValue.width = 20;
    this.addHPValue.setDepth(101);
    this.addHPValue.setOrigin(0, 0.5);
    this.addHPValue.setScale(2); // setScale: 해상도 조정, N배만큼 키워준다

    this.MAX_HP = 100;


    // ====================경험치====================

    // 경험치바 위치
    const expBarPosX = this.cameras.main.width / 2;
    const expBarPosY = this.cameras.main.height / 15;

    // 차오르는 경험치바 한정 위치
    const addExpPosX = expBarPosX - 150;

    // 경험치 바 배경(expBar)
    // nieslice는 상하좌우 n픽셀은 건들지않고 크기를 조정할 수 있다.
    // (x,y, 텍스쳐이름, 프레임, 가로, 세로, 보호픽셀 좌,우,위,아래)
    this.expBar = this.add.nineslice(expBarPosX, expBarPosY, 'background_bar', 0, 16, 8, 1, 1, 1, 1); 
    this.expBar.setScrollFactor(0); // 카메라를 따라오도록 설정한다
    this.expBar.width = 150; // 배경UI 넓이 설정
    this.expBar.setDepth(100); // 레이어 우선순위(높을수록 우선)
    this.expBar.setScale(2); // setScale: 해상도 조정, N배만큼 키워준다

    // 경험치
    this.addExpValue = this.add.nineslice(addExpPosX, expBarPosY, 'exp_bar', 0, 16, 8, 1, 1, 1, 1); 
    this.addExpValue.setOrigin(0, 0.5); // 왼쪽에서 오른쪽으로 늘어나게 한다
    this.addExpValue.setScrollFactor(0); // 카메라를 따라오도록 설정한다
    this.addExpValue.setDepth(101); // 해당 스프라이트를 최상단 레이어에 놓는다
    this.addExpValue.setScale(2);

    this.MAX_EXP = 100; // 경험치 최댓값 상수 설정
    this.expCount = 0; // 시작은 0으로

    this.addExpValue.setVisible(false); // setVisible: 개체 보이기/숨기기(기본 true)
                                        // 시작할때 채워지는 경험치 가리기



    // =================오브젝트 아이템들===================

    // 경험치 구슬 그룹
    this.expBalls = this.physics.add.group();

    // 상자 오브젝트 그룹
    this.chests = this.physics.add.group();

    // 드랍 아이템 오브젝트 그룹
    this.dropItems = this.physics.add.group();

    // 경험치 획득
    // 닿으면~ 파괴하고 AddExp(10)
    this.physics.add.overlap(this.player, this.expBalls, (player, expBalls) => {

      expBalls.destroy();
      this.addExp(50); // 테스트를 위해 경험치 25배 이벤트

    },null, this 
  );

    // 드랍 아이템(현재는 고기만 있지만, 차후에 더 추가 될수도 있음)
    this.physics.add.overlap(this.player, this.dropItems, (player, dropItem) => {

      dropItem.destroy();
      this.updateHP(this.MAX_HP / 2); // 최대 체력의 50%를 채워준다
      player.setTint(0x00ff00);

      // 0.1초후에 초록 이펙트 되돌리기
      this.time.delayedCall(200, () => {
        if (player.active) {
              player.clearTint(); // 이펙트 되돌리기
          }
        });

    },null, this
  );

    // ==================여기까지 경험치==================

    // 몬스터에 사용될 가중치
    // 해당 가중치를 통해 난이도 증가 시스템을 구현할 예정
    this.monsterStatus = 0;

    // 몬스터 그룹
    this.monsters = this.physics.add.group();

    // 몬스터 피격시~
    this.physics.add.overlap(this.player, this.monsters, (player, monster) => {

      if (player.isDamage) return; // 피해 입는중이면 패스

      this.updateHP(monster.damage);

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
      callback: this.spawnMonster,
      callbackScope: this,
      loop: true,
    });

    // 상자 생성 이벤트(현재는 게임 시작 5초후 플레이어 근처에 1회 자동 스폰되도록 임시설정)
    this.time.addEvent({
      delay: 5000,
      callback: this.spawnChest,
      callbackScope: this,
      loop: false,
    });

    // 30초마다 몬스터가 점점 빨라지고 체력이 증가하는 이벤트
    this.time.addEvent({
      delay: 30000,
      callback: this.monsterLevelUp,
      callbackScope: this,
      loop: true,
    });

    // 플레이어 체력 자연 회복 이벤트
    this.time.addEvent({
      delay: 1000,
      callback: () => this.updateHP(1), // 수치가 들어가는 클래스일 경우엔 괄호랑 화살표도 써줘야한다
      callbackScope: this,
      loop: true,
    });

    // 방향키 입력
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {

    // 기본 설정
    const speed = 150; // 기본 속도
    this.player.body.setVelocity(0); // 중력x

    let isMove = false;

    // HP바 위치
    this.hpBar.setPosition(this.player.x , this.player.y + 25);
    this.addHPValue.setPosition(this.player.x - (this.hpBar.width / 2 + 10), this.player.y + 25);    

    // 방향키 입력에 따른 플레이어 이동 로직
    // 왼쪽
    if (this.cursors.left.isDown) {
      isMove = true;

      this.player.body.setVelocityX(-speed - this.player.speed); // 기본속도 + 레벨업 보상으로 받은 이동속도도 함께 계산
      this.player.setFlipX(true); // 좌우반전
    }
    // 오른쪽
    else if (this.cursors.right.isDown) {
      isMove = true;

      this.player.body.setVelocityX(speed + this.player.speed);
      this.player.setFlipX(false); // 좌우반전
    }

    // 위아래
    if (this.cursors.up.isDown) {

      this.player.body.setVelocityY(-speed - this.player.speed);
      isMove = true;
    } 
    
    else if (this.cursors.down.isDown) {

      this.player.body.setVelocityY(speed + this.player.speed);
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

    // 몬스터 이동 로직

    this.monsters.getChildren().forEach((monsters) => {
      if (monsters.active) {
        // moveToObject: A가 B에게 C의 속도로 다가간다

        if (monsters.isHit != true) {
          this.physics.moveToObject(monsters, this.player, 50 + this.monsterStatus);

          // 몬스터가 바라보는 방향에 따라 위치 변경
          // 플레이어를 기준으로 왼쪽에 있으면 오른쪽을 보고 반대면 왼쪽을 본다
          if (monsters.x > this.player.x) monsters.setFlipX(false);
          else monsters.setFlipX(true);
        }
      }
    });
  }

  // 몬스터 스폰 클래스(기존의 반복문을 대체)
  spawnMonster() {

    // 생성범위
    const SPAWN_RADIUS = 400;
    // Between을 통해 랜덤한 각도를 뽑아낸다
    const randomAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

    // 플레이어의 현재 위치와 비교하여 원의 테두리 좌표에 몬스터가 스폰될 위치를 정합니다
    const SPAWN_X = this.player.x + Math.cos(randomAngle) * SPAWN_RADIUS;
    const SPAWN_Y = this.player.y + Math.sin(randomAngle) * SPAWN_RADIUS;

    // 설명: 플레이어를 기준으로 반지름이 400인 원을 그린뒤 그 원의 테두리를 기준으로 랜덤하게 몬스터를 소환한다

    // 슬라임 생성
    let slime = this.monsters.create(SPAWN_X, SPAWN_Y, "slime_stop");
    slime.hp = 3 + this.monsterStatus / 3; // 가중치를 넣는 방식으로 변경
    slime.damage = -5;
    slime.isHit = false;
    slime.setScale(2);
  }

  // 몬스터 레벨업(스탯 증가)
  monsterLevelUp() {

    this.monsterStatus += 1; // 현재는 임시로 전체 가중치1 증가로 설정
  }

  // 상자 생성
  spawnChest() {

    // 현재 임시로 몬스터 생성 방식과 같은 방식을 채택하였습니다.

    // 생성범위
    const SPAWN_RADIUS = 100;
    // Between을 통해 랜덤한 각도를 뽑아낸다
    const randomAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

    // 플레이어의 현재 위치와 비교하여 원의 테두리 좌표에 몬스터가 스폰될 위치를 정합니다
    const SPAWN_X = this.player.x + Math.cos(randomAngle) * SPAWN_RADIUS;
    const SPAWN_Y = this.player.y + Math.sin(randomAngle) * SPAWN_RADIUS;

    // 상자(1레벨) 생성
    let chest_level_1 = this.chests.create(SPAWN_X, SPAWN_Y, "chest_level_1");
    chest_level_1.hp = 3;
    chest_level_1.isHit = false;
    chest_level_1.setScale(2);
  }

  // 경험치 구슬 생성
  addExpBall(posX, posY) {
    const expBall = this.expBalls.create(posX, posY, "exp_ball");
    expBall.setScale(2);
  }

  // 고기 아이템 생성
  addDropItemMeat(posX, posY) {

    const meat = this.dropItems.create(posX, posY, "meat");
    meat.setScale(2); 
  }

  // 경험치 추가
  addExp(Value) { // 매게변수명 Value를 받는다

    this.expCount += Value; // 위에서 선언한 상수 expCount를 활용

    // 최대치 넘었을때 최대 경험치 수치만큼 깎고 레벨업 실행
    if (this.expCount >= this.MAX_EXP) {

      this.expCount -= this.MAX_EXP; // 최대 경험치의 수치만큼 깎기

      this.MAX_EXP += 10; // 레벨이 오를때마다 최대 경험치가 10씩 증가(임시)
      this.levelUpMenu(); // 레벨업 실행

    }

    // 0보다 작으면 안보여야하니 .setVisible을 꺼준다
    if (this.expCount <= 0) {

      this.addExpValue.setVisible(false);
    }

    else {

      this.addExpValue.setVisible(true);

      const percent = this.expCount / this.MAX_EXP; //퍼센트 계산

      const expBarPercentValue = Math.max(2, 150 * percent);// 2: setScale 즉 처음 생성될때부터 이미지 크기 정해놓는것
																													     // 150 * percent인 이유: 150이 기본 크기여서 150의 n%로 하면 딱 맞는다  
      this.addExpValue.width = expBarPercentValue; // 계산 완료된걸 넣어준다
    }
  }

  // 플레이어 레벨업
  levelUpMenu() {

    this.physics.pause(); // 게임 정지
    this.time.paused = true; // 시간 정지

    this.levelUpUI = this.add.container(0, 0); // 레벨업 UI 그룹을 00에 소환
    this.levelUpUI.setScrollFactor(0); // 카메라 고정
    this.levelUpUI.setDepth(500); // 레이어 맨위에 고정

    // 반투명 검은배경을 게임 전체에 깔기
    const backGround = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.7
    );

    this.levelUpUI.add(backGround); // 차후에 한번에 지워줘야하기에 levelUpUI에 넣는다

    // 레벨업 보상(리워드로 할까 하다가 알아먹기 쉽게 이름을 스킬로 정했습니다)
    const skills = [

      // 스탯
      { name: "공격력 증가" , id: "damage_up", icon: "damage_icon"},
      { name: "이동속도 증가", id: "speed_up", icon: "speed_icon"},

      // 무기
      { name: "블레이드", id: "blade_up", icon: "blade_icon"}, // 현재 구현x
      { name: "활", id: "arrow_up", icon: "arrow_icon"} // 현재 구현x
    ];

    // 보상이 랜덤으로 나오도록 배열을 섞는다
    Phaser.Utils.Array.Shuffle(skills);

    // 맨앞 3개만 뽑아오기
    const selectSkills = skills.slice(0, 3);

    // 버튼이 들어갈 좌표 설정
    const centerX = this.cameras.main.width / 2;     // 카메라 가운데
    const startY = 180;        // 첫 번째 버튼의 Y 좌표
    const buttonGap = 100;     // 버튼 간격
    const buttonWidth = 250;   // 버튼 넓이
    const buttonHeight = 80;   // 버튼 높이

    // 보상선택버튼 생성
    selectSkills.forEach((skill, index) => {

      // 버튼이 생성될 초기 위치
      const buttonY = startY + (index * buttonGap);

      // 나인 슬라이스로 레벨업 창의 배경을 생성
      const buttonBackGround = this.add.nineslice(centerX, buttonY, "level_up_background", 0, buttonWidth, buttonHeight, 1, 1, 1, 1)

      buttonBackGround.setScrollFactor(0) // 가운데 고정
      buttonBackGround.setInteractive() // .setInteractive를 해줘야 클릭이 된다
      buttonBackGround.on('pointerdown', () => this.selectSkill(skill.id)); // 클릭한 항목의 id를 가져와서 적용한다

      // 배경을 완성했으니 이제 버튼을 넣어줄 그룹생성
      const buttonComponents = [buttonBackGround];


      // 아이콘이 들어갈 적절한 위치
      const iconX = centerX - (buttonWidth / 2) + 35;

      // 아이콘 생성
      const icon = this.add.image(iconX, buttonY, skill.icon);
      icon.setScale(2); // 크기조정
      icon.setScrollFactor(0); // 화면고정
      icon.setDepth(501); // 아이콘이 묻히지않게 501로 레이어 위치 조정
      buttonComponents.push(icon); // 생성된 아이콘을 배경에 넣는다


      // 텍스트가 들어갈 위치
      const textX = iconX + 45;

      // 텍스트를 넣는다
      const buttonText = this.add.text(textX, buttonY, skill.name, {
        fontSize: "18px",
        fill: "#ffffff",
        fontFamily: "Arial"
      }).setOrigin(0, 0.5); // 좌측정렬
      buttonComponents.push(buttonText); // 완성된 텍스트를 배경에 넣는다

      // 지금까지 만든 애들을 모두 levelUpUI에 넣어서 한번에 관리한다
      this.levelUpUI.add([buttonBackGround, buttonText, icon]);
    });
  }

  selectSkill(skill_Id) { // skillId는 너무 가독성이 안좋아서 규칙을 무시하고 skill_Id로 했습니다

    // 가짓수가 많기에 스위치 케이스 사용
    switch (skill_Id) {

      // 공격력 증가
      case "damage_up": {

        this.player.damage += 1;
        break;
      }

      // 이동속도 증가
      case "speed_up" : {

        this.player.speed += 15;
        break;
      }

      // 블레이드(미구현)
      case "blade_up" : {

        break;
      }

      // 활(미구현)
      case "arrow_up" : {

        break;
      }
    }

    // 선택이 종료되면 UI파괴
    this.levelUpUI.destroy();

    // 시간 다시 되돌리기
    this.physics.resume();
    this.time.paused = false;
  }

  // hp가 변화됐을때 적용되는 클래스, 기본적으로 EXP와 작동방식이 같다
  updateHP(Value) {

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

      const hpBarPercentValue = Math.max(2, 20 * percent);
      this.addHPValue.width = hpBarPercentValue
    }
  }

  // 공격 애니메이션
  autoAttack() {

    // 플레이어의 위치를 받고
    const posX = this.player.x;
    const posY = this.player.y;

    // 플레이어의 방향을 받는다
    const isLeft = this.player.flipX;

    // 좌우에 따라서 생성 위치를 변경
    const OFFSET_X = isLeft ? -50 : 50;

    // 이펙트 생성
    // 기본공격(블레이드)
    const atkEff = this.physics.add.sprite(posX + OFFSET_X, posY, "blade_1");
    atkEff.setScale(4);
    atkEff.setFlipX(isLeft);
    atkEff.play("blade_animation");

    // 공격 판정

    // 몬스터 공격 판정
    this.physics.add.overlap(atkEff, this.monsters, (damage, monster) => {
      // 이미 타격중인 몬스터는 무시함
      if (monster.isHit) return;

      // 타격 처리 시작
      monster.isHit = true;
      monster.hp -= this.player.damage; // 공격력(damage)만큼 감소
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
        this.addExpBall(monster.x, monster.y);
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

    // 상자 오브젝트 공격 판정(몬스터 공격 판정과 같습니다.)
    this.physics.add.overlap(atkEff, this.chests, (damage, chest) => {

      if (chest.isHit) return;

      chest.isHit = true;
      chest.hp -= 1;
      chest.setTintFill(0xffffff);

      if (chest.hp <= 0) {
        this.addDropItemMeat(chest.x, chest.y);
        chest.destroy(); // 체력이 다 달면 없애기
      }

      else {

        // 0.1초후에 무적판정 종료
        // 상자는 어느정도의 연타를 허용해줘서 빠르게 부술 수 있도록 0.1초로 설정
        this.time.delayedCall(100, () => {
          if (chest.active) {
            chest.clearTint(); // 타격 이펙트 되돌리기
            chest.isHit = false;
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
