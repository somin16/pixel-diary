import Phaser from "phaser";

import { autoAttackBlade } from "./Blade";
import { autoAttackArrow } from "./Arrow";

export function autoAttacks(scene) {

    // 정해진 딜레이(ms)마다 이벤트 발생
    // 블레이드(기본무기)
    scene.time.addEvent({
      delay: 1500,
      callback: () => autoAttackBlade(scene),
      callbackScope: scene,
      loop: true,
    });

    // 활 (레벨업 시스템으로 인해 독자적으로 관리)
    updateArrowTimer(scene);
}

// 활 딜레이 업데이트(레벨당 딜레이 감소)
export function updateArrowTimer(scene) {

    // 중복 방지를 위해 이미 만들어졌으면 지우기
    if (scene.arrowTimer) {
        scene.arrowTimer.remove();
    }

    // 활의 레벨이 오를때마다 딜레이가 줄어든다
    let newDelay = 1250 - (100 * scene.player.arrowLevel);

    // 그 후 딜레이마다 공격
    scene.arrowTimer = scene.time.addEvent({
      delay: newDelay,
      callback: () => autoAttackArrow(scene),
      callbackScope: scene,
      loop: true,
    }); 
}