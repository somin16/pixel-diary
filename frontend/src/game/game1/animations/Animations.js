// 부모 클래스인 scene을 받아서 작동하는 함수
export function createAllAnimations(scene) {

    // 플레이어 움직임 애니메이션
    // anims: 이미지를 조합하여 애니메이션을 만들어준다
    // 스프라이트 시트가 아닌 각 이미지 형식일경우 프레임마다 key값을 넣어준다
    scene.anims.create({ // 원래는 this로 시작했지만 지금은 부모 클래스에 넣어줘야하니 scene을 적는다
      key: "move_animation",
      frames: [{ key: "player_move1" }, { key: "player_move2" }, { key: "player_move3" }],
      frameRate: 10,
      repeat: -1,
    });

    // 몬스터1
    // 슬라임 애니메이션
    scene.anims.create({
      key: "slime_animation",
      frames: [{ key: "slime_move1"}, { key: "slime_move2"}],
      frameRate: 5, // 키프레임 살짝 느리게(10으로 하니까 너무 촐싹거림)
      repeat: -1,
    });

    // 몬스터2
    // 큐브골렘 애니메이션
    const cubeGolemFrames = [];

    // 큐브골렘은 12프레임의 애니메이션중 1,4,7,10프레임마다 잠깐씩 멈춰서는 몬스터기에 전용 애니메이션을 구축해준다
    for (let i = 0; i < 12; i ++) {

      const isStopFrame = [0,3,6,9].includes(i); // 배열의 0,3,6,9번째를 할당(0부터 시작함으로 1씩 빼준다)

      cubeGolemFrames.push({
        key: 'cube_golem_move', // 불러올 스프라이트 시트
        frame: i,
        duration: isStopFrame ? 1000 : 100 // 0,3,6,9번째 프레임마다 1000ms로 할당
                                           // 그 외에는 100ms 
      });
    }

    scene.anims.create({
      key: 'cube_golem_animation',
      frames: cubeGolemFrames, // 위에서 만들어진 프레임대로 애니메이션을 제작해준다
      repeat: -1
    });

    // 몬스터3
    // 레드슬라임 애니메이션
    scene.anims.create({
      key: "red_slime_animation",
      frames: [{ key: "red_slime_move1"}, { key: "red_slime_move2"}],
      frameRate: 10,
      repeat: -1,
    });

    // 몬스터11
    // 슬라임소대 애니메이션
    scene.anims.create({
      key: "phalanx_animation",
      frames: [{ key: "phalanx_move1"}, { key: "phalanx_move2"}],
      frameRate: 5,
      repeat: -1,
    });

    // 기본 공격(블레이드) 애니메이션
    scene.anims.create({
      key: "blade_animation",
      frames: [{ key: "blade_1" }, { key: "blade_2" }, { key: "blade_3" }],
      frameRate: 10,
      repeat: 0,
    });

}