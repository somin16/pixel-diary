// 배경 세팅
export function backgroundTileSet(scene) {

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


// 배경이 카메라에 따라오도록 세팅
export function backGroundTileCameraSet(scene) {

    // 배경타일맵(backGroundtile)을 카메라의 위치에 따라 갱신해준다
    scene.backGroundTile.tilePositionX = scene.cameras.main.scrollX / 2;
    scene.backGroundTile.tilePositionY = scene.cameras.main.scrollY / 2;
}