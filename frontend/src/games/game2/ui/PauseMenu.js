import Phaser from "phaser";
import { PIXEL, createPixelBox, createPixelButton } from "./PixelUI";

// =====================================================
// 일시정지 메뉴
// 오른쪽 위 ≡ 버튼을 누르면 게임이 멈추고
// [돌아가기] [게임종료] 버튼이 있는 창이 나옵니다.
// =====================================================

// 창 크기 (고정값. 위치만 화면 크기에 맞춰 옮김)
const BUTTON_W = 220;
const BUTTON_H = 48;
const BUTTON_GAP = 16;    // 버튼 사이 간격
const PANEL_PAD = 28;     // 패널 안쪽 여백

export default class PauseMenu {

    // scene  : 게임 화면
    // onExit : [게임종료]를 눌렀을 때 실행할 일 (보통 모드 선택 화면으로 이동)
    constructor(scene, onExit) {

        this.scene = scene;
        this.onExit = onExit;

        this.isPaused = false;

        this.createMenuButton();
        this.createOverlay();

        this.layout();
        this.setOverlayVisible(false);

        // 화면 크기가 바뀌면 위치 다시 맞추기
        scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);

        // 키보드 ESC (웹 테스트용)
        scene.input.keyboard.on("keydown-ESC", this.toggle, this);
    }


    // -------------------------
    // 메뉴 버튼 (오른쪽 위, ≡ 모양)
    // GameScene에서 menuButton.disableInteractive()로 누르지 못하게 막기도 합니다.
    // -------------------------

    createMenuButton() {

        this.menuButton = createPixelBox(this.scene, {
            x: 0,
            y: 0,
            w: 56,
            h: 56,
            depth: 200,
            onClick: () => this.pause()
        });

        // 줄 3개
        [-12, 0, 12].forEach((offsetY) => {
            this.menuButton.add(this.scene.add.rectangle(0, offsetY, 28, 4, PIXEL.ink));
        });
    }


    // -------------------------
    // 일시정지 메뉴 (패널 + 버튼 2개)
    // -------------------------

    createOverlay() {

        // 어두운 배경 (뒤쪽 버튼이 눌리지 않게 막아줌)
        this.dim = this.scene.add.rectangle(0, 0, 10, 10, PIXEL.shadow, 0.7);
        this.dim
            .setOrigin(0)
            .setDepth(300);

        // 패널 (버튼 크기에 맞춰서 만듦)
        this.panel = createPixelBox(this.scene, {
            x: 0,
            y: 0,
            w: BUTTON_W + PANEL_PAD * 2,
            h: BUTTON_H * 2 + BUTTON_GAP + PANEL_PAD * 2,
            depth: 301
        });

        // 돌아가기 (위)
        this.resumeButton = createPixelButton(this.scene, {
            x: 0,
            y: 0,
            w: BUTTON_W,
            h: BUTTON_H,
            label: "돌아가기",
            fill: PIXEL.sun,
            fontSize: 22,
            depth: 302,
            onClick: () => this.resume()
        });

        // 게임종료 (아래)
        this.exitButton = createPixelButton(this.scene, {
            x: 0,
            y: 0,
            w: BUTTON_W,
            h: BUTTON_H,
            label: "게임종료",
            fill: PIXEL.lilac,
            fontSize: 22,
            depth: 302,
            onClick: () => this.exit()
        });
    }


    // -------------------------
    // 위치 맞추기 (현재 화면 크기 기준)
    // -------------------------

    layout() {

        const w = this.scene.scale.width;
        const h = this.scene.scale.height;

        // 메뉴 버튼: 오른쪽 위
        // 여백 25px (JUMP / SLIDE 버튼과 같은 여백)
        this.menuButton.moveTo(w - 25 - 28, 25 + 28);

        // 어두운 배경: 화면 전체
        this.dim.setPosition(0, 0);
        this.dim.setSize(w, h);

        // 패널과 버튼은 화면 가운데에, 버튼은 가운데 기준으로 대칭
        const cx = w / 2;
        const cy = h / 2;
        const offset = (BUTTON_H + BUTTON_GAP) / 2;

        this.panel.moveTo(cx, cy);
        this.resumeButton.moveTo(cx, cy - offset);
        this.exitButton.moveTo(cx, cy + offset);

        // 크기가 바뀌었으니 터치 영역도 새로 맞춤
        if (this.isPaused) {
            this.setOverlayVisible(true);
        }
    }


    // -------------------------
    // 메뉴 보이기 / 숨기기
    // -------------------------

    setOverlayVisible(visible) {

        // 어두운 배경: 보일 때만 터치를 받음 (크기가 바뀌었을 수 있어서 다시 설정)
        this.dim.setVisible(visible);

        if (visible) {
            this.dim.setInteractive();
        } else {
            this.dim.disableInteractive();
        }

        // 패널, 버튼: 안 보일 때는 터치도 막음
        this.panel.setVisible(visible);

        [this.resumeButton, this.exitButton].forEach((button) => {
            button.setVisible(visible);

            if (button.input) {
                button.input.enabled = visible;
            }
        });
    }


    // -------------------------
    // 일시정지 / 돌아가기
    // -------------------------

    pause() {

        if (this.isPaused) {
            return;
        }

        this.isPaused = true;

        // 메뉴를 열기 직전에 위치를 현재 화면 크기에 다시 맞춤
        // (화면 크기가 바뀐 뒤 패널이 엉뚱한 곳에 뜨는 문제 방지)
        this.layout();

        this.scene.physics.pause();
        this.scene.time.paused = true;
        this.scene.tweens.pauseAll();
        this.scene.anims.pauseAll();

        this.setOverlayVisible(true);
    }


    resume() {

        if (!this.isPaused) {
            return;
        }

        this.isPaused = false;

        this.scene.physics.resume();
        this.scene.time.paused = false;
        this.scene.tweens.resumeAll();
        this.scene.anims.resumeAll();

        this.setOverlayVisible(false);
    }


    toggle() {

        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }


    // -------------------------
    // 게임종료 → 모드 선택 화면으로
    // -------------------------

    exit() {

        // 애니메이션 등은 모든 화면이 같이 쓰므로 먼저 원래대로 돌려놓음
        this.resume();

        this.onExit?.();
    }


    // -------------------------
    // 정리
    // -------------------------

    destroy() {

        if (this.isPaused) {
            this.scene.anims.resumeAll();
        }

        this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
        this.scene.input.keyboard?.off("keydown-ESC", this.toggle, this);

        this.menuButton.destroy();

        this.dim.destroy();
        this.panel.destroy();

        this.resumeButton.destroy();
        this.exitButton.destroy();
    }
}