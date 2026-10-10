// =====================================================
// 픽셀 UI 공통 부품
// MinigameHub.jsx 와 똑같은 색/테두리/그림자 스타일을 Phaser 안에서도 쓰기 위한 파일입니다.
// 모든 화면이 같은 모양의 버튼, 배경, 카드를 여기서 가져다 씁니다.
// =====================================================

// 색 (MinigameHub.jsx 의 색과 같음)
export const PIXEL = {
    ink: 0x231c4b,      // 글자·테두리
    shadow: 0x120e33,   // 딱딱한 그림자
    paper: 0xf4efff,    // 패널 배경
    sun: 0xffc857,      // 주요 버튼
    mint: 0x7adfc0,
    dawn: 0xff8fa3,     // 하드 모드
    lilac: 0xddd3ff,
    inkText: "#231C4B",     // 글자용 (색 문자열)
    paperText: "#F4EFFF",
    mutedText: "#8A84A8",   // 잠긴 항목 글자
    font: "Mona"
};

const BORDER = 4;     // 테두리 두께
const SHADOW = 4;     // 그림자가 밀려나는 거리
const LABEL_H = 36;   // 카드 아래 이름표 높이
const DIVIDER = 4;    // 카드 미리보기와 이름표 사이 구분선 두께

// 크기를 짝수로 맞춘다 (반으로 나눴을 때 소수점이 안 생기게 해서 테두리가 또렷하게 나옴)
const even = (n) => Math.round(n / 2) * 2;


// ---------------------------------------------------
// 밤→새벽 느낌의 계단식 색띠 배경을 화면 전체에 깐다
// ---------------------------------------------------
export function drawBackground(scene) {
    const { width, height } = scene.scale;

    // [색, 시작 비율, 끝 비율]
    const bands = [
        [0x232a5c, 0, 0.30],
        [0x2f3577, 0.30, 0.55],
        [0x4a4497, 0.55, 0.78],
        [0x6b55a8, 0.78, 1]
    ];

    bands.forEach(([color, from, to]) => {
        const y = Math.round(height * from);
        const h = Math.round(height * to) - y;
        scene.add.rectangle(0, y, width, h, color).setOrigin(0).setDepth(-10);
    });
}


// ---------------------------------------------------
// 픽셀 상자 (테두리 + 딱딱한 그림자)
// x, y    : 상자의 "가운데" 위치
// w, h    : 크기
// fill    : 안쪽 색
// onClick : 있으면 버튼이 됨. 손을 뗄 때 실행 (눌러서 2px 내려가는 효과 포함)
// onPress : 누르는 순간 바로 실행 (점프/슬라이드처럼 반응이 빨라야 할 때)
// depth   : 앞뒤 순서 (숫자가 클수록 앞)
//
// 반환값은 container 입니다.
//  - 상자 위에 글자/그림을 올리려면 box.add(...) 를 쓰고,
//    위치는 "상자 가운데가 (0, 0)" 기준으로 적으세요.
//  - 위치를 옮길 때는 box.setPosition 대신 box.moveTo(x, y) 를 쓰세요.
//  - 안쪽 색을 바꿀 때는 box.inner.setFillStyle(색)
// ---------------------------------------------------
export function createPixelBox(scene, { x, y, w, h, fill = PIXEL.paper, onClick = null, onPress = null, depth = null }) {
    w = even(w);
    h = even(h);

    let baseX = Math.round(x);
    let baseY = Math.round(y);

    const box = scene.add.container(baseX, baseY);

    const shadow = scene.add.rectangle(SHADOW, SHADOW, w, h, PIXEL.shadow);
    const border = scene.add.rectangle(0, 0, w, h, PIXEL.ink);
    const inner = scene.add.rectangle(0, 0, w - BORDER * 2, h - BORDER * 2, fill);

    box.add([shadow, border, inner]);
    box.inner = inner;

    // 위치 옮기기 (화면 크기가 바뀌었을 때 등)
    box.moveTo = (nx, ny) => {
        baseX = Math.round(nx);
        baseY = Math.round(ny);
        box.setPosition(baseX, baseY);
    };

    if (depth !== null) {
        box.setDepth(depth);
    }

    if (onClick || onPress) {
        box.setSize(w, h);
        box.setInteractive({ useHandCursor: true });

        let pressed = false;

        // 원래 모양으로 되돌리기
        const release = () => {
            pressed = false;
            box.setPosition(baseX, baseY);
            shadow.setPosition(SHADOW, SHADOW);
        };

        // 누르면 상자가 2px 내려가고 그림자는 제자리에 남아서 "눌린" 느낌이 남
        box.on("pointerdown", () => {
            pressed = true;
            box.setPosition(baseX + 2, baseY + 2);
            shadow.setPosition(2, 2);
            onPress?.();
        });

        // 버튼 위에서 손을 뗐을 때만 동작 (밖으로 끌고 나가면 취소)
        box.on("pointerup", () => {
            if (!pressed) {
                return;
            }
            release();
            onClick?.();
        });

        box.on("pointerout", () => {
            if (pressed) {
                release();
            }
        });
    }

    return box;
}


// ---------------------------------------------------
// 글자가 들어간 픽셀 버튼 (옵션은 createPixelBox 와 같고 label, fontSize, outline 추가)
// outline : true면 종이색 글자 + 남색 외곽선 (색 배경 위에서도 또렷하게 보임)
// ---------------------------------------------------
export function createPixelButton(scene, { label, fontSize = 18, outline = false, ...boxOptions }) {
    const box = createPixelBox(scene, boxOptions);

    const text = scene.add.text(0, 0, label, {
        fontFamily: PIXEL.font,
        fontSize: `${fontSize}px`,
        color: outline ? PIXEL.paperText : PIXEL.inkText,   // 외곽선이면 밝은 글자
        align: "center"
    }).setOrigin(0.5);

    // 외곽선 두께는 글자 크기에 비례 (너무 얇거나 두껍지 않게)
    if (outline) {
        text.setStroke(PIXEL.inkText, Math.max(4, Math.round(fontSize * 0.25)));
    }

    box.add(text);
    return box;
}


// ---------------------------------------------------
// 왼쪽 위 "<" 뒤로가기 버튼 (48 x 40)
// ---------------------------------------------------
export function createBackButton(scene, x, y, onClick) {
    const box = createPixelBox(scene, { x, y, w: 48, h: 40, onClick });

    // 폰트 글자 대신 네모 5개로 그린 픽셀 화살표 (12 x 20)
    [[8, 0], [4, 4], [0, 8], [4, 12], [8, 16]].forEach(([px, py]) => {
        box.add(scene.add.rectangle(px - 6, py - 10, 4, 4, PIXEL.ink).setOrigin(0));
    });

    return box;
}


// ---------------------------------------------------
// 상단바: 뒤로가기 버튼 + 화면 제목
// fontSize : 제목 글자 크기 (안 적으면 18)   
// 반환값: margin(화면 가장자리 여백), top(상단바 아래에서 내용이 시작되는 y)
// ---------------------------------------------------
export function createTopBar(scene, title, onBack, fontSize = 18) {
    const { width } = scene.scale;

    const margin = Math.max(16, Math.round(width * 0.03));
    const barH = 40;
    const y = margin + barH / 2;

    createBackButton(scene, margin + 24, y, onBack);

    scene.add.text(margin + 48 + 12, y, title, {
        fontFamily: PIXEL.font,
        fontSize: `${fontSize}px`,   // 18 고정 → 받은 값
        color: PIXEL.paperText
    }).setOrigin(0, 0.5);

    return { margin, top: margin + barH + 16 };
}


// ---------------------------------------------------
// 카드 격자 위치 계산 (마지막 줄은 카드 수가 적으면 가운데로 모음)
// count  : 카드 개수 / columns : 한 줄에 몇 개
// width  : 화면 폭 / areaW : 카드들이 놓일 영역 폭 / top : 시작 y
// cardH  : 카드 높이 / gap : 카드 사이 간격
// 반환값: [{ x, y, w, h }, ...] (x, y는 카드 가운데)
// ---------------------------------------------------
export function gridPositions({ count, columns, width, areaW, top, cardH, gap }) {
    const cardW = Math.floor((areaW - gap * (columns - 1)) / columns);
    const list = [];

    for (let i = 0; i < count; i++) {
        const row = Math.floor(i / columns);
        const col = i % columns;

        const inRow = Math.min(columns, count - row * columns);
        const rowW = inRow * cardW + (inRow - 1) * gap;

        list.push({
            x: (width - rowW) / 2 + col * (cardW + gap) + cardW / 2,
            y: top + row * (cardH + gap) + cardH / 2,
            w: cardW,
            h: cardH
        });
    }

    return list;
}


// ---------------------------------------------------
// 이름표 카드 (위: 미리보기 색 / 아래: 이름표)
// 맵 선택, 캐릭터 선택 화면에서 같이 씁니다.
// skyColor    : 미리보기 배경색 (숫자 색)
// groundColor : 있으면 미리보기 아래쪽에 땅 띠를 깔아줌
// lockedText  : 있으면 미리보기를 어둡게 덮고 이 글자를 보여줌 (잠김 등)
// ---------------------------------------------------
export function createLabelCard(scene, { x, y, w, h, label, skyColor, groundColor = null, lockedText = null, onClick }) {
    const card = createPixelBox(scene, { x, y, w, h, onClick });

    // 카드 안쪽 영역 (테두리 4px 안쪽). 좌표는 카드 가운데가 (0, 0)
    const innerW = even(w) - BORDER * 2;
    const innerH = even(h) - BORDER * 2;
    const left = -innerW / 2;
    const topEdge = -innerH / 2;
    const previewH = innerH - LABEL_H - DIVIDER;

    // 미리보기
    card.add(scene.add.rectangle(left, topEdge, innerW, previewH, skyColor).setOrigin(0));

    if (groundColor !== null) {
        const groundH = Math.round(previewH * 0.22);
        card.add(scene.add.rectangle(left, topEdge + previewH - groundH, innerW, groundH, groundColor).setOrigin(0));
    }

        // 구분선 + 이름표
    card.add(scene.add.rectangle(left, topEdge + previewH, innerW, DIVIDER, PIXEL.ink).setOrigin(0));

    const labelY = topEdge + previewH + DIVIDER;
    card.add(scene.add.rectangle(left, labelY, innerW, LABEL_H, PIXEL.paper).setOrigin(0));

    // 이름표 글자: 밝은 글자 + 남색 외곽선 (잠긴 카드는 흐린 색)
    const labelText = scene.add.text(0, labelY + LABEL_H / 2, label, {
        fontFamily: PIXEL.font,
        fontSize: "18px",
        color: lockedText ? PIXEL.mutedText : PIXEL.paperText
    }).setOrigin(0.5);

    labelText.setStroke(PIXEL.inkText, 5);
    card.add(labelText);

    // 잠김: 미리보기를 어둡게 덮고 안내 글자
    if (lockedText) {
        card.add(scene.add.rectangle(left, topEdge, innerW, previewH, PIXEL.shadow, 0.6).setOrigin(0));

        // 잠김 / 준비 중 글자도 외곽선
        const lockText = scene.add.text(0, topEdge + previewH / 2, lockedText, {
            fontFamily: PIXEL.font,
            fontSize: "20px",
            color: PIXEL.paperText
        }).setOrigin(0.5);

        lockText.setStroke(PIXEL.inkText, 5);
        card.add(lockText);
    }
    return card;
}