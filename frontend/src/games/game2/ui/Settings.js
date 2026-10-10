import { PIXEL, drawBackground, createPixelBox, createPixelButton, createTopBar } from "./PixelUI";

// =====================================================
// 설정 화면
// 배경음 / 효과음의 ON / OFF 버튼을 보여줍니다.
// 켜짐 상태는 게임 전체 저장소(registry)에 기억해서 화면을 나갔다 와도 유지됩니다.
// (실제 소리를 켜고 끄는 건 나중에 연결)
// =====================================================

const GAP = 16;

export function createSettingsUI(scene) {

    const { width, height } = scene.scale;

    drawBackground(scene);

    const { margin, top } = createTopBar(scene, "설정", () => {
        scene.scene.start("ModeSelectScene");
    });

    // 두 줄을 남는 영역의 가운데에 배치
    const areaH = height - top - margin;
    const rowW = Math.min(520, width - margin * 2);
    const rowH = Math.min(96, Math.floor((areaH - GAP) / 2));
    const startY = top + (areaH - (rowH * 2 + GAP)) / 2 + rowH / 2;

    createSoundRow(scene, width / 2, startY, rowW, rowH, "배경음", "bgmOn");
    createSoundRow(scene, width / 2, startY + rowH + GAP, rowW, rowH, "효과음", "sfxOn");
}


// =========================
// 사운드 설정 한 줄 (이름 + ON / OFF 버튼)
// key : registry에 기억해 둘 이름
// =========================

function createSoundRow(scene, x, y, w, h, title, key) {

    // 줄 배경 상자
    createPixelBox(scene, { x, y, w, h });

    const pad = 20;   // 상자 안쪽 여백

    // 설정 이름 (왼쪽)
    scene.add.text(x - w / 2 + pad, y, title, {
        fontFamily: PIXEL.font,
        fontSize: `${Math.max(14, Math.min(22, h * 0.25))}px`,
        color: PIXEL.inkText
    }).setOrigin(0, 0.5);

    // ON / OFF 버튼 위치 (OFF는 오른쪽 끝, ON은 그 왼쪽)
    const btnW = Math.min(76, w * 0.18);
    const btnH = Math.min(48, h * 0.55);
    const btnGap = 12;
    const offX = x + w / 2 - pad - btnW / 2;
    const onX = offX - btnW - btnGap;
    const fontSize = Math.max(12, Math.min(18, h * 0.2));

    // 저장된 값이 없으면 켜짐
    const isOn = () => scene.registry.get(key) !== false;

    let onButton = null;
    let offButton = null;

    // 지금 상태에 맞게 색 칠하기 (선택된 쪽은 노랑)
    const refresh = () => {
        onButton.inner.setFillStyle(isOn() ? PIXEL.sun : PIXEL.lilac);
        offButton.inner.setFillStyle(isOn() ? PIXEL.lilac : PIXEL.sun);
    };

    onButton = createPixelButton(scene, {
        x: onX, y, w: btnW, h: btnH, label: "ON", fontSize,
        onClick: () => {
            scene.registry.set(key, true);
            refresh();
        }
    });

    offButton = createPixelButton(scene, {
        x: offX, y, w: btnW, h: btnH, label: "OFF", fontSize,
        onClick: () => {
            scene.registry.set(key, false);
            refresh();
        }
    });

    refresh();
}