import Phaser from "phaser";

// 상자 생성 이벤트(현재는 게임 시작 5초후 플레이어 근처에 1회 자동 스폰되도록 임시설정)
export function addEventSpawnChest(scene) {

    scene.time.addEvent({
        delay: 5000,
        callback: () => spawnChest(scene),
        callbackScope: scene,
        loop: false,
    });
}

// 상자 생성
export function spawnChest(scene) {
    
    // 현재 임시로 몬스터 생성 방식과 같은 방식을 채택하였습니다.
    
    // 생성범위
    const SPAWN_RADIUS = 100;
    // Between을 통해 랜덤한 각도를 뽑아낸다
    const randomAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    
    // 플레이어의 현재 위치와 비교하여 원의 테두리 좌표에 몬스터가 스폰될 위치를 정합니다
    const SPAWN_X = scene.player.x + Math.cos(randomAngle) * SPAWN_RADIUS;
    const SPAWN_Y = scene.player.y + Math.sin(randomAngle) * SPAWN_RADIUS;
    
    // 상자(1레벨) 생성
    let chestLevel_1 = scene.chests.create(SPAWN_X, SPAWN_Y, "chest_level_1");
    chestLevel_1.hp = 3;
    chestLevel_1.isHit = false;
    chestLevel_1.setScale(2);
}