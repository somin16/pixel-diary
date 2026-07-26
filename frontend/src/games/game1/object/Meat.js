// 고기 아이템 생성
export function addDropItemMeat(posX, posY, scene) {

    const meat = scene.dropItems.create(posX, posY, "meat");
    meat.setScale(2); 
    meat.type = "meat";
}