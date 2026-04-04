import Phaser from "phaser"; 

// ==============플레이어 관련===============

// 다른 폴더에서 Player.js를 Player로 받아온다
import Player from "../player/Player.js";

// 자동공격 이벤트
import { autoAttacks } from "../attacks/Attacks.js";

// 자동회복 이벤트
import { addEventupdataHP } from "../player/Hp.js";

// 경험치 획득
import { overlapAddExp } from "../player/ExpBall.js"; // ← 이렇게 선언하면 해당 클래스의 함수만 쏙 빼올수있다

// 고기 획득
import { overlapMeat } from "../Object/Meat.js";


// ==============몬스터 관련=================

// 몬스터 레벨업, 몬스터 스폰 업데이트
import { addEventMonsterLevelUp, monsterMove, overlapMonstersHit } from "../monsters/Monsters.js";


// ============이미지, 애니메이션====================

// 이미지 불러오기
import { loadAllSprite } from "../preload/Preload.js";            

// 애니메이션 선언
import { createAllAnimations } from "../animations/Aniations.js"; 

// UI바 세팅
import { barUiSetting, hpBarPosSet } from "../ui/Bar.js";

// 배경 세팅
import { backGroundTileCameraSet, backgroundTileSet } from "../background/Background.js";


// ==============오브젝트===================

// 상자 생성
import { addEventSpawnChest } from "../Object/Chest.js";


// ===============타이머====================

// 타이머
import { TimerEnd, TimerSetting } from "../manage/Timer.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  // perload: 이미지 불러오기
  preload() {

    // 모든 이미지 불러오기(preload/Preload.js)
    loadAllSprite(this);
  }

  create() { // create: 말그대로 생성, 오브젝트를 작성하는 곳

    // 게임이 재시작할때 버그방지용
    this.time.paused = false;
    this.physics.resume();

    // ===================플레이어=================

    // 플레이어 생성(Player.js로 분리)
    this.player = new Player(this, 400, 300);

    // 카메라를 플레이어에 맞춰서 이동
    this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

    // 플레이어 체력 자연 회복 이벤트(player/Hp.js)
    addEventupdataHP(this);

    // 자동공격(attacks/Attakcs.js)
    autoAttacks(this);

    
    // ===================타일맵===================

    // 타일맵 깔기(background/Background.js)
    backgroundTileSet(this);


    // ====================타이머===================

    // 타이머세팅(ui/Timer.js)
    TimerSetting(this);

    // UI세팅(ui/Bar.js)
    barUiSetting(this);


    // =================오브젝트 아이템들===================

    // 경험치 구슬 그룹
    this.expBalls = this.physics.add.group();

    // 상자 오브젝트 그룹
    this.chests = this.physics.add.group();

    // 드랍 아이템 오브젝트 그룹
    this.dropItems = this.physics.add.group();


    // ===================오브젝트 획득시==========================

    // 경험치 획득(ExpBall.js)
    overlapAddExp(this);

    // 드랍 아이템 획득(고기, Meat.js)
    overlapMeat(this);


    // ====================몬스터===================

    // 몬스터에 사용될 가중치
    this.monsterStatus = 0;

    // 몬스터 그룹
    this.monsters = this.physics.add.group();

    // 몬스터에게 피격시 이벤트
    overlapMonstersHit(this);

    // 모든 애니메이션 불러오기(aniations/Aniations.js)
    createAllAnimations(this);

    // 상자생성 이벤트(Object/Chest.js)
    addEventSpawnChest(this);

    // 20초마다 몬스터의 체력이 증가하고 스폰률이 올라가는 이벤트(Monsters.js)
    // 이벤트 클래스에 레벨업, 스폰률 업데이트로 모두 함께 관리
    addEventMonsterLevelUp(this);

    // 방향키, WASD입력
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,S,D");
  }

  update() {

    // 몬스터 움직임 베이스(monsters/Monsters.js)
    monsterMove(this);

    // 타이머가 끝나는 타이밍 감지용(ui/Timer.js)
    TimerEnd(this);

    // 타일맵 위치 갱신(ui/Background.js)
    backGroundTileCameraSet(this);

    // HP바 위치 갱신(ui/Bar.js)
    hpBarPosSet(this);

    // Player.js에서 playerMove를 받아오고 사용
    this.player.playerMove(this.cursors, this.wasd);
  }
}