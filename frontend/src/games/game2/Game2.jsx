import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
import GameScene from "./scenes/GameScene";

const Game2 = () => {
  const gameContainer = useRef(null);

  useEffect(() => {
    // 페이저 게임 환경 설정
    const config = {
      type: Phaser.AUTO,
      pixelArt: true, // 업스케일링 해도 픽셀이 깨지지 않도록 설정

      scale: {
        mode: Phaser.Scale.FIT, // 화면에 꽉 채워주게 줌인한다
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: gameContainer.current, // 렌더링 기준 설정
        width: 360,
        height: 640,
      },

      physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 } }, // 중력제거
      },
      
      scene: [GameScene],
    };

    // 게임 실행
    const game = new Phaser.Game(config);

    // 컴포넌트가 꺼질 때 게임 엔진도 같이 파괴 (메모리 누수 방지)
    return () => {
      game.destroy(true);
    };
  }, []);

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

export default Game2;
