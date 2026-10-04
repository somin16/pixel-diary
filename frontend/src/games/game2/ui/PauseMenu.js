import Phaser from "phaser";

export default class PauseMenu {

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
            340,
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
        box.on("pointerdown", onClick);

        return { box, text };
    }


    // -------------------------
    // 위치 맞추기
    // -------------------------

    layout() {

        const w = this.scene.scale.width;
        const h = this.scene.scale.height;

        // 메뉴 버튼: 오른쪽 위
        const bx = w - 44;
        const by = 44;

        this.menuButton.setPosition(bx, by);

        this.menuLines.forEach((line, i) => {
            line.setPosition(bx, by + (i - 1) * 13);
        });

        // 어두운 배경: 화면 전체
        this.dim.setPosition(0, 0);
        this.dim.setSize(w, h);

        // 패널: 화면 가운데 (화면이 작으면 같이 작아짐)
        const panelW = Math.min(300, w * 0.8);
        const panelH = Math.min(340, h * 0.85);

        const cx = w / 2;
        const cy = h / 2;

        this.panel.setPosition(cx, cy);
        this.panel.setSize(panelW, panelH);

        const buttonW = panelW * 0.75;

        const panelTop = cy - panelH / 2;
        const panelBottom = cy + panelH / 2;

        // 돌아가기: 패널 위쪽
        const resumeY = panelTop + panelH * 0.28;

        this.resumeButton.box.setPosition(cx, resumeY);
        this.resumeButton.box.setSize(buttonW, 48);
        this.resumeButton.text.setPosition(cx, resumeY);

        // 게임종료: 패널 아래쪽
        const exitY = panelBottom - 40;

        this.exitButton.box.setPosition(cx, exitY);
        this.exitButton.box.setSize(buttonW, 48);
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