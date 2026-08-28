import Phaser from "phaser";
import { updateHP } from "../player/Hp";
import { addDropItemMagnet } from "./Magnet";
import { addDropItemMeat } from "./Meat";
import { addBigExpBall, addExpBall } from "../player/ExpBall";

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

// 오브젝트(상자) 히트시 효과
export function objectsHitDamageBase(object, knockback, scene) {

    object.isHit = true;
    object.setTintFill(0xD3D3D3);

    // 넉백 로직은 현재 사용중이진 않지만, 
    // 상자를 칠때마다 조금씩 움직이는것도 재밌지 않을까? 싶기도해서 만들어만 뒀습니다
    let knockbackValue = knockback * object.resistance;

    if (object.resistance != 0) {
    
        if (object.flipX) { 
            object.body.setVelocityX(-knockbackValue); 
        }  
          
        else {
            object.body.setVelocityX(knockbackValue);
        }
    
        // 위 아래
        object.body.setVelocityY(Phaser.Math.Between(-knockbackValue, knockbackValue));
    }

    // 150ms후에 무적해제
    scene.time.delayedCall(150, () => {

        if (object.active) {

            object.clearTint();
            object.isHit = false;
        }
    });

    // 상자가 파괴되면 여러 아이템 드랍
    if (object.hp <= 0) {

        addBigExpBall(object.x - 20, object.y, scene);
        addBigExpBall(object.x + 20, object.y + 15, scene);
        addDropItemMeat(object.x + 20, object.y, scene);
        addDropItemMagnet(object.x, object.y, scene);
        addExpBall(object.x - 15, object.y - 15, scene);
        addExpBall(object.x + 35, object.y - 10, scene);
        object.destroy(); // 체력이 다 달면 없애기
    }
}