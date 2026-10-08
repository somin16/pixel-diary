import Phaser from "phaser";

// =====================================================
// 일시정지 메뉴
// 오른쪽 위 ≡ 버튼을 누르면 게임이 멈추고
// [돌아가기] [게임종료] 버튼이 있는 창이 나옵니다.
// =====================================================

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
    // -------------------------

    createMenuButton() {

        this.menuButton = this.scene.add.rectangle(
            0,
            0,
            56,
            56,
            0x8f9596
        );

        this.menuButton
            .setStrokeStyle(3, 0x333333)
            .setDepth(200)
            .setInteractive();

        // 줄 3개
        this.menuLines = [];

        for (let i = 0; i < 3; i++) {

            const line = this.scene.add.rectangle(
                0,
                0,
                32,
                5,
                0x333333
            );

            line.setDepth(201);

            this.menuLines.push(line);
        }

        this.menuButton.on("pointerdown", () => {
            this.pause();
        });
    }


    // -------------------------
    // 일시정지 메뉴 (회색 패널)
    // -------------------------

    createOverlay() {

        // 어두운 배경 (뒤쪽 버튼이 눌리지 않게 막아줌)
        this.dim = this.scene.add.rectangle(
            0,
            0,
            10,
            10,
            0x000000,
            0.6
        );

        this.dim
            .setOrigin(0)
            .setDepth(300);

        // 회색 패널
        this.panel = this.scene.add.rectangle(
            0,
            0,
            300,
            170,
            0x5f5f5f
        );

        this.panel
            .setStrokeStyle(3, 0xb0b0b0)
            .setDepth(301);

        // 돌아가기 (위)
        this.resumeButton = this.createPanelButton(
            "돌아가기",
            () => this.resume()
        );

        // 게임종료 (아래)
        this.exitButton = this.createPanelButton(
            "게임종료",
            () => this.exit()
        );
    }


    // 패널 안의 버튼 하나 만들기
    createPanelButton(label, onClick) {

        const box = this.scene.add.rectangle(
            0,
            0,
            220,
            48,
            0x8f9596
        );

        box
            .setStrokeStyle(3, 0x333333)
            .setDepth(302)
            .setInteractive();

        const text = this.scene.add.text(
            0,
            0,
            label,
            {
                fontFamily: "Mona",
                fontSize: "22px",
                color: "#ffffff",
                fontStyle: "bold"
            }
        );

        text
            .setOrigin(0.5)
            .setDepth(303);

        box.on("pointerover", () => box.setFillStyle(0xa6adae));
        box.on("pointerout", () => box.setFillStyle(0x8f9596));

        box.on("pointerdown", () => {
            onClick();
        });

        return { box, text };
    }


    // -------------------------
    // 위치 맞추기 (현재 화면 크기 기준)
    // -------------------------

    layout() {

        const w = this.scene.scale.width;
        const h = this.scene.scale.height;

        // 메뉴 버튼: 오른쪽 위
        // 여백 25px (JUMP / SLIDE 버튼과 같은 여백)
        const bx = w - 25 - 28;
        const by = 25 + 28;

        this.menuButton.setPosition(bx, by);

        this.menuLines.forEach((line, i) => {
            line.setPosition(bx, by + (i - 1) * 13);
        });

        // 어두운 배경: 화면 전체
        this.dim.setPosition(0, 0);
        this.dim.setSize(w, h);

        // 버튼 두 개를 가운데에 모으고,
        // 패널은 버튼 크기에 맞춰서 만듦
        const buttonW = Math.min(220, w * 0.6);
        const buttonH = 48;
        const gap = 16;      // 버튼 사이 간격
        const padding = 28;  // 패널 안쪽 여백

        const panelW = buttonW + padding * 2;
        const panelH = buttonH * 2 + gap + padding * 2;

        const cx = w / 2;
        const cy = h / 2;

        this.panel.setPosition(cx, cy);
        this.panel.setSize(panelW, panelH);

        // 돌아가기 (위) / 게임종료 (아래): 가운데 기준으로 대칭
        const offset = (buttonH + gap) / 2;

        const resumeY = cy - offset;
        const exitY = cy + offset;

        this.resumeButton.box.setPosition(cx, resumeY);
        this.resumeButton.box.setSize(buttonW, buttonH);
        this.resumeButton.text.setPosition(cx, resumeY);

        this.exitButton.box.setPosition(cx, exitY);
        this.exitButton.box.setSize(buttonW, buttonH);
        this.exitButton.text.setPosition(cx, exitY);

        // 크기가 바뀌었으니 터치 영역도 새로 맞춤
        if (this.isPaused) {
            this.setOverlayVisible(true);
        }
    }


    // -------------------------
    // 메뉴 보이기 / 숨기기
    // -------------------------

    setOverlayVisible(visible) {

        const boxes = [
            this.dim,
            this.resumeButton.box,
            this.exitButton.box
        ];

        const others = [
            this.panel,
            this.resumeButton.text,
            this.exitButton.text
        ];

        boxes.forEach((box) => {

            box.setVisible(visible);

            if (visible) {
                // 크기가 바뀌었을 수 있어서 다시 설정
                box.setInteractive();
            } else {
                box.disableInteractive();
            }
        });

        others.forEach((item) => item.setVisible(visible));
    }


    // -------------------------
    // 일시정지 / 돌아가기
    // -------------------------

    pause() {

        if (this.isPaused) {
            return;
        }

        this.isPaused = true;

        // ★ 추가: 메뉴를 열기 직전에 위치를 현재 화면 크기에 다시 맞춤
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
        this.menuLines.forEach((line) => line.destroy());

        this.dim.destroy();
        this.panel.destroy();

        this.resumeButton.box.destroy();
        this.resumeButton.text.destroy();

        this.exitButton.box.destroy();
        this.exitButton.text.destroy();
    }
}
