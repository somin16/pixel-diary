import Phaser from "phaser";
import { monsterDead, monstersHitDamageBase } from "../monsters/Monsters";

export function updateAttackFireBall(scene) {

    // 레벨이 1이상일때
    if (scene.player.fireBallLevel > 0) {

        // 화염구 그룹이 없으면 만들고
        if (!scene.fireBallGroup) {
            scene.fireBallGroup = scene.physics.add.group();
        }
        // 있으면 비운다(갯수에 따라 화염구를 재배치 해야함으로)
        else {
            scene.fireBallGroup.clear(true, true);
        }

        // 갯수는 플레이어의 fireBallLevel에 따라 오른다
        const fireBallCount = scene.player.fireBallLevel;
        const RADIUS = 125; // 플레이어로부터의 거리

        // 갯수만큼 화염구 생성
        for (let i = 0; i < fireBallCount; i++) {

            // 갯수에 따라 원형을 그리면서 화염구를 생성
            const angleOffset = (Math.PI * 2 / fireBallCount) * i;
            spawnFireBall(scene, RADIUS, angleOffset);
        }
    }
}

// 화염구 생성
function spawnFireBall(scene, radius, angleOffset) {

    const posX = scene.player.x;
    const posY = scene.player.y;

    // 화염구 이미지 생성
    const fireBallEff = scene.physics.add.sprite(posX, posY, "fireball");
    fireBallEff.setScale(2);
    fireBallEff.setDepth(1);

    // 새로만든 화염구를 그룹에 넣는다
    scene.fireBallGroup.add(fireBallEff);

    // 화염구를 따라다닐 파티클
    const firePaticle = scene.add.particles(0, 0, "fireball_particle", {
        speed: 10, // 파티클이 퍼지는 시간
        scale: { start: 5, end: 0 }, // 파티클이 작아지는 정도(5에서 시작 0으로 끝난다)
        alpha: { start: 1, end: 0 }, // 파티클의 색상이 변하는 정도
        lifespan: 300, // 파티클이 남아있는 시간
        blendMode: 'NORMAL' // NOMAL은 파티클로 사용되는 fireball_particle의 원본색을 유지
                           // 다른걸로는 ADD가 있고 ADD는 다른 색의 영향을 받는다
    });
    firePaticle.startFollow(fireBallEff); // 파티클이 화염구에서 시작되도록 설정
    firePaticle.setDepth(0);

    // 몬스터에 닿았을때
    scene.physics.add.overlap(fireBallEff, scene.monsters, (fireball, monster) => {
        if (monster.isHit) return;

        // 몬스터가 넉백되는 수치
        const knockback = 15;

        // 공통적으로 사용하는 몬스터가 받는 대미지 효과
        monstersHitDamageBase(monster, knockback, scene); 
        monster.hp -= (scene.player.damage * 0.5); // 공격력의 50%만큼의 대미지

        // 몬스터가 죽었는지 살았는지 감지
        monsterDead(monster, scene);
    });

    // 매개변수로 받은 각도
    let currentAngle = angleOffset;
    let orbitSpeed = 2; // 기본 회전 속도

    // 화염구 레벨이 4면 속도가 2배로 증가
    if (scene.player.fireBallLevel == 4) {

        orbitSpeed = 4;
    }

    // 화염구 저글링
    // delta: 현재 게임에서 돌아가는 시간
    const updateOrbit = (time, delta) => {

        // 화염구가 사라지면 저글링 로직을 새로 작성
        if (!fireBallEff.active) {
            scene.events.off('update', updateOrbit); // 이렇게하면 GameScene의 update()에 해당 함수를 끼워넣을수 있다
                                                     // 실험적으로 써보고 별로면 다시 본래 구조로 바꿀예정
            firePaticle.destroy(); // 파티클이 남아있으면 안되니까 삭제
            return;
        }

        // 각도계산 (delta를 곱해 프레임 드랍이 생겨도 속도가 일정하게 유지됨)
        currentAngle += orbitSpeed * (delta / 1000);

        // 받은 각도와 플레이어의 좌표를 합쳐서 최종좌표를 계산
        const newX = scene.player.x + Math.cos(currentAngle) * radius;
        const newY = scene.player.y + Math.sin(currentAngle) * radius;

        fireBallEff.setPosition(newX, newY); // 화염구의 최종위치
        fireBallEff.setRotation(currentAngle + Math.PI / 2); // 화염구 각도 꺾기
    };

    // 만들어진 저글링을 GameScene.js의 update()에 넣는다
    scene.events.on('update', updateOrbit);
}