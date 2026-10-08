import Phaser from 'phaser';
import { loadAllSprite } from '../preload/Preload';
import { createAllAnimations } from '../animations/Animations';
import { createModeSelectUI } from '../ui/ModeSelect';

// API 조회
import { getGameTicket, getGameCoin } from '../../common/GameAPI';
import { loadingWindowSpawn } from '../windowSpawn/Loading';
import { errorMessageSpawn } from '../windowSpawn/ErrorMessages';

export default class ModeSelectScene extends Phaser.Scene {
    constructor() {
        super('ModeSelectScene'); 
    }

    // perload: 이미지 불러오기
    preload() {
    
        // 모든 이미지 불러오기(preload/Preload.js)
        loadAllSprite(this);
    }

    async create() {

        // 모든 애니메이션 불러오기(aniations/Aniations.js)
        createAllAnimations(this);

        // 로딩화면 생성
        const loadingWindow = loadingWindowSpawn(this, "게임을 불러오는 중");

        // 처리 도중에 종료 등의 이유로 중단시
        let cancle = false;
        const onShotDown = () => {
            cancle = true;
        };

        // 종료시 이벤트
        this.events.once("shutdown", onShotDown);

        try {

            // 두 요청을 함께 시작하고, 둘 다 완료될 때까지 기다림
            const [ticketCount, coinCount] = await Promise.all([
                getGameTicket(),
                getGameCoin(),
            ]);

            // 중단했으면 리턴
            if (cancle) return;

            // 다른 씬에서도 읽을 수 있게 레지스트리에 저장( 이방식이 더 편해보이더라고요 )
            this.registry.set("coinCount", coinCount);

            // 로딩화면 제거
            loadingWindow.destroy();

            // 로딩 끝나고 모드선택 버튼 UI 생성(ui/ModeSelect.js)
            createModeSelectUI(this, ticketCount);
        }

        catch(error) {
            // 중단했으면 리턴
            if (cancle) return;

            console.error("에러코드: ", error);

            if (loadingWindow.active) {
                loadingWindow.destroy();
            }

            // 둘중 하나라도 에러나면 작동
            // 사실 코인이나 티켓 갯수를 못불러왔다는거지만, 그냥 게임을 못불러왔다고 적었습니다
            errorMessageSpawn(this, "게임을 불러오지 못했습니다.\n 메인 화면으로 이동해주세요.\n" + error)
        }

        // 다 끝났으면 만들어둔 종료 이벤트를 지우기
        finally {
            this.events.off("shutdown", onShotDown);
        }
    }
}