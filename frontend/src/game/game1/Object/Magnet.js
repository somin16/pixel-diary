// 자석 아이템 생성
export function addDropItemMagnet(posX, posY, scene) {

    const meat = scene.dropItems.create(posX, posY, "magnet");
    meat.setScale(2); 
    meat.type = "magnet";
}

// 자석 아이템 획득시 작동하는 효과
export function magnetActive(scene) {

    if(scene.isMagnetOn) {

        // expBalls그룹의 자식들을 모두 expBall로 받아와서
        scene.expBalls.getChildren().forEach((expBall) => {
                
            if (expBall.active) {
                
                // 그 expBalls가 플레이어에게 400의 속도로 다가오도록 설정
                scene.physics.moveToObject(expBall, scene.player, 400); 
            }
        });
    }
}