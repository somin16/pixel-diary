import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";
import GameScene from "./scenes/GameScene";
import ModeSelectScene from "./scenes/ModeSelectScene";

const Game1 = () => {
  const gameContainer = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Phaser가 보내는 '게임 종료' 신호를 듣고 반응하는 함수
    const handleExitGame = () => {
      navigate("/"); // 새로고침(메모리 초기화) 없이 부드럽게 홈으로 이동!
    };

    // 신호 수신기 부착
    window.addEventListener("exitMiniGame", handleExitGame);

    const config = {
      type: Phaser.AUTO,
      pixelArt: true, // 업스케일링 해도 픽셀이 깨지지 않도록 설정
      roundPixels: true, // 픽셀 찌그러짐 방지

    scale: {
        mode: Phaser.Scale.ENVELOP, // FIT 대신 ENVELOP 사용: 
        // 화면을 꽉 채우기 위해 확대하며, 비율이 다르면 일부가 잘릴 수 있음
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: gameContainer.current, // 렌더링 기준 설정
        width: 360,
        height: 800,
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
      window.removeEventListener("exitMiniGame", handleExitGame); // 신호 수신기 제거
    };
  }, [navigate]);

  return (
    <div
      style={{

        position: "fixed", // 독자적인 화면 구축
        top: 0,
        left: 0,
        zIndex: 9999,

        width: "100vw",
        height: "100vh",
        backgroundColor: "#111", // 화면 밖 검은색으로
        overflow: "hidden",

        textAlign: "left",
      }}
    >
      <div ref={gameContainer} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default Game1;
