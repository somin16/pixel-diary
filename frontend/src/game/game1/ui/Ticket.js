import { useGameTicket } from "../../TicketApiManage";

// 티켓 사용여부 UI 생성
export function ticketUseUI(scene) {

    // UI를 모두 넣을 컨테이너
    scene.ticketUI = scene.add.container(0, 0);
    scene.ticketUI.setScrollFactor(0);
    scene.ticketUI.setDepth(500);

    // 티켓 사용중에는 다른 UI가 눌리지 않도록
    scene.isTicketSelect = true;

    // 가로세로 중앙
    const centerX = scene.cameras.main.width / 2;
    const centerY = scene.cameras.main.height / 2;

    // 반투명 검은배경을 게임 전체에 깔기
    const backGround = scene.add.rectangle(
        centerX,
        centerY,
        scene.cameras.main.width,
        scene.cameras.main.height,
        0x000000,
        0.9
    );

    // 티켓 사용 문구
    const ticketUseText = scene.add.text(centerX, centerY / 1.5 , 
        "특별 티켓을 사용하시겠습니까?" , {
        fontFamily: "Mona",
        fontSize: "20px",
        fill: "#ffffff"
    }).setOrigin(0.5); // 중앙정렬

    // 티켓 효과 설명
    const ticketInfo = scene.add.text(centerX, centerY / 1.33 , 
        "사용 시 모든 점수가 2배가 됩니다!" , {
        fontFamily: "Mona",
        fontSize: "16px",
        fill: "#ffef84"
    }).setOrigin(0.5); // 중앙정렬

    // 티켓 이미지
    const ticketIcon = scene.add.image(centerX, centerY, "ticket")
        .setOrigin(0.5).setScale(2);

    // 티켓 갯수 텍스트
    const ticketText = scene.add.text(centerX, ticketIcon.y + 48 , "보유 갯수: " + scene.ticketCount, {
        fontFamily: "Mona",
        fontSize: "18px",
        fill: "#ffffff"
    }).setOrigin(0.5); // 중앙정렬

    // 사용 버튼 배경
    const yesButton = scene.add.rectangle(centerX - 75, centerY / 0.75, 100, 40, 0x44aa44)
            
        .setScrollFactor(0) // 이거 안하면 이상한곳에서 스폰돼서 클릭이 안된다
        .setInteractive()   // 이걸 넣어줘야 클릭이 가능
        .on('pointerdown', async () => { // 누를때 작동

            // 티켓선택 끝
            scene.isTicketSelect = false;

            // 티켓 사용 API
            await useGameTicket();

            // 클릭 이벤트
            scene.scene.start('GameScene', {

                // 이렇게 하면 GameScene에 isTicketUse값을 넘겨줄 수 있다
                // 사용한다고 했으니 true
                isTicketUse: true
            });
    });

    // 사용 버튼 텍스트
    const yesButtonText = scene.add.text(centerX - 75, centerY / 0.75, "티켓 사용!", {
        fontFamily: "Mona",
        fontSize: "18px",
        fill: "#ffffff"
    }).setOrigin(0.5);

    // 아니요 버튼 배경
    const noButton = scene.add.rectangle(centerX + 75, centerY / 0.75, 100, 40, 0xFF6961)
            
        .setScrollFactor(0) // 이거 안하면 이상한곳에서 스폰돼서 클릭이 안된다
        .setInteractive()   // 이걸 넣어줘야 클릭이 가능
        .on('pointerdown', () => { // 누를때 작동

            // 티켓선택 끝
            scene.isTicketSelect = false;

            // 클릭 이벤트
            scene.scene.start('GameScene', {

                // 이렇게 하면 GameScene에 isTicketUse값을 넘겨줄 수 있다
                // 사용안하니 false
                isTicketUse: false
            });
    });

    // 아니요 버튼 텍스트
    const noButtonText = scene.add.text(centerX + 75, centerY / 0.75, "사용 안 함", {
        fontFamily: "Mona",
        fontSize: "18px",
        fill: "#ffffff"
    }).setOrigin(0.5);

    // 만든거 다 넣어주기
    scene.ticketUI.add([

        backGround,
        ticketUseText,
        ticketInfo,
        ticketIcon,
        ticketText,
        yesButton,
        yesButtonText,
        noButton,
        noButtonText
    ])
}