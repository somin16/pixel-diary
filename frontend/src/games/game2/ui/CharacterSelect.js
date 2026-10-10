import { showToast } from "./Toast";
import { drawBackground, createTopBar, gridPositions, createLabelCard } from "./PixelUI";

// =====================================================
// 캐릭터 변경 화면 (와이어프레임 5번)
// 캐릭터 카드를 격자로 보여줍니다.
// =====================================================

// 캐릭터 목록. 캐릭터가 준비되면 ready를 true로 바꾸세요.
const CHARACTERS = [
    { name: "캐릭터 1", ready: false },
    { name: "캐릭터 2", ready: false },
    { name: "캐릭터 3", ready: false }
];

const COLUMNS = 4;   // 한 줄에 카드 몇 개
const ROWS = 2;      // 격자 줄 수 (카드 높이를 정하는 데 씀)
const GAP = 16;      // 카드 사이 간격

export function createCharacterSelectUI(scene) {

    const { width, height } = scene.scale;

    drawBackground(scene);

    const { margin, top } = createTopBar(scene, "캐릭터 변경", () => {
        scene.scene.start("ModeSelectScene");
    });

    // 카드 배치 (너무 길쭉해지지 않게 높이는 폭의 1.2배까지만)
    const areaW = Math.min(width - margin * 2, 920);
    const areaH = height - top - margin;
    const cardW = Math.floor((areaW - GAP * (COLUMNS - 1)) / COLUMNS);
    const cardH = Math.min(
        Math.floor((areaH - GAP * (ROWS - 1)) / ROWS),
        Math.round(cardW * 1.2)
    );

    gridPositions({
        count: CHARACTERS.length,
        columns: COLUMNS,
        width,
        areaW,
        top,
        cardH,
        gap: GAP
    }).forEach((pos, i) => {

        const character = CHARACTERS[i];

        createLabelCard(scene, {
            ...pos,
            label: character.name,
            skyColor: 0x3a3f8f,   // 캐릭터 이미지가 들어갈 자리의 임시 배경색
            lockedText: character.ready ? null : "준비중",
            onClick: () => {
                if (!character.ready) {
                    showToast(scene, "아직 준비 중인 캐릭터예요");
                    return;
                }

                // TODO: 캐릭터가 준비되면 여기서 선택 처리
            }
        });
    });
}