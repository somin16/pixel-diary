import { Capacitor } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";

import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

import ModeSelectScene from "./scenes/ModeSelectScene";
import GameScene from "./scenes/GameScene";
import CharacterSelectScene from "./scenes/CharacterSelectScene";
import SettingsScene from "./scenes/SettingsScene";


const Game2 = () => {
    const gameContainer = useRef(null);

    useEffect(() => {
        let cancelled = false;
        let game = null;
        let resizeObserver = null;
        let resizeFrame = null;

        const isNative = Capacitor.isNativePlatform();

        // 앱을 가로 화면으로 변경
        const orientationRequest = isNative
            ? ScreenOrientation.lock({
                orientation: "landscape",
            }).catch((error) => {
                console.error("가로 화면 전환 실패:", error);
            })
            : Promise.resolve();

        const startGame = async () => {
            await orientationRequest;

            if (cancelled || !gameContainer.current) {
                return;
            }

            const container = gameContainer.current;

            game = new Phaser.Game({
                type: Phaser.AUTO,

                parent: container,

                pixelArt: true,
                roundPixels: true,

                backgroundColor: "#223344",

                scale: {
                    mode: Phaser.Scale.RESIZE,
                    autoCenter: Phaser.Scale.CENTER_BOTH,

                    width: container.clientWidth,
                    height: container.clientHeight,
                },

                physics: {
                    default: "arcade",

                    arcade: {
                        // 중력
                        gravity: {
                            y: 0,
                        },

                        debug: false,
                    },
                },

                // 맨 앞의 씬이 가장 먼저 시작됨
                scene: [
                    ModeSelectScene,
                    GameScene,
                    CharacterSelectScene,
                    SettingsScene,
                ],
            });

            // 화면 크기가 변경되면 Phaser도 같이 변경
            resizeObserver = new ResizeObserver(() => {

                if (resizeFrame !== null) {
                    cancelAnimationFrame(resizeFrame);
                }

                resizeFrame = requestAnimationFrame(() => {

                    if (cancelled || !game) {
                        return;
                    }

                    const width = container.clientWidth;
                    const height = container.clientHeight;

                    if (width > 0 && height > 0) {
                        game.scale.resize(width, height);
                    }
                });
            });

            resizeObserver.observe(container);
        };

        void startGame();

        return () => {

            cancelled = true;

            resizeObserver?.disconnect();

            if (resizeFrame !== null) {
                cancelAnimationFrame(resizeFrame);
            }

            game?.destroy(true);

            game = null;

            // Game2를 나가면 세로 화면으로 복구
            if (isNative) {

                void orientationRequest
                    .then(() =>
                        ScreenOrientation.lock({
                            orientation: "portrait",
                        })
                    )
                    .catch((error) => {
                        console.error(
                            "세로 화면 복구 실패:",
                            error
                        );
                    });
            }
        };

    }, []);

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,

                zIndex: 9999,

                overflow: "hidden",

                backgroundColor: "#111",

                touchAction: "none",

                textAlign: "left",
            }}
        >
            <div
                ref={gameContainer}
                style={{
                    width: "100%",
                    height: "100%",

                    overflow: "hidden",
                }}
            />
        </div>
    );
};

export default Game2;