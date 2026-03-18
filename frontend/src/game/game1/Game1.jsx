import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
import GameScene from "./scenes/GameScene";

const Game1 = () => {
  const gameContainer = useRef(null);

  useEffect(() => {
    // 페이저 게임 환경 설정
    const config = {
      type: Phaser.AUTO,

      pixelArt: true, // 업스케일링 해도 픽셀이 깨지지 않도록 설정

      scale: {
        mode: Phaser.Scale.RESIZE, // 페이저 기능, 창크기에 따라서 캔버스 크기를 자동으로 맞춘다
        parent: gameContainer.current, // 렌더링 기준? 인거같다
        width: "100%",
        height: "100%",
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
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <div ref={gameContainer} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default Game1;
