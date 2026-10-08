import Phaser from "phaser";

import { loadAllSprite, loadMapAssets } from "../preload/Preload";
import { createAllAnimations } from "../animations/Animations";
import Player from "../player/Player";
import GameControls from "../ui/GameControls";
import PauseMenu from "../ui/PauseMenu";
import GameHud from "../ui/GameHud";
import { showResultPanel } from "../ui/ResultPanel";
import ObstacleManager from "../manage/ObstacleManager";
import MapManager from "../manage/MapManager";
import { MODE_CONFIG } from "../manage/ModeConfig";

// 모드 선택 화면의 이름표
// ※ scenes/ModeSelectScene.js 안의 super("...") 글자와 똑같아야 합니다.
const MODE_SELECT_KEY = "ModeSelectScene";

// 바닥(도로) 윗면 높이 = 화면 높이의 몇 %인지
// 캐릭터가 도로 위로 떠 보이면 숫자를 "키우고" (예: 0.22),
// 도로 속에 파묻혀 보이면 숫자를 "줄이세요" (예: 0.15)
const GROUND_RATIO = 0.18;

// 바닥 판정을 화면 아래쪽으로 더 두껍게 늘리는 값 (뚫림 방지)
// 눈에 안 보이는 부분이라 크게 잡아도 괜찮습니다.
const GROUND_EXTRA = 300;

// 바닥 판정 영역(회색 띠)을 눈으로 볼지 여부 (true = 보임 / false = 안 보임)
// 위치를 맞출 때는 true로 두고 확인하세요.
const SHOW_GROUND = false;

// 테스트용: N 키를 누르면 바로 다음 맵 단계(night → day)로 넘어감
const DEV_KEY = import.meta.env.DEV;


export default class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }


    // =========================
    // 게임 시작 전 값 받기
    // 모드 선택 화면에서 넘겨준 값을 여기서 받습니다.
    // =========================

    init(data) {
        this.gameMode = data?.gameMode ?? "daily";   // "daily"(데일리) 또는 "infinity"(무한)
        this.emotion = data?.emotion ?? "happy";     // "happy", "calm", "sad", "angry"

        // 이 모드의 규칙표 (ModeConfig.js)
        this.modeConfig = MODE_CONFIG[this.gameMode] ?? MODE_CONFIG.daily;

        this.baseSpeed = this.modeConfig.baseSpeed;  // 시작 속도
        this.scrollSpeed = this.baseSpeed;           // 지금 속도
        this.elapsed = 0;                            // 흐른 시간(밀리초)
        this.isOver = false;                         // 게임이 끝났는지
        this.invincible = false;                     // 피격 직후 무적 상태인지
    }


    // =========================
    // 이미지 불러오기
    // =========================

    preload() {
        loadAllSprite(this);                 // 플레이어 이미지
        loadMapAssets(this, this.emotion);   // 선택한 감정의 맵 이미지
    }


    // =========================
    // 게임 화면 만들기
    // =========================

    create() {

        createAllAnimations(this);   // 달리기/점프/슬라이드 애니메이션 등록

        // ---------- 맵(배경) ----------
        this.map = new MapManager(this, this.emotion);


        // ---------- 바닥 (플레이어가 밟는 판정 영역) ----------
        // groundHeight : 눈에 보이는 도로 두께 (화면 높이에 비례)
        // groundTopY   : 바닥 윗면의 y 좌표 (캐릭터와 장애물이 서는 높이)
        this.groundHeight = Math.round(this.scale.height * GROUND_RATIO);
        this.groundTopY = this.scale.height - this.groundHeight;

        // 판정 영역은 윗면에서 아래로 (두께 + 여분) 만큼 두껍게
        this.ground = this.add.rectangle(
            this.scale.width / 2,
            this.groundTopY + (this.groundHeight + GROUND_EXTRA) / 2,
            this.scale.width,
            this.groundHeight + GROUND_EXTRA,
            0x444444
        );

        this.ground.setAlpha(SHOW_GROUND ? 0.6 : 0);
        this.physics.add.existing(this.ground, true);   // true = 움직이지 않는 고정 물체


        // ---------- 플레이어 ----------
        this.player = new Player(this, 150, 100);

        // 플레이어를 바닥 위에 올려놓기
        this.player.y = this.groundTopY - this.player.body.height / 2;

        // 바닥을 뚫고 떨어지지 않게 충돌 설정
        this.physics.add.collider(this.player, this.ground);


        // ---------- 점수 / 체력 / 시간 글자 ----------
        this.hud = new GameHud(this, this.modeConfig);

        this.score = 0;
        this.maxHp = this.modeConfig.maxHp;
        this.hp = this.maxHp;

        this.hud.setScore(this.score);
        this.hud.setHp(this.hp, this.maxHp);
        this.hud.setTime(0);

        // 0.1초마다 점수 +1
        this.scoreTimer = this.time.addEvent({
            delay: 100,
            callback: () => this.addScore(1),
            loop: true
        });


        // ---------- 장애물 (닿으면 handleObstacleHit 실행) ----------
        this.obstacles = new ObstacleManager(
            this,
            this.player,
            () => this.handleObstacleHit()
        );


        // ---------- 점프/슬라이드 버튼, 일시정지 메뉴 ----------
        this.controls = new GameControls(this, this.player);

        this.pauseMenu = new PauseMenu(
            this,
            () => this.scene.start(MODE_SELECT_KEY)   // 게임종료 → 모드 선택 화면
        );


        // ---------- 테스트용 N 키: 다음 맵 단계로 건너뛰기 ----------
        if (DEV_KEY) {
            this.input.keyboard.on("keydown-N", () => {
                const stageMs = this.modeConfig.stageSeconds * 1000;
                this.elapsed = (Math.floor(this.elapsed / stageMs) + 1) * stageMs;
            });
        }


        // ---------- 화면 크기가 바뀌면 바닥도 맞추기 ----------
        this.scale.on("resize", this.resizeGround, this);

        // 이 화면이 끝날 때 정리할 것들
        this.events.once("shutdown", () => {
            this.scale.off("resize", this.resizeGround, this);

            this.controls?.destroy();
            this.pauseMenu?.destroy();
            this.obstacles?.destroy();
            this.map?.destroy();
            this.scoreTimer?.remove();
        });

        // 시작할 때도 한 번 맞춰주기
        this.resizeGround(this.scale.gameSize);
    }


    // =========================
    // 점수 바꾸기 (+면 오르고 -면 내려감, 0 아래로는 안 내려감)
    // =========================

    addScore(amount) {
        if (this.isOver) {
            return;
        }

        this.score = Math.max(0, this.score + amount);
        this.hud.setScore(this.score);
    }


    // =========================
    // 장애물에 부딪혔을 때
    // =========================

    handleObstacleHit() {

        // 이미 끝났거나 무적 상태면 무시
        if (this.isOver || this.invincible) {
            return;
        }

        // 데일리: 체력 -1
        if (this.modeConfig.useHp) {
            this.hp -= 1;
            this.hud.setHp(this.hp, this.maxHp);
        }

        // 무한: 점수 -50 (hitScore가 0이 아닐 때만)
        if (this.modeConfig.hitScore !== 0) {
            this.addScore(this.modeConfig.hitScore);
        }

        // 체력이 0이 되면 게임오버
        if (this.modeConfig.useHp && this.hp <= 0) {
            this.finish("GAME OVER");
            return;
        }

        // 1초 동안 무적 + 캐릭터 깜빡임 (연속으로 맞지 않게)
        this.invincible = true;

        this.tweens.add({
            targets: this.player,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 4,
            onComplete: () => this.player.setAlpha(1)
        });

        this.time.delayedCall(1000, () => {
            this.invincible = false;
        });
    }


    // =========================
    // 게임 끝 (게임오버 또는 클리어)
    // 결과 창을 띄웁니다. (다시 하기는 무한 모드만)
    // =========================

    finish(message) {
        this.isOver = true;

        this.physics.pause();                 // 움직임 정지
        this.scoreTimer?.remove();            // 점수 증가 정지
        this.obstacles?.timer?.remove();      // 장애물 생성 정지

        // 결과 창이 떠 있는 동안 일시정지 버튼은 못 누르게 막음
        this.pauseMenu?.menuButton?.disableInteractive();

        showResultPanel(this, {
            title: message,
            score: this.score,
            canRetry: this.gameMode === "infinity",

            // 다시 하기: 같은 모드, 같은 맵으로 다시 시작
            onRetry: () => this.scene.start("GameScene", {
                gameMode: this.gameMode,
                emotion: this.emotion
            }),

            // 나가기: 모드 선택 화면으로
            onExit: () => this.scene.start(MODE_SELECT_KEY)
        });
    }


    // =========================
    // 화면 크기가 바뀌었을 때 바닥 위치/두께 다시 맞추기
    // (가로 전환, 개발자 도구(F12) 열기 등)
    //
    // 바닥 윗면이 움직인 만큼 플레이어도 똑같이 옮깁니다.
    // =========================

    resizeGround(gameSize) {
        if (!this.ground?.body) {
            return;
        }

        // 바닥 윗면의 "옛날 위치"
        const oldTop = this.groundTopY;

        // 새 화면 크기에 맞춰 다시 계산
        this.groundHeight = Math.round(gameSize.height * GROUND_RATIO);
        this.groundTopY = gameSize.height - this.groundHeight;

        // 바닥 판정 영역을 새 위치/크기로
        this.ground.setPosition(
            gameSize.width / 2,
            this.groundTopY + (this.groundHeight + GROUND_EXTRA) / 2
        );

        this.ground.setSize(gameSize.width, this.groundHeight + GROUND_EXTRA);
        this.ground.body.updateFromGameObject();

        // 바닥이 움직인 만큼 플레이어도 같이 옮기기
        if (this.player) {
            this.player.y += this.groundTopY - oldTop;
        }
    }


    // =========================
    // 안전장치: 플레이어가 바닥 속으로 파고들면 바닥 위로 끌어올림
    // (폰에서 화면 크기가 바뀔 때 가끔 생기는 "계속 추락" 방지)
    // =========================

    keepPlayerOnGround() {
        const body = this.player?.body;

        if (!body) {
            return;
        }

        // 발바닥이 바닥 윗면보다 6px 넘게 아래로 내려가 있으면
        const sunk = body.bottom - this.groundTopY;

        if (sunk > 6) {
            this.player.y -= sunk;     // 바닥 위로 올리기
            body.setVelocityY(0);      // 떨어지던 속도 멈추기
        }
    }


    // =========================
    // 매 프레임 실행 (1초에 약 60번)
    // delta : 지난 프레임 이후 흐른 시간(밀리초)
    // =========================

    update(time, delta) {

        // 플레이어가 없거나, 게임이 끝났거나, 일시정지 중이면 멈춤
        if (!this.player || this.isOver || this.pauseMenu?.isPaused) {
            return;
        }

        this.player.updatePlayer();
        this.keepPlayerOnGround();

        // ---------- 시간과 속도 ----------
        this.elapsed += delta;

        const cfg = this.modeConfig;
        const seconds = this.elapsed / 1000;

        this.hud.setTime(seconds);

        // 속도 = 시작 속도 + (초 × 가속), 단 최고 속도를 넘지 않음
        this.scrollSpeed = Math.min(
            cfg.maxSpeed,
            cfg.baseSpeed + cfg.speedUpPerSec * seconds
        );

        // ---------- 클리어 확인 (데일리만: clearSeconds가 0이 아닐 때) ----------
        if (cfg.clearSeconds > 0 && seconds >= cfg.clearSeconds) {
            this.finish("CLEAR!");
            return;
        }

        // ---------- 맵 단계 바꾸기 (night → day, 마지막 단계에서 멈춤) ----------
        const stage = Math.floor(this.elapsed / (cfg.stageSeconds * 1000));
        this.map.setStage(Math.min(stage, this.map.stageCount - 1));

        // ---------- 맵과 장애물 움직이기 ----------
        this.map.update(delta, this.scrollSpeed);
        this.obstacles.update();
    }
}