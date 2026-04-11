import Phaser from "phaser";
import { monstersHitDamageBase } from "../monsters/Monsters";
import { addDropItemMeat } from "../Object/Meat";

export function autoAttackBlade(scene) {

    // 기본공격(블레이드)
    if (scene.player.bladeLevel > 0) {

      attackBlade(scene)
    }
}


// 기본무기 공격(blade)
// 2레벨: 공격범위증가
// 3레벨: 추가로 뒤를 공격
function attackBlade(scene) {

    // 몬스터 공격 판정
    const bladeHitbox = (bladeSpriteEff) => {

      scene.physics.add.overlap(bladeSpriteEff, scene.monsters, (damage, monster) => {
      // 이미 타격중인 몬스터는 무시함
      if (monster.isHit) return;

      // 블레이드의 넉백수치
      const knockback = 150;

      // 타격 처리 시작
      monstersHitDamageBase(monster, knockback, scene); // 공통적으로 사용하는 몬스터가 받는 대미지 효과
      monster.hp -= scene.player.damage * 1.5; // 공격력의 150%만큼의 대미지

      });

      // animationcomplete: 애니메이션이 끝날때
      bladeSpriteEff.on("animationcomplete", () => {
        bladeSpriteEff.destroy();
      });
    }

    // 플레이어의 위치를 받고
    const posX = scene.player.x;
    const posY = scene.player.y;

    // 플레이어의 방향을 받는다
    const isLeft = scene.player.flipX;

    // 좌우에 따라서 생성 위치를 변경
    const OFFSET_X = isLeft ? -50 : 50;
    const bladeEff = scene.physics.add.sprite(posX + OFFSET_X, posY, "blade_1");

    // 레벨이 2이상이라면 크기를 키워준다
    if(scene.player.bladeLevel >= 2) bladeEff.setScale(5);
    else bladeEff.setScale(4);

    bladeEff.setFlipX(isLeft);
    bladeEff.play("blade_animation");

    bladeHitbox(bladeEff);

    // 블레이드의 레벨이 3이상이라면 뒤도 공격
    if(scene.player.bladeLevel >= 3) {

      scene.time.delayedCall(200, () => {
      const bladeEffBack = scene.physics.add.sprite(posX - OFFSET_X, posY, "blade_1");

      if(scene.player.bladeLevel >= 2) bladeEffBack.setScale(5);
      else bladeEffBack.setScale(4);

      bladeEffBack.setFlipX(!isLeft);
      bladeEffBack.play("blade_animation");

      bladeHitbox(bladeEffBack);
      });
    }

    // 오브젝트 공격 판정(몬스터 공격 판정과 같습니다.)
    // 오브젝트 부분은 차후에 몬스터와 통합해줄 필요가 있어보임, 우선은 보류중
    scene.physics.add.overlap(bladeEff, scene.chests, (damage, chest) => {

      if (chest.isHit) return;

      chest.isHit = true;
      chest.hp -= 1;
      chest.setTintFill(0xffffff);

      if (chest.hp <= 0) {
        addDropItemMeat(chest.x, chest.y, scene);
        chest.destroy(); // 체력이 다 달면 없애기
      }

      else {

        // 0.1초후에 무적판정 종료
        // 상자는 어느정도의 연타를 허용해줘서 빠르게 부술 수 있도록 0.1초로 설정
        scene.time.delayedCall(100, () => {
          if (chest.active) {
            chest.clearTint(); // 타격 이펙트 되돌리기
            chest.isHit = false;
          }
        });
      }
    });

    // animationcomplete: 애니메이션이 끝날때
    bladeEff.on("animationcomplete", () => {
      bladeEff.destroy();
    });
}