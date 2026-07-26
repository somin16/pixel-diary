// 부모 클래스인 scene을 받아서 작동하는 함수
export function loadAllSprite(scene) {

    // 모든 이미지 로드는 여기서 관리합니다
    // 이미지에는 모두 언더바를 넣는것으로 하겠습니다(가독성을 위해)

    // ========================플레이어 + 공격 이펙트=========================
    // 플레이어 이미지
    scene.load.image("player_stop", "/assets/game1/player/player_stop.png");

    // 플레이어 이동 이미지
    scene.load.image("player_move1", "/assets/game1/player/player_move1.png");
    scene.load.image("player_move2", "/assets/game1/player/player_move2.png");
    scene.load.image("player_move3", "/assets/game1/player/player_move3.png");

    // 공격 이미지

    // 블레이드(기본무기)
    scene.load.image("blade_1", "/assets/game1/attacks/blade/blade_1.png");
    scene.load.image("blade_2", "/assets/game1/attacks/blade/blade_2.png");
    scene.load.image("blade_3", "/assets/game1/attacks/blade/blade_3.png");

    // 활
    scene.load.image("arrow","/assets/game1/attacks/arrow/arrow.png");

    // 화염구
    scene.load.image("fire_ball","/assets/game1/attacks/fire_ball/fire_ball.png")
    // 화염구 파티클
    scene.load.image("fire_ball_particle","/assets/game1/attacks/fire_ball/fire_ball_particle.png")


    // ======================몬스터===================================
    // 몬스터 이미지

    // 슬라임(몬스터1)
    scene.load.image("slime_move1", "/assets/game1/monster/nomal/slime_move1.png");
    scene.load.image("slime_move2", "/assets/game1/monster/nomal/slime_move2.png");

    // 큐브골렘(몬스터2)
    // 애니메이션이 많을경우엔 이미지가 아니라 스프라이트시트로 받는다
    // 이때는 .spritesheet를 사용
    scene.load.spritesheet("cube_golem_move", "/assets/game1/monster/nomal/cube_golem_move.png", {
        frameWidth: 16, 
        frameHeight: 16
    }); 

    // 레드슬라임(몬스터3)
    scene.load.image("red_slime_move1", "/assets/game1/monster/nomal/red_slime_move1.png");
    scene.load.image("red_slime_move2", "/assets/game1/monster/nomal/red_slime_move2.png");

    // 슬라임 소대(몬스터11)
    scene.load.image("phalanx_move1", "/assets/game1/monster/elite/phalanx_move1.png")
    scene.load.image("phalanx_move2", "/assets/game1/monster/elite/phalanx_move2.png")

    // 킹슬라임?(몬스터101)
    // 스프라이트 시트로 만들어졌으니 .image가 아닌 .spritesheet로 생성
    scene.load.spritesheet("king_slime_move", "/assets/game1/monster/boss/king_slime_move.png", {
        frameWidth: 64,
        frameHeight: 48
    });

    // 킹슬라임?의 돌진모션
    // 프레임이 적어서 시트로 안받아도 되지만 스프라이트 시트 사용에 익숙해지기 위해 시트로 사용하겠습니다
    scene.load.spritesheet("king_slime_dash", "/assets/game1/monster/boss/king_slime_dash.png", {
        frameWidth: 64,
        frameHeight: 48
    });

    // 킹슬라임?의 돌진 준비모션
    scene.load.spritesheet("king_slime_dash_ready", "/assets/game1/monster/boss/king_slime_dash_ready.png", {
        frameWidth: 64,
        frameHeight: 48
    });

    // 킹슬라임?의 점프 모션 1~3
    scene.load.spritesheet("king_slime_jump_1", "/assets/game1/monster/boss/king_slime_jump_1.png", {
        frameWidth: 64,
        frameHeight: 48
    });

    scene.load.spritesheet("king_slime_jump_2", "/assets/game1/monster/boss/king_slime_jump_2.png", {
        frameWidth: 64,
        frameHeight: 48
    });

    scene.load.spritesheet("king_slime_jump_3", "/assets/game1/monster/boss/king_slime_jump_3.png", {
        frameWidth: 64,
        frameHeight: 48
    });

    // =======================타일======================================

    // 타일
    scene.load.image("map1_tile1", "/assets/game1/tile/map1/map1_tile1.png");


    // =========================ui=======================================
    // HP/경험치바에서 공용으로 사용하는 ui바 배경
    scene.load.image("background_bar", "/assets/game1/ui/background_bar.png");

    // HP바
    scene.load.image("hp_bar", "/assets/game1/ui/hp_bar.png");

    // 경험치바
    scene.load.image("exp_bar", "/assets/game1/ui/exp_bar.png");

    // 레벨업 창 배경
    scene.load.image("level_up_background", "/assets/game1/ui/level_up_background.png");

    // 메뉴창 배경
    scene.load.image("menu_window", "/assets/game1/ui/menu_window.png");

    // 메뉴버튼
    scene.load.image("menu_window_button", "/assets/game1/ui/menu_button.png");

    // 점수 정산 이미지
    scene.load.spritesheet("game_end_image", "/assets/game1/ui/game_end_image.png", {
        frameWidth: 32,
        frameHeight: 32
    });

    // 티켓 이미지(프론트엔드 에셋 폴더에서 가져왔습니다)
    scene.load.image("ticket", "/assets/theme/winter_light/icons/ticket_icon.png");

    // ====================메뉴 아이콘=====================================
    // 메뉴아이콘
    scene.load.image("menu_icon", "/assets/game1/ui/menu_icon/menu_icon.png");
    // 사운드아이콘
    scene.load.image("sound_icon_on", "/assets/game1/ui/menu_icon/sound_icon_on.png");
    scene.load.image("sound_icon_off", "/assets/game1/ui/menu_icon/sound_icon_off.png");

    // 레벨업시에 사용할 아이콘들
    // =====================스킬 아이콘=====================================

    // 블레이드
    scene.load.image("blade_icon", "/assets/game1/ui/skill_icon/blade_icon.png");

    // 화살
    scene.load.image("arrow_icon", "/assets/game1/ui/skill_icon/arrow_icon.png");

    // 화염구
    scene.load.image("fireball_icon", "assets/game1/ui/skill_icon/fireball_icon.png");

    // 공격력
    scene.load.image("damage_icon","/assets/game1/ui/skill_icon/damage_icon.png");

    // 이동속도
    scene.load.image("speed_icon","/assets/game1/ui/skill_icon/speed_icon.png");

    // 자동회복
    scene.load.image("auto_heal_icon","/assets/game1/ui/skill_icon/auto_heal_icon.png");


    // =====================오브젝트=========================================
    // 경험치 구슬
    scene.load.image("exp_ball", "/assets/game1/object/exp/exp_ball.png");

    // 큰 경험치 구슬
    scene.load.image("exp_ball_big","/assets/game1/object/exp/exp_ball_big.png");

    // 상자
    scene.load.image("chest_level_1", "/assets/game1/object/chest/chest_level_1.png");

    // 고기(회복 아이템)
    scene.load.image("meat", "/assets/game1/object/drop_item/meat.png");

    // 자석
    scene.load.image("magnet", "/assets/game1/object/drop_item/magnet.png");

    // 코인
    scene.load.image("coin", "/assets/game1/object/drop_item/coin.png");
}