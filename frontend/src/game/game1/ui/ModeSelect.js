import { getGameTicket } from "../../TicketApiManage";
import { ticketUseUI } from "./Ticket";

export async function createModeSelectUI(scene) {

    // API로 티켓 갯수를 받아온다
    const myTicketCount = await getGameTicket();

    // 연동받은 값을 할당
    scene.ticketCount = myTicketCount;

    // 현재 화면의 가로 세로 크기 받기
    const { width, height } = scene.cameras.main;

    // 중앙 설정
    const centerX = width / 2;
    const centerY = height / 2;

    // 상단 타이틀(게임 모드 선택)
    scene.add.text(centerX, centerY - 250, '게임 모드 선택', {
        fontFamily: 'Mona',
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#ffffff'
    }).setOrigin(0.5);

    // 일반모드 버튼
    createModeButton("basic", centerX - 85, centerY, () => {

        // 티켓 사용 UI일 경우엔 클릭 x
        if (scene.isTicketSelect == true) return;

        // 0개가 아닐 경우에만 UI 생성
        if (scene.ticketCount != 0) {

            // 클릭 이벤트
            ticketUseUI(scene);
        }

        // 0개면 그냥 바로 시작
        else {

            scene.scene.start('GameScene', {

                // 이렇게 하면 GameScene에 isTicketUse값을 넘겨줄 수 있다
                // 0개니 사용을 안함으로 false
                isTicketUse: false
            });
        }
    }
    ,scene);

        
    // 무한모드 버튼
    createModeButton("infinity", centerX + 85, centerY, () => {

        // 티켓 사용 UI일 경우엔 클릭 x
        if (scene.isTicketSelect == true) return;

        // 클릭 이벤트
        console.log("구현 X");
        }
    ,scene);
}

// 버튼 생성 함수 (모드타입, xy좌표, 클릭 이벤트 자동연결)
export function createModeButton(modType, x, y, onClick, scene) {

    // 선택지 버튼 크기
    const btnWidth = 150;
    const btnHeight = 250;

    // UI 다 담아둘 컨테이너
    const container = scene.add.container(x, y);

    // 배경(원래라면 스프라이트로 이미지를 넣어서 구현하는게 맞지만, 
    // 코드로 구현하는 창도 크게 나쁘지 않아서 임시로 사용하겠습니다)
    const background = scene.add.rectangle(0, 0, btnWidth, btnHeight, 0x222222, 0.8)
        .setStrokeStyle(3, 0xffffff);

    // 모드 이름
    let modName = scene.add.text(0, -btnHeight / 2 + 40, "", {
        fontFamily: 'Mona',
        fontSize: '24px', 
        color: '#ffd700'
    }).setOrigin(0.5);

    // 모드 설명
    let modInfo = scene.add.text(0, btnHeight / 2 - 50, "", {
        fontFamily: 'Mona',
        fontSize: '16px', 
        color: '#ffffff', 
        align: 'center',
        wordWrap: { width: btnWidth - 40 } 
    }).setOrigin(0.5);

    // 모드 이미지
    let modImageView = scene.add.sprite(0, 0, "");
    modImageView.setScale(3);

    // 기본이면..
    if (modType == "basic") {

        // 모드 이름
        modName.setText("일반 모드");

        // 모드 설명
        modInfo.setText("기본적인 모드입니다!");

        // 모드 설명 이미지
        modImageView.setTexture("slime_move1");
        modImageView.play("slime_animation", true);
    }

    // 아니면..(무한모드)
    else {

        // 모드 이름
        modName.setText("무한 모드");

        // 모드 설명
        modInfo.setText("구현중..");

        // 모드 설명 이미지
        modImageView.setTexture("phalanx_move1");
        modImageView.play("phalanx_animation", true);
    }

    // 만든거 다 넣기
    container.add([background, modName, modInfo, modImageView]);

    // 컨테이너 전체를 클릭범위로 지정(setSize)
    container.setSize(btnWidth, btnHeight);
    container.setInteractive({ useHandCursor: true });

    // 클릭 이벤트 연결
    container.on('pointerdown', onClick);
}
