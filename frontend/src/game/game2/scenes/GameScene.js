import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    // 1. 사용할 이미지 불러오기(Assets)
    this.load.image('blackcat', 'assets/game2/Player/blackcat.png');
    this.load.image('apple', 'assets/game2/Object/apple.png');
    this.load.image('chocolate', 'assets/game2/Object/chocolate.png');
    this.load.image('soda_can', 'assets/game2/Object/soda.png');
    this.load.image('coin', 'assets/game2/Object/coin.png');
    this.load.image('bomb', 'assets/game2/Object/bomb.png');
    this.load.image('background_snow', 'assets/game2/Background/background_snow.png')
    //파괴 이펙트에 쓸 흰색 픽셀(색상 입히기 용도)
    this.load.image('particle', 'assets/game2/Particle/particle.png'); //임시로 코인이미지 사용
  }


  create() {
    // 배경색 설정
    this.cameras.main.setBackgroundColor('#2d2d2d');

    const background = this.add.image(0,0,'background_snow');
    background.setOrigin(0,0); // 화면을 모서리에 맞추기
    background.setDepth(-1); // 숫자가 낮을 수록 레이어가 아래

    // 게임 상태 변수 초기화
    this.gameTime = 420; // 7분제한
    this.elapsed = 0;
    this.hp= 3; // 체력
    this.score= 0;
    this.collectedCoins = 0;
    this.obstacleSpeed = 100; // Phaser는 픽셀/초 속도 단위 사용
    this.spawnRate = 1000; // 밀리초 단위 스폰 간격
    this.isDead = false;

    // 플레이어 생성 및 설정
    // 기존 x: 194, y: 500에 맞춤 (Phaser는 기본적으로 이미지 중심점이 기준입니다) 
    this.player = this.physics.add.sprite(210, 516, 'blackcat');
    this.player.setScale(0.25); // 이미지 크기 조정
    this.player.setCollideWorldBounds(true); // 화면 밖으로 나가지 못하게 막기

    // 그룹 생성 (장애물과 아이템을 묶어서 관리)
    this.obstacles = this.physics.add.group();
    this.items = this.physics.add.group();

    // 입력 키 설정 (방향키 및 A, D 키)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // 키를 한 번 누를 때마다 44픽셀씩 이동하도록 설정
    this.input.keyboard.on('keydown-LEFT', () => this.movePlayer(-1));
    this.input.keyboard.on('keydown-A', () => this.movePlayer(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.movePlayer(1));
    this.input.keyboard.on('keydown-D', () => this.movePlayer(1));

    // 화면 터치/클릭 이동
    this.input.on('pointerdown', (pointer) => {
      const dir = pointer.x < this.sys.game.config.width / 2 ? -1 : 1;
      this.movePlayer(dir);
    });

    // 충돌 처리 설정
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
    this.physics.add.overlap(this.player, this.items, this.collectItem, null, this);

    // 1초마다 실행되는 게임 타이머
    this.time.addEvent({
      delay: 1000,
      callback: this.onSecondTick,
      callbackScope: this,
      loop: true
    });

    // 물건 떨어 뜨리기 타이머
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnRate,
      callback: this.spawnObjects,
      callbackScope: this,
      loop: true
    });
  }

  update(time, delta) {
    if (this.isDead) return;

    //화면 아래로 벗어난 장애물/아이템 삭제 (회피 점수 처리 가능)
    this.obstacles.getChildren().forEach(obs => {
      if (obs.y > this.sys.game.config.height) obs.destroy();
    });
    this.items.getChildren().forEach(item => {
      if (item.y > this.sys.game.config.height) item.destroy();
    });
  }

  // 플레이어 이동 로직
  movePlayer(dir) {
    if (this.isDead) return;
    this.player.x += dir * 44;
  }

  // 초당 틱 로직 (타이머,난이도 조절)
  onSecondTick() {
    if(this.isDead) return;

    this.elapsed++;
    this.gameTime--;

    if (this.gameTime <= 0) {
      this.endGame(true); // 7분 버티기 성공
    }

    // 튜토리얼 15초 구간 체크 및 난이도 상승 로직
    if (this.elapsed === 15){
      this.obstacleSpeed = 150; // 튜토리얼 끝나면 속도 정상화
      this.updateSpawnRate(800);
    }else if (this.elapsed > 15 && this.elapsed % 60 === 0){
      // 1분마다 속도와 스폰 빈도 증가
      this.obstacleSpeed += 20;
      this.updateSpawnRate(Math.max(200, this.spawnRate - 100));
    }
  }

  updateSpawnRate(newRate) {
    this.spawnRate = newRate;
    this.spawnTimer.delay = this.spawnRate;
  }

  // 물건 생성 로직 
  spawnObjects(){
    if (this.isDead) return;

    const xPos = Phaser.Math.Between(16, 420 -16);

    // 확률에 따라 장애물, 코인, 폭탄 생성
    const random = Math.random();
    if (random < 0.1) {
      // 폭탄 생성 (예시 확률)
      const bomb = this.items.create(xPos, -32, 'bomb');
      bomb.name = 'bomb';
      bomb.setScale(0.25);
      bomb.setVelocityY(this.obstacleSpeed);
    } else if (random < 0.3){
      // 코인 생성
      const coin = this.items.create(xPos, -16, 'coin');
      coin.name = 'coin';
      coin.setScale(2);
      coin.setVelocityY(this.obstacleSpeed); 
    } else {
      // 장애물 생성
      const shapes = ['apple', 'chocolate', 'soda_can'];
      const shape = Phaser.Math.RND.pick(shapes);
      const obs = this.obstacles.create(xPos, -32, shape);
      obs.setScale(0.25);
      obs.setVelocityY(this.obstacleSpeed);
    }
  }

  // 충돌 및 파괴 이펙트 처리
  hitObstacle(player, obstacle) {
    obstacle.destroy();
    this.hp--;

    // 파괴 이펙트 (Phaser의 내장 파티클 기능 사용)
    this.createExplosion(player.x, player.y, 0xff6b6b);

    if (this.hp <= 0) {
      this.endGame(false);
    }
  }

  collectItem(player, item) {
    if (item.name === 'coin') {
      this.collectedCoins++;
      item.destroy();
    } else if (item.name === 'bomb'){
      // 화면 내 모든 장애물 파괴
      this.obstacles.getChildren().forEach(obs => {
        this.createExplosion(obs.x, obs.y, 0xffffff);
        obs.destroy();
      });
      item.destroy();
    }
  }

  // 기존의 복잡했던 파티클 배열 대신, 페이저의 강력한 입자 효과 도구를 사용
  createExplosion(x, y, colorTint) {
    const emitter = this.add.particles(x, y, 'particle', {
      speed: {min: -150, max: 150 },
      lifespan: 300,
      scale: {start: 0.5, end: 0 },
      tint: colorTint,
      quantity: 12,
      emitting: false
    });
    emitter.explode(); // 즉시 폭발 이펙트 재생 후 소멸
  }

  endGame(isWin) {
    this.isDead = true;
    this.physics.pause(); // 모든 물리효과 정지
    this.player.setTint(0xff0000); // 죽으면 빨간색으로 변경
    console.log(isWin ? "승리!" : '게임 오버');
  }
}