import Phaser from "phaser";
import Slime from "../monsters/Slime.js"; 
import CubeGolem from "../monsters/Cubegolem.js";
import { addExpBall } from "../player/ExpBall.js";
import { updateHP } from "../player/Hp.js";

// 몬스터 이동 로직
export function monsterMove(scene) {

    // 몬스터 이동 로직
    scene.monsters.getChildren().forEach((monster) => { // monsters에 있는 자식들을 monster로 받는다

      if (monster.active) { // 살아있는 몬스터가 있을때만

        // 이렇게 설정하면 현재 몬스터(클래스)의 move를 알아서 작동시킵니다.
        // 슬라임이면 슬라임, 큐브골렘이면 큐브골렘의 move를 사용
        monster.move(scene.player);
      }
    });
}

// 몬스터가 플레이어에게 닿을시 오버랩
export function overlapMonstersHit(scene) {

    scene.physics.add.overlap(scene.player, scene.monsters, (player, monster) => {

    if (player.isDamage) return; // 피해 입는중이면 패스

    updateHP(scene.player, monster.damage, scene);

    player.isDamage = true;
    player.setTint(0xff0000); // 피격 이펙트(붉은색)

    // 0.2초후에 피격종료
    scene.time.delayedCall(200, () => {
        player.isDamage = false;
        player.clearTint(); // 피격 이펙트 제거
    });
    }, null, scene);
}

// 공용으로 사용할 몬스터가 받는 피해 효과
// 이 부분은 그냥 knockback으로 두겠습니다
// 함수내에서 변수로 받는 부분이고, monsterKnockbackBasic을 쓰면 가독성이 너무 안좋게 변합니다
export function monstersHitDamageBase(monster, knockback, scene) {

    monster.isHit = true;
    monster.setTintFill(0xffffff); // 히트효과
    // setTint와는 조금 다른 setTintFill은 스프라이트의 명도 조절이 아닌 스프라이트 위에 색 자체를 덮어버린다

    let knockbackValue = knockback * monster.resistance;

    // 몬스터가 바라보는 방향에 따라서 넉백으로 변경
    if (monster.flipX) { 
      monster.body.setVelocityX(-knockbackValue * monster.resistance); 
    } 
      
    else {
      monster.body.setVelocityX(knockbackValue);
    }

    // 위 아래
    monster.body.setVelocityY(Phaser.Math.Between(-knockbackValue, knockbackValue));

    scene.time.delayedCall(150, () => {
      if (monster.active) {
          monster.clearTint(); // 타격 이펙트 되돌리기
          monster.isHit = false;
        }
    });
    // 몬스터가 죽었는지를 감지
    monsterDead(monster, scene);
  }

// 몬스터 스폰
function spawnMonster(scene) {

    // 생성범위
    const SPAWN_RADIUS = 400;
    // Between을 통해 랜덤한 각도를 뽑아낸다
    const randomAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

    // 플레이어의 현재 위치와 비교하여 원의 테두리 좌표에 몬스터가 스폰될 위치를 정합니다
    const SPAWN_X = scene.player.x + Math.cos(randomAngle) * SPAWN_RADIUS;
    const SPAWN_Y = scene.player.y + Math.sin(randomAngle) * SPAWN_RADIUS;

    // 설명: 플레이어를 기준으로 반지름이 400인 원을 그린뒤 그 원의 테두리를 기준으로 랜덤하게 몬스터를 소환한다

    // 몬스터 생성확률

    // 슬라임 생성확률을 기준으로 계산한다
    let slimeSpawnPercent = 100; //

    // 20초가 지나기전까진 슬라임만 생성되며, 시간이 지나면 다른 몬스터의 확률이 증가
    if (scene.gamePlayTime > 280) {
      slimeSpawnPercent = 100;
    }

    else {
      slimeSpawnPercent = 80;
    }

    // 1부터 100을 랜덤으로 뽑는다
    const randomSpawn = Phaser.Math.Between(1, 100);

    // 뽑은게 슬라임의 스폰값보다 낮으면 슬라임, 높으면 다른몬스터
    if (randomSpawn <= slimeSpawnPercent) spawnSlime(SPAWN_X, SPAWN_Y, scene); // 여기에 소환이 되면 안됨으로 부모 클래스인 scene을 추가
    else spawnCubeGolem(SPAWN_X, SPAWN_Y, scene);
}

// 슬라임 생성
function spawnSlime(PosX, PosY, scene) { // 함수를 따로 할당했기에 어디에 소환할지도 설정

    // 슬라임을 생성(monsters/Slime.js)
    // 현재 클래스(씬)의 X좌표, Y좌표값에 현재 난이도증가정도(mosnterStatus)를 적용해서 슬라임을 소환한다
    let slime = new Slime(scene, PosX, PosY, scene.monsterStatus);
    scene.monsters.add(slime); // monsters 배열에 넣는다
    }

    // 큐브골렘 생성
    function spawnCubeGolem(PosX, PosY, scene) {
  
      // 큐브골렘을 생성(monsters/CubeGolem.js)
      let cubeGolem = new CubeGolem(scene, PosX, PosY, scene.monsterStatus);
      scene.monsters.add(cubeGolem); // monsters 배열에 넣는다
}

// 이벤트 생성 함수
export function addEventMonsterLevelUp(scene) {

    // 20초마다 몬스터의 체력이 증가하고 스폰률이 올라가는 이벤트
    scene.time.addEvent({
      delay: 20000,
      callback: monsterLevelUp(scene),
      callbackScope: scene,
      loop: true,
    });
} 

// 몬스터 레벨업(스탯 증가)
function monsterLevelUp(scene) {

    scene.monsterStatus += 1; // 현재는 임시로 전체 가중치1 증가로 설정
    updateMonsterSpawn(scene);
}

// 몬스터 스폰률 업데이트
function updateMonsterSpawn(scene) {

    // 중복 방지
    if (scene.monsterSpawnTimer) {
      scene.monsterSpawnTimer.remove();
    }

    // 시간이 지날수록 스폰속도가 점점 빨라진다
    let newDelay = 2500 - (50 * scene.monsterStatus);

    scene.monsterSpawnTimer = scene.time.addEvent({
      delay: newDelay,
      callback: () => spawnMonster(scene),
      callbackScope: scene,
      loop: true,
    })
}

// 몬스터가 죽었는지 살았는지 감지
export function monsterDead(monster, scene) {

    // 죽었으면~
    if (monster.hp <= 0) {
        addExpBall(monster.x, monster.y, scene);
        monster.destroy(); // 체력이 다 달면 없애기
    }

    // 살았으면~
    else {

        // 0.15초후에 무적판정 종료
        scene.time.delayedCall(150, () => {
            if (monster.active) {
                monster.clearTint(); // 타격 이펙트 되돌리기
                monster.isHit = false;
            }
        });
    }
}