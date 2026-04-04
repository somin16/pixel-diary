import Phaser from "phaser";
import { monsterDead, monstersHitDamageBase } from "../monsters/Monsters";

export function autoAttackArrow(scene) {

    // 활
    if (scene.player.arrowLevel > 0) {

      attackArrow(scene)
    }
}

// 활 공격(arrow)
// 레벨마다 화살 발사속도가 증가하고, 딜레이가 감소된다
// 현재 활로는 오브젝트를 부술수 없습니다. 
function attackArrow(scene) {

    // 플레이어의 위치를 받고
    const posX = scene.player.x;
    const posY = scene.player.y;

    // 화면내에 있는 적만 공격하기 위해 화면영역을 선언
    const ingameView = scene.cameras.main.worldView;

    // 화면거리내에 있는 몬스터들만 선택
    let targetMonster = scene.monsters.getChildren().filter(m => {

      return m.active && ingameView.contains(m.x, m.y);
    });

    if (targetMonster.length == 0) return // 한마리도 없으면 취소

    let target = scene.physics.closest(scene.player, targetMonster);

    const arrowEff = scene.physics.add.sprite(posX, posY, "arrow");
    arrowEff.setScale(3);

    // 화살이 몬스터를 향하도록 각도를 조정
    const angle = Phaser.Math.Angle.Between(posX, posY, target.x, target.y);
    arrowEff.setRotation(angle + Phaser.Math.DegToRad(135)); // 지금 이미지가 왼쪽 위를 바라보고 있음으로 135도를 꺾으면 딱 직각이 된다

    // 화살 속도
    const arrowSpeed = 800 * scene.player.arrowLevel / 3; // 화살 레벨에 따라서 속도증가
    scene.physics.velocityFromRotation(angle, arrowSpeed, arrowEff.body.velocity);

    scene.physics.add.overlap(arrowEff, scene.monsters, (arrow, monster) => {

      if (monster.isHit) return;

      // 몬스터가 대미지를 받을때 넉백되는 수치
      const knockback = 35;

      // 공통적으로 사용하는 몬스터가 받는 대미지 효과
      monstersHitDamageBase(monster, knockback, scene); 
      monster.hp -= (scene.player.damage * 0.5);

      // 몬스터가 죽었는지 살았는지 감지
      monsterDead(monster, scene);

      // 피격후 화살 삭제
      arrow.destroy();
    });

    // 화살이 안맞았을경우를 대비해서 20초후에 자동파괴
    scene.time.delayedCall(2000, () => {
      if(arrowEff.active) arrowEff.destroy();
    });
}