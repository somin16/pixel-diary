import Phaser from "phaser";
import { updateArrowTimer } from "../attacks/Attacks";
import { addEventautoHeal } from "./Hp";
import { updateAttackFireBall } from "../attacks/FireBall";

// 플레이어 레벨업
export function levelUpMenu(scene) {

    scene.physics.pause(); // 게임 정지
    scene.time.paused = true; // 시간 정지

    scene.levelUpUI = scene.add.container(0, 0); // 레벨업 UI 그룹을 00에 소환
    scene.levelUpUI.setScrollFactor(0); // 카메라 고정
    scene.levelUpUI.setDepth(500); // 레이어 맨위에 고정

    // 반투명 검은배경을 게임 전체에 깔기
    const backGround = scene.add.rectangle(
      scene.cameras.main.width / 2,
      scene.cameras.main.height / 2,
      scene.cameras.main.width,
      scene.cameras.main.height,
      0x000000,
      0.7
    );

    scene.levelUpUI.add(backGround); // 차후에 한번에 지워줘야하기에 levelUpUI에 넣는다

    // 레벨업 보상(리워드로 할까 하다가 알아먹기 쉽게 이름을 스킬로 정했습니다)
    const skills = [

      // 스탯
      { name: "공격력 증가" , id: "damage_up", icon: "damage_icon"},
      { name: "이동속도 증가", id: "speed_up", icon: "speed_icon"},
      { name: "자연회복 증가", id: "autoHeal_up", icon: "autoHeal_icon"},

      // 무기
      { name: "블레이드", id: "blade_up", icon: "blade_icon"}, // 현재 3레벨까지 구현
      { name: "활", id: "arrow_up", icon: "arrow_icon"}, // 레벨당 속도증가 구현
      { name: "화염구", id: "fireball_up", icon: "fireball_icon"}
    ];

    // 최고레벨에 도달한 스킬들을 걸러내기
    // 버그 방지를 위해 이동속도 증가는 무한적으로 중첩이 가능합니다.
    const removeSkills = skills.filter((skill) => {

      if(skill.id == "damage_up" && scene.player.damage >= 4) {
        return false;
      }
      if(skill.id == "speed_up" && scene.player.speed >= 4) {
        return false;
      }
      if(skill.id == "blade_up" && scene.player.bladeLevel >= 4) {
        return false;
      } 
      if(skill.id == "arrow_up" && scene.player.arrowLevel >= 4) {
        return false;
      }
      if(skill.id == "fireball_up" && scene.player.fireBallLevel >= 4) {
        return false;
      }
      // 조건문 통과하면 냅두기
      return true;
    });

    // 보상이 랜덤으로 나오도록 배열을 섞는다
    Phaser.Utils.Array.Shuffle(removeSkills);

    // 맨앞 3개만 뽑아오기
    const selectSkills = removeSkills.slice(0, 3);

    // 버튼이 들어갈 좌표 설정
    const centerX = scene.cameras.main.width / 2;     // 카메라 가운데
    const startY = 180;        // 첫 번째 버튼의 Y 좌표
    const buttonGap = 100;     // 버튼 간격
    const buttonWidth = 250;   // 버튼 넓이
    const buttonHeight = 80;   // 버튼 높이

    // 보상선택버튼 생성
    selectSkills.forEach((skill, index) => {

      // 버튼이 생성될 초기 위치
      const buttonY = startY + (index * buttonGap);

      // 나인 슬라이스로 레벨업 창의 배경을 생성
      const buttonBackGround = scene.add.nineslice(centerX, buttonY, "level_up_background", 0, buttonWidth, buttonHeight, 1, 1, 1, 1)

      buttonBackGround.setScrollFactor(0) // 가운데 고정
      buttonBackGround.setInteractive() // .setInteractive를 해줘야 클릭이 된다
      buttonBackGround.on('pointerdown', () => selectSkill(skill.id, scene)); // 클릭한 항목의 id를 가져와서 적용한다

      // 배경을 완성했으니 이제 버튼을 넣어줄 그룹생성
      const buttonComponents = [buttonBackGround];


      // 아이콘이 들어갈 적절한 위치
      const iconX = centerX - (buttonWidth / 2) + 35;

      // 아이콘 생성
      const icon = scene.add.image(iconX, buttonY, skill.icon);
      icon.setScale(2); // 크기조정
      icon.setScrollFactor(0); // 화면고정
      icon.setDepth(501); // 아이콘이 묻히지않게 501로 레이어 위치 조정
      buttonComponents.push(icon); // 생성된 아이콘을 배경에 넣는다


      // 텍스트가 들어갈 위치
      const textX = iconX + 45;

      // 텍스트를 넣는다
      const buttonText = scene.add.text(textX, buttonY, skill.name, {
        fontSize: "18px",
        fill: "#ffffff",
        fontFamily: "Arial"
      }).setOrigin(0, 0.5); // 좌측정렬
      buttonComponents.push(buttonText); // 완성된 텍스트를 배경에 넣는다

      // 지금까지 만든 애들을 모두 levelUpUI에 넣어서 한번에 관리한다
      scene.levelUpUI.add([buttonBackGround, buttonText, icon]);
    });
}

function selectSkill(skill_Id, scene) { // skillId는 너무 가독성이 안좋아서 규칙을 무시하고 skill_Id로 했습니다

    // 가짓수가 많기에 스위치 케이스 사용
    switch (skill_Id) {

      // 공격력 증가
      case "damage_up": {

        scene.player.damage += 1;
        break;
      }

      // 이동속도 증가
      case "speed_up" : {

        scene.player.speed += 1;
        break;
      }

      // 자연회복
      case "autoHeal_up" : {

        scene.player.autoHeal += 1;
        addEventautoHeal(scene); // 회복량 갱신
        break;
      }

      // 블레이드(레벨 3까지 구현)
      case "blade_up" : {

        scene.player.bladeLevel += 1;
        break;
      }

      // 활
      case "arrow_up" : {

        scene.player.arrowLevel += 1;
        updateArrowTimer(scene); // 딜레이 갱신
        break;
      }

      // 화염구
      case "fireball_up" : {

        scene.player.fireBallLevel += 1;
        updateAttackFireBall(scene); // 화염구 갯수 갱신
        break;
      }
    }

    // 선택이 종료되면 UI파괴
    scene.levelUpUI.destroy();

    // 시간 다시 되돌리기
    scene.physics.resume();
    scene.time.paused = false;
}