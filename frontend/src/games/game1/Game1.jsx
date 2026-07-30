import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";
import GameScene from "./scenes/GameScene";
import ModeSelectScene from "./scenes/ModeSelectScene";

const Game1 = () => {

  const gameContainer = useRef(null);
  const navigate = useNavigate();

  // isDev: 테스트용으로 만든 변수명입니다.
  // imprt.meta.env.DEV: 현재 개발중이면 true, 아니면 false로 지정
  // isDev가 true일때 미니 게임 화면이 세로로 돌아가지않습니다.
  // isDev가 false일때는 세로로 돌아가있습니다.
  let isDev = import.meta.env.DEV;

  // flase일때의 화면도 보고 싶다면 이 코드의 주석을 해제해주세요.
  // isDev = false; 

  useEffect(() => {

    // Phaser가 보내는 '게임 종료' 신호를 듣고 반응하는 함수
    const handleExitGame = () => {
      navigate("/"); // 새로고침(메모리 초기화) 없이 부드럽게 홈으로 이동!
    };

    // 신호 수신기 부착
    window.addEventListener("exitMiniGame", handleExitGame);

    // 현재 개발중인지, 배포중인지에 따라서 받는 화면값을 다르게 조정(개발 편의성을 위한 과정)
    const landscapeWidth = isDev ? window.innerWidth : window.innerHeight;
    const landscapeHeight = isDev ? window.innerHeight : window.innerWidth;

    const config = {
      type: Phaser.AUTO,
      pixelArt: true, // 업스케일링 해도 픽셀이 깨지지 않도록 설정
      roundPixels: true, // 픽셀 찌그러짐 방지

    scale: {
        mode: Phaser.Scale.NONE, // 가로 화면에서의 사용을 위해 NONE으로 변경
                                 // 이전 방법으로는 화면이 확대되어 보입니다.
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: gameContainer.current, // 렌더링 기준 설정
        width: landscapeWidth,
        height: landscapeHeight,
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

    // 조건문 에러 방지를 위해 미리 NULL로 선언
    let handlePointerRaw = null;

    // 개발중이 아닌 경우에 좌표보정
    if (!isDev) {

      // 회전했을때의 좌표 보정을 위해 페이저에서 좌표 변환을 담당하는 ScaleManager(game.scale)을 받아옵니다.
      const scaleManager = game.scale;

      // 연산된 게임 내부 좌표를 임시 저장하기위해 변수를 미리 선언
      let cachedGameX = 0;
      let cachedGameY = 0;

      // 회전후의 좌표값을 받아내기
      function getTransform(pageX, pageY) {

        // 화면이 회전된 상태일때의 그려진 위치와 크기를 받는다
        const rect = scaleManager.canvas.getBoundingClientRect();

        // 클릭한 위치가 캔버스 안에서 어디쯤인지를 비율로 계산한다
        const fracY = (pageY - rect.top) / rect.height;
        const fracX = (pageX - rect.left) / rect.width;

        // 회전한거에 맞춰서 X좌표값과 Y좌표값을 서로 교환
        cachedGameX = fracY * scaleManager.game.config.width;
        cachedGameY = (1 - fracX) * scaleManager.game.config.height;
      }

      // 터치 시 이벤트 감지용 e: 이벤트
      const handlePointerRaw = (e) => {

        // 마우스 클릭, 화면 터치등의 이벤트가 발생하면(touches)
        const pageX = e.pageX ?? e.touches?.[0]?.pageX;
        const pageY = e.pageY ?? e.touches?.[0]?.pageY;

        // 혹시 모르는 오류 방지를 위해 둘다 값이 있을때만
        if (pageX != null && pageY != null) {

          // 입력받은 값들을 토대로 회전후의 좌표값을 뽑는 함수 실행
          getTransform(pageX, pageY);
        }
      };

      // 만들어 놓은 handlePointerRaw를 페이저 내부 리스너보다 먼저 작동하도록 할당(capture: true)
      // 페이저보다 먼저 작동시켜놓는 이유는 이걸 해놓지 않으면 더블클릭을 해야 클릭이 성공하는 버그가 발생했기 때문
      game.canvas.addEventListener("pointerdown", handlePointerRaw, { capture: true });
      game.canvas.addEventListener("pointermove", handlePointerRaw, { capture: true });

      // 화면을 클릭할때 페이저에 넘겨줄 값을 지정 
      // (X좌표)
      scaleManager.transformX = function () {
        return cachedGameX;
      };
          
      // (Y좌표)
      scaleManager.transformY = function () {
        return cachedGameY;
      };
    }

    // 컴포넌트가 꺼질 때 게임 엔진도 같이 파괴 (메모리 누수 방지)
    return () => {

      game.destroy(true);
      window.removeEventListener("exitMiniGame", handleExitGame); // 신호 수신기 제거

      // 개발 모드가 아니였을때만 클릭보정을 제거
      if (handlePointerRaw) {

        game.canvas?.removeEventListener("pointerdown", handlePointerRaw, { capture: true });
        game.canvas?.removeEventListener("pointermove", handlePointerRaw, { capture: true });
      }
    };
  }, [navigate]);

  // isDev가 true일때(개발중일때)
  return isDev ? (

    // 개발용화면: 옆으로 돌리지않음
    <div 
      style={{ 
      position: "fixed", 
      top: 0, 
      left: 0, 
      width: "100vw", 
      height: "100vh", 
      zIndex: 9999 
      }}
    >
      <div ref={gameContainer} style={{ width: "100%", height: "100%" }} />
    </div>

  ) : ( // isDev가 false일때(개발중이 아닐때)

    // 완성후에 사용할 화면 : 옆으로 돌려져있음
    <div
      style={{
      position: "fixed",
      top: 0,
      left: "100%",
      width: "100vh",
      height: "100vw",
      transformOrigin: "0 0",
      transform: "rotate(90deg)",
      overflow: "hidden",
      zIndex: 9999,
      }}
    >
      <div ref={gameContainer} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default Game1;
