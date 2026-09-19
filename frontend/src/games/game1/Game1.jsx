import { Capacitor } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";

import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";
import GameScene from "./scenes/GameScene";
import ModeSelectScene from "./scenes/ModeSelectScene";
import { useRemoveTicket, useSubmitFinalScore } from "../../hooks/queries/useGameQueries";

const Game1 = () => {
	const gameContainer = useRef(null);
	const navigate = useNavigate();
	const { mutate: submitScore } = useSubmitFinalScore(1); // 미니게임1에서 사용하기에 1
															// 차후에 미니게임2에서 사용 할때는 2로 입력하시면 됩니다.
	const { mutate: removeTicket } = useRemoveTicket();

	// ================= 화면 방향 관리 =================
  	useEffect(() => {

		// 일반 웹 브라우저에서는 실행 X
		if (!Capacitor.isNativePlatform()) return;

		// 게임 진입 시 가로 화면으로 전환 및 고정
		const landscapeRequest = ScreenOrientation.lock({
		orientation: "landscape",
		
		}).catch((error) => {
			console.error("가로 화면 전환 실패:", error);
		});

		// 게임 화면에서 나갈 때 세로 화면으로 복구
		return () => {

		// 진입 요청이 끝난 뒤 복구 요청 실행
		void landscapeRequest
			.then(() =>
			ScreenOrientation.lock({
				orientation: "portrait",
			})
			)
			.catch((error) => {
			console.error("세로 화면 복구 실패:", error);
			});
		};
  }, []);

  useEffect(() => {

    // 게임 종료시 이벤트
    const handleExitGame = () => {
      navigate("/"); // 새로고침(메모리 초기화) 없이 부드럽게 홈으로 이동
    };

    // 점수 저장 이벤트
    const handelSubmitScore = (event) => submitScore(event.detail);

    // 티켓 사용 이벤트
    const handleRemoveTicket = () => removeTicket();

    // 이벤트 설정
    // 이제 함수식으로 불러올 수 있습니다
    window.addEventListener("exitMiniGame", handleExitGame);
    window.addEventListener("submitFinalScore", handelSubmitScore);
    window.addEventListener("useTicket", handleRemoveTicket);

    const config = {
      type: Phaser.AUTO,
      pixelArt: true, // 업스케일링 해도 픽셀이 깨지지 않도록 설정
      roundPixels: true, // 픽셀 찌그러짐 방지

    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.NO_CENTER,
        parent: gameContainer.current, // 렌더링 기준 설정
        // width: 800,
        // height: 360,
      },

      physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 } }, // 중력제거
      },
      
      // 모드 선택 씬을 먼저 실행
      scene: [ModeSelectScene, GameScene],
    };

    // 게임 실행
    const game = new Phaser.Game(config);

    // 컴포넌트가 꺼질 때 게임 엔진도 같이 파괴 (메모리 누수 방지)
    return () => {
      game.destroy(true);
      // 이벤트 제거
      window.removeEventListener("exitMiniGame", handleExitGame); 
      window.removeEventListener("submitFinalScore", handelSubmitScore);
      window.removeEventListener("useTicket", handleRemoveTicket);
    };
  }, [navigate]);

return (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,

      overflow: "hidden",
      backgroundColor: "#000000",
      touchAction: "none",
      textAlign: "left",
    }}
  >
    <div
      ref={gameContainer}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  </div>
);
};

export default Game1;
