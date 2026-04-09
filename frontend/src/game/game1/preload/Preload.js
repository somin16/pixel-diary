// 부모 클래스인 scene을 받아서 작동하는 함수
export function loadAllSprite(scene) {

    // 모든 이미지 로드는 여기서 관리합니다
    // 이미지에는 모두 언더바를 넣는것으로 하겠습니다(가독성을 위해)

    // ========================플레이어 + 공격 이펙트=========================
    // 플레이어 이미지
    scene.load.image("player_stop", "/assets/game1/Player/player_stop.png");

    // 플레이어 이동 이미지
    scene.load.image("player_move1", "/assets/game1/Player/player_move1.png");
    scene.load.image("player_move2", "/assets/game1/Player/player_move2.png");
    scene.load.image("player_move3", "/assets/game1/Player/player_move3.png");

    // 공격 이미지

    // 블레이드(기본무기)
    scene.load.image("blade_1", "/assets/game1/Attacks/Blade/blade_1.png");
    scene.load.image("blade_2", "/assets/game1/Attacks/Blade/blade_2.png");
    scene.load.image("blade_3", "/assets/game1/Attacks/Blade/blade_3.png");

    // 활
    scene.load.image("arrow","/assets/game1/Attacks/Arrow/arrow.png");

    // 화염구
    scene.load.image("fireball","/assets/game1/Attacks/FireBall/fireball.png")
    // 화염구 파티클
    scene.load.image("fireball_particle","/assets/game1/Attacks/FireBall/fireball_particle.png")


    // ======================몬스터===================================
    // 몬스터 이미지

    // 슬라임(몬스터1)
    scene.load.image("slime_move1", "/assets/game1/Monster/Nomal/slime_move1.png");
    scene.load.image("slime_move2", "/assets/game1/Monster/Nomal/slime_move2.png");

    // 큐브골렘(몬스터2)
    // 애니메이션이 많을경우엔 이미지가 아니라 스프라이트시트로 받는다
    // 이때는 .spritesheet를 사용
    scene.load.spritesheet("cube_golem_move", "/assets/game1/Monster/Nomal/cube_golem_move.png", {
        frameWidth: 16, 
        frameHeight: 16
    }); 

    // 레드슬라임(몬스터3)
    scene.load.image("red_slime_move1", "/assets/game1/Monster/Nomal/red_slime_move1.png");
    scene.load.image("red_slime_move2", "/assets/game1/Monster/Nomal/red_slime_move2.png");

    // =======================타일======================================

    // 타일
    scene.load.image("map1_tile1", "/assets/game1/Tile/map1/map1_tile1.png");


    // =========================UI=======================================
    // 공통으로 사용하는 UI바 배경
    scene.load.image("background_bar", "/assets/game1/Ui/background_bar.png");

    // HP바
    scene.load.image("hp_bar", "/assets/game1/Ui/hp_bar.png");

    // 경험치바
    scene.load.image("exp_bar", "/assets/game1/Ui/exp_bar.png");

    // 레벨업 창 배경
    scene.load.image("level_up_background", "/assets/game1/Ui/level_up_background.png");


    // 레벨업시에 사용할 아이콘들
    // =====================스킬 아이콘=====================================

    // 블레이드
    scene.load.image("blade_icon", "/assets/game1/Ui/Skill_Icon/blade_icon.png");

    // 화살
    scene.load.image("arrow_icon", "/assets/game1/Ui/Skill_Icon/arrow_icon.png");

    // 화염구
    scene.load.image("fireball_icon", "assets/game1/Ui/Skill_Icon/fireball_icon.png");

    // 공격력
    scene.load.image("damage_icon","/assets/game1/Ui/Skill_Icon/damage_icon.png");

    // 이동속도
    scene.load.image("speed_icon","/assets/game1/Ui/Skill_Icon/speed_icon.png");

    // 자동회복
    scene.load.image("autoHeal_icon","/assets/game1/Ui/Skill_Icon/autoHeal_icon.png");


    // =====================오브젝트=========================================
    // 경험치 구슬
    scene.load.image("exp_ball", "/assets/game1/Object/Exp/exp_ball.png");

    // 상자
    scene.load.image("chest_level_1", "/assets/game1/Object/Chest/chest_level_1.png");

    // 고기(회복 아이템)
    scene.load.image("meat", "/assets/game1/Object/DropItem/meat.png");


}