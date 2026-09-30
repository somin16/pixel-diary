export function barUiSetting(scene) {

    // 현재 화면의 가로 세로 크기 받기
    const { width, height } = scene.cameras.main;

    // ======================HP=====================

    // 배경
    scene.hpBar = scene.add.nineslice(0, 0, 'background_bar', 0, 8, 4, 1, 1, 1, 1);
    scene.hpBar.width = 20;
    scene.hpBar.setDepth(100); // 레이어 우선순위(높을수록 우선)
    scene.hpBar.setScale(2); // setScale: 해상도 조정, N배만큼 키워준다
    scene.hpBar.setScrollFactor(0);

    // 실제 차오르는 체력
    scene.addHPValue = scene.add.nineslice(0, 0, 'hp_bar', 0, 8, 4, 1, 1, 1, 1);
    scene.addHPValue.width = 20;
    scene.addHPValue.setDepth(101);
    scene.addHPValue.setOrigin(0, 0.5);
    scene.addHPValue.setScale(2); // setScale: 해상도 조정, N배만큼 키워준다
    scene.addHPValue.setScrollFactor(0);

    // ====================경험치====================

    // 경험치바 위치
    const expBarPosX = width / 2;
    const expBarPosY = height * 0.15;

    // 차오르는 경험치바 한정 위치
    const addExpPosX = expBarPosX - scene.scale.width / 2.5;

    // 경험치 바 배경(expBar)
    // nieslice는 상하좌우 n픽셀은 건들지않고 크기를 조정할 수 있다.
    // (x,y, 텍스쳐이름, 프레임, 가로, 세로, 보호픽셀 좌,우,위,아래)
    scene.expBar = scene.add.nineslice(expBarPosX, expBarPosY, 'background_bar', 0, 16, 8, 1, 1, 1, 1); 
    scene.expBar.setScrollFactor(0); // 카메라를 따라오도록 설정한다
    scene.expBar.width = scene.scale.width / 2.5; // 배경UI 넓이 설정
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

    // 카메라 로직 변경으로 인해 HP바의 위치도 고정로직으로 변경
    const { width, height } = scene.cameras.main;

    const x = Math.round(width / 2);
    const y = Math.round(height / 2 + 25);

    // 이제 해당 위치에 고정됩니다
    scene.hpBar.setPosition(x, y);
    scene.addHPValue.setPosition(
        x - scene.hpBar.displayWidth / 2,
        y
    );  
}