// 배경 세팅
export function backgroundTileSet(scene) {

  // 추가맵이면?
  if (scene.mapType == "default") {

    // 타일맵 깔기
    // 화면 크기에 딱 맞춰준다
    scene.backGroundTile = scene.add.tileSprite(
      scene.cameras.main.width / 2,  // X좌표(중앙)
      scene.cameras.main.height / 2, // Y좌표(중앙)
      scene.cameras.main.width,      // 넓이
      scene.cameras.main.height,     // 높이
      "map1_tile1")                 // 이미지
      .setScrollFactor(0)           // 카메라 중앙 고정
      .setScale(2)                  // 크기 2배로
      .setDepth(-1);                // 배경이니 맨뒤로
      
    // 설명: 카메라의 가운데를 기준으로 화면크기만큼 꽉차게 배경타일을 깔아준다
  }

  // 아니면? (추가맵)
  else {

    setSnowBackground(scene);
    updateSnowBackground(scene); // 첫 화면에 바로 타일이 보이도록 1회 선실행
  }
}


// 배경이 카메라에 따라오도록 세팅
export function backGroundTileCameraSet(scene) {

  // 기본 맵일 경우
  if (scene.mapType == "default") { 

    // 배경타일맵(backGroundtile)을 카메라의 위치에 따라 갱신해준다
    scene.backGroundTile.tilePositionX = scene.cameras.main.scrollX / 2;
    scene.backGroundTile.tilePositionY = scene.cameras.main.scrollY / 2;
  }

  // 추가맵일 경우 다른 로직 사용
  else {

    updateSnowBackground(scene);
  }
}

// 현재 맵 크기만큼의 타일들을 activeTiles에 세팅
export function setSnowBackground(scene) {
  scene.activeTiles = new Map();
}

// 타일 사이즈 지정(160타일을 2배 크기로 사용하니 320으로 세팅)
const TILE_SIZE = 320;

// 각 타일별로 확률을 세팅
const TILE_PERCENTS = [
  { key: "map2_tile1", percent: 0.90 },
  { key: "map2_tile2", percent: 0.025 },
  { key: "map2_tile3", percent: 0.025 },
  { key: "map2_tile4", percent: 0.025 },
  { key: "map2_tile5", percent: 0.025 },
];

// 난수 생성 함수
function hashToUnitFloat(width, height) {

  // 같은 입력에는 같은 패턴이 나오도록 하는 난수 생성 로직(Math.random은 부자연스러움)
  // 설명하기엔 좀 힘든 부분이라 자연스러운 난수 생성기 정도로 이해하시면됩니다
  let h = width * 374761393 + height * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (Math.abs(h) % 100000) / 100000; // 0.00000 ~ 0.99999
}

// 타일을 세팅해주는 함수
function pickTile(width, height) {

  // 난수를 받아온다
  const roll = hashToUnitFloat(width, height);
  let cumulative = 0;

  // 타일 리스트를 훑어서
  for (const { key, percent } of TILE_PERCENTS) {

    // 값이 얼마인지 넣어놓고
    cumulative += percent;

    // 받아온 난수와 비교하여 타일의 키값을 반환
    if (roll < cumulative) return key;

  }

  // 오차로인해 어떤값도 안걸릴 경우를 대비하여 아무것도 지나지 못했을경우에는 
  // 기본적으로 0번 타일을 세팅
  return TILE_PERCENTS[0].key;
}


// 눈 맵의 타일을 배경에 무작위로 배치
export function updateSnowBackground(scene) {
  
  // 카메라 받기
  const cam = scene.cameras.main;
  const buffer = 1; // 화면 크기보다 타일 1칸만큼의 범위를 추가로 세팅하기위해 변수 선언

  // 가로세로의 각각 시작점과 끝점
  const startwidth = Math.floor(cam.scrollX / TILE_SIZE) - buffer;
  const endWidth = Math.ceil((cam.scrollX + cam.width) / TILE_SIZE) + buffer;
  const startHeight = Math.floor(cam.scrollY / TILE_SIZE) - buffer;
  const endHeight = Math.ceil((cam.scrollY + cam.height) / TILE_SIZE) + buffer;

  // 화면의 칸목록을 미리 담아둘 변수(화면 밖으로 타일이 넘어갈때 지우기용)
  const screenTiles = new Set();

  for (let width = startwidth; width <= endWidth; width++) {

    // 현재 화면 크기에 맞춰서 필요한만큼의 칸을 찾는다
    for (let height = startHeight; height <= endHeight; height++) {
      const key = `${width},${height}`;
      screenTiles.add(key); // 그 칸수만큼 screenTiles에 넣는다

      // 해당하는 칸에 아직 타일이 없으면
      if (!scene.activeTiles.has(key)) {

        // pickTile로 타일키를 받아서
        const tileKey = pickTile(width, height);

        // 타일을 만든다
        const tile = scene.add
          .image(width * TILE_SIZE + TILE_SIZE / 2, height * TILE_SIZE + TILE_SIZE / 2, tileKey)
          .setScale(2) // 크기 2배로
          .setDepth(-1);

        // 만들어진 타일을 activeTiles에 세팅
        scene.activeTiles.set(key, tile);
      }
    }
  }

  // 현재 카메라에서 벗어난 타일들은
  for (const [key, tile] of scene.activeTiles) {

    if (!screenTiles.has(key)) {

      tile.destroy(); // 이곳에서 지워준다
      scene.activeTiles.delete(key);
    }
  }
}