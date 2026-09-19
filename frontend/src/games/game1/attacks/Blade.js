import Phaser from "phaser";
import { monstersHitDamageBase } from "../monsters/Monsters";
import { objectsHitDamageBase } from "../object/Objects";

// 블레이드의 넉백수치
const knockback = 150;

export function autoAttackBlade(scene) {

    // 기본공격(블레이드)
    if (scene.player.bladeLevel > 0) {

      attackBlade(scene)
    }
}


// 기본무기 공격(blade)
// 2레벨: 공격범위증가
// 3레벨: 공격력 증가
// 4레벨: 추가로 뒤를 공격
function attackBlade(scene) {

    // 몬스터 공격 판정
    const bladeHitbox = (bladeSpriteEff) => {

      scene.physics.add.overlap(bladeSpriteEff, scene.monsters, (damage, monster) => {
        // 이미 타격중인 몬스터는 무시함
        if (monster.isHit) return;

        // 타격 처리 시작
        monstersHitDamageBase(monster, knockback, scene); // 공통적으로 사용하는 몬스터가 받는 대미지 효과

        // 3레벨 이상이면 공격력의 200%만큼의 대미지
        if(scene.player.bladeLevel >= 3) monster.hp -= scene.player.damage * 2;
        
        // 아니면 공격력의 150%만큼의 대미지
        else monster.hp -= scene.player.damage * 1.5;                           

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

    // 블레이드의 레벨이 4이상이라면 뒤도 공격
    if(scene.player.bladeLevel >= 4) {

      scene.time.delayedCall(200, () => {
      const bladeEffBack = scene.physics.add.sprite(posX - OFFSET_X, posY, "blade_1");

      if(scene.player.bladeLevel >= 2) bladeEffBack.setScale(5);
      else bladeEffBack.setScale(4);

      bladeEffBack.setFlipX(!isLeft);
      bladeEffBack.play("blade_animation");

      bladeHitbox(bladeEffBack);
      });
    }

    // 오브젝트(상자)에 닿았을때
    scene.physics.add.overlap(bladeEff, scene.chests, (eff, chest) => {

      if(chest.isHit == true) return;

      // 3레벨 이상이면 공격력의 200%만큼의 대미지
      if(scene.player.bladeLevel >= 3) chest.hp -= scene.player.damage * 2;
      // 아니면 공격력의 150%만큼의 대미지
      else chest.hp -= scene.player.damage * 1.5;   

      objectsHitDamageBase(chest, knockback, scene);
    });

    // animationcomplete: 애니메이션이 끝날때
    bladeEff.on("animationcomplete", () => {
      bladeEff.destroy();
    });
}