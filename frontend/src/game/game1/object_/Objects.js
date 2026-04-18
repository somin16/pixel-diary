import { updateHP } from "../player/Hp";

// 오브젝트를 획득했을 때
export function overlapObject(scene) {

    // 드랍 아이템
    scene.physics.add.overlap(scene.player, scene.dropItems, (player, dropItem) => {

        // 중복획득 방지
        if (!dropItem.active) return;
        dropItem.destroy();

        // 고기 획득시
        if(dropItem.type == "meat") {

            updateHP(scene.player, scene.player.MAX_HP / 2, scene); // 최대 체력의 50%를 채워준다
            player.setTint(0x00ff00);
    
            // 0.1초후에 초록 이펙트 되돌리기
            scene.time.delayedCall(200, () => {
                if (player.active) {
                    player.clearTint(); // 이펙트 되돌리기
                }
            });
        }

        // 자석 획득시
        else if(dropItem.type == "magnet") {

            scene.isMagnetOn = true;
            
            // 혹시 이미 자석이 적용중이면???
            if (scene.magnetTimer) {

                // 딜레이콜을 지우고 다시 진행
                scene.magnetTimer.remove();
            }

            // 자석 효과는 10초동안 유지되도록 설정
            // 10초가 지나면 false로 변경한다
            scene.magnetTimer = scene.time.delayedCall(10000, () => {
                scene.isMagnetOn = false;
            });
        }
    },null, scene);
}