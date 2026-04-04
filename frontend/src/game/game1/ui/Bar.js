export function barUiSetting(scene) {

    // ======================HP=====================

    // 배경
    scene.hpBar = scene.add.nineslice(0, 0, 'background_bar', 0, 8, 4, 1, 1, 1, 1);
    scene.hpBar.width = 20;
    scene.hpBar.setDepth(100); // 레이어 우선순위(높을수록 우선)
    scene.hpBar.setScale(2); // setScale: 해상도 조정, N배만큼 키워준다

    // 실제 차오르는 체력
    scene.addHPValue = scene.add.nineslice(0, 0, 'hp_bar', 0, 8, 4, 1, 1, 1, 1);
    scene.addHPValue.width = 20;
    scene.addHPValue.setDepth(101);
    scene.addHPValue.setOrigin(0, 0.5);
    scene.addHPValue.setScale(2); // setScale: 해상도 조정, N배만큼 키워준다


    // ====================경험치====================

    // 경험치바 위치
    const expBarPosX = scene.cameras.main.width / 2;
    const expBarPosY = scene.cameras.main.height / 15;

    // 차오르는 경험치바 한정 위치
    const addExpPosX = expBarPosX - 150;

    // 경험치 바 배경(expBar)
    // nieslice는 상하좌우 n픽셀은 건들지않고 크기를 조정할 수 있다.
    // (x,y, 텍스쳐이름, 프레임, 가로, 세로, 보호픽셀 좌,우,위,아래)
    scene.expBar = scene.add.nineslice(expBarPosX, expBarPosY, 'background_bar', 0, 16, 8, 1, 1, 1, 1); 
    scene.expBar.setScrollFactor(0); // 카메라를 따라오도록 설정한다
    scene.expBar.width = 150; // 배경UI 넓이 설정
    scene.expBar.setDepth(100); // 레이어 우선순위(높을수록 우선)
    scene.expBar.setScale(2); // setScale: 해상도 조정, N배만큼 키워준다

    // 경험치
    scene.addExpValue = scene.add.nineslice(addExpPosX, expBarPosY, 'exp_bar', 0, 16, 8, 1, 1, 1, 1); 
    scene.addExpValue.setOrigin(0, 0.5); // 왼쪽에서 오른쪽으로 늘어나게 한다
    scene.addExpValue.setScrollFactor(0); // 카메라를 따라오도록 설정한다
    scene.addExpValue.setDepth(101); // 해당 스프라이트를 최상단 레이어에 놓는다
    scene.addExpValue.setScale(2);

    scene.addExpValue.setVisible(false); // setVisible: 개체 보이기/숨기기(기본 true)
                                        // 시작할때 채워지는 경험치 가리기
}

// HP바 위치 조정
export function hpBarPosSet(scene) {

    // HP바 배경
    scene.hpBar.setPosition(scene.player.x , scene.player.y + 25);

    // 채워지는 HP
    scene.addHPValue.setPosition(scene.player.x - (scene.hpBar.width / 2 + 10), scene.player.y + 25);    
}