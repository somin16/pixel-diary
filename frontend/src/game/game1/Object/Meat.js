import { updateHP } from "../player/Hp";

// 고기 아이템 생성
export function addDropItemMeat(posX, posY, scene) {

    const meat = scene.dropItems.create(posX, posY, "meat");
    meat.setScale(2); 
}

// 고기를 획득했을 때
export function overlapMeat(scene) {

    // 드랍 아이템(현재는 고기만 있지만, 차후에 더 추가 될수도 있음)
    scene.physics.add.overlap(scene.player, scene.dropItems, (player, dropItem) => {
    
        dropItem.destroy();
        updateHP(scene.player, scene.player.MAX_HP / 2, scene); // 최대 체력의 50%를 채워준다
        player.setTint(0x00ff00);
    
        // 0.1초후에 초록 이펙트 되돌리기
        scene.time.delayedCall(200, () => {
            if (player.active) {
                player.clearTint(); // 이펙트 되돌리기
            }
        });
    },null, scene);
}