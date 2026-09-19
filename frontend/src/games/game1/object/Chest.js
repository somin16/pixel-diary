import Phaser from "phaser";

// 눈맵에서만 사용되는 선물상자 생성
export function spawnChest(scene) {
    
    // 생성위치(고정된 위치)
    const SPAWN_X = scene.player.x;
    const SPAWN_Y = scene.player.y - 150;

    // 상자 생성
    let snowChest = scene.chests.create(SPAWN_X, SPAWN_Y, "snow_chest");
    snowChest.hp = 10; // 임시수치(아마 150 ~ 200정도 될거같습니다)
    snowChest.resistance = 0;
    snowChest.isHit = false;
    snowChest.setScale(2);
}