import { Capacitor } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";

import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

import ModeSelectScene from "./scenes/ModeSelectScene";
import GameScene from "./scenes/GameScene";
import CharacterSelectScene from "./scenes/CharacterSelectScene";
import SettingsScene from "./scenes/SettingsScene";
import InfinityMenuScene from "./scenes/InfinityMenuScene";

import { buildDiaryInfo } from "./manage/DiaryInfo";


// 일기 목록을 가져오는 API 파일 
import { diaryApi } from "../../api/diaryApi";


// 일기 없이 게임만 테스트하고 싶을 때 true로 바꾸세요.
// (angry 맵 + 모든 맵 열림 상태로 시작합니다)
// ※ 커밋하기 전에는 반드시 false로 되돌리세요!
const DEV_TEST = false;


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
            await document.fonts.load('16px "Mona"');


            // ---------- 일기 정보 가져오기 ----------
            // 오늘 쓴 일기의 감정, 지금까지 쓴 감정들을 알아냅니다.
            let diaryInfo = { todayEmotion: null, unlockedEmotions: [] };

            try {
                
                // diaryApi 안에서 "일기 목록을 가져오는 함수" 
                const res = await diaryApi.getList();

                // 서버 응답이 { diaries: [...] } 모양이든 배열 자체든 둘 다 처리
                diaryInfo = buildDiaryInfo(res?.diaries ?? res);

            } catch (error) {
                // 실패해도 게임은 켜지고, 데일리/무한만 막힙니다.
                console.error("일기 정보 불러오기 실패:", error);
            }

            // 테스트용: 일기 없이 모든 맵을 열어서 시작
            if (DEV_TEST) {
                diaryInfo = {
                    todayEmotion: "angry",
                    unlockedEmotions: ["happy", "calm", "sad", "angry"],
                };
            }


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
                        // 중력 (플레이어에게만 따로 주기 때문에 전체는 0)
                        gravity: {
                            y: 0,
                        },

                        debug: false,
                    },
                },

                // 게임이 켜지기 직전에 일기 정보를 Phaser에 넣어둠
                // → 어느 화면에서든 scene.registry.get("diaryInfo")로 꺼내 쓸 수 있음
                callbacks: {
                    preBoot: (phaserGame) => {
                        phaserGame.registry.set("diaryInfo", diaryInfo);
                    },
                },

                // 맨 앞의 화면이 가장 먼저 시작됨
                scene: [
                    ModeSelectScene,
                    GameScene,
                    CharacterSelectScene,
                    SettingsScene,
                    InfinityMenuScene,
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
