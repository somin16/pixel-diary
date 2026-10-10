import { Capacitor } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { useNavigate } from "react-router-dom";

import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

import ModeSelectScene from "./scenes/ModeSelectScene";
import GameScene from "./scenes/GameScene";
import CharacterSelectScene from "./scenes/CharacterSelectScene";
import SettingsScene from "./scenes/SettingsScene";
import InfinityMenuScene from "./scenes/InfinityMenuScene";

import { buildDiaryInfo } from "./manage/DiaryInfo";

import { supabase } from "../../utils/SupabaseClient";

// 관리자일 때 열어줄 전체 감정 목록 (행복→평온→피로→우울→화남 순서)
const ALL_EMOTIONS = ["happy", "calm", "tired", "sad", "angry"];

// 지금 로그인한 사람이 관리자인지 확인 (MorePage.jsx와 같은 조건)
// 세션을 못 읽거나 오류가 나면 일반 유저로 처리해서 게임은 정상 실행됨
const checkIsAdmin = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user?.app_metadata?.role === "admin";
    } catch (error) {
        console.error("관리자 확인 실패:", error);
        return false;
    }
};

// 일기 없이 게임만 테스트하고 싶을 때 true로 바꾸세요.
// (angry 맵 + 모든 맵 열림 상태로 시작합니다)
// ※ 커밋하기 전에는 반드시 false로 되돌리세요!
const DEV_TEST = false;


const Game2 = () => {
    const gameContainer = useRef(null);

    const navigate = useNavigate();

    const keepLandscapeRef = useRef(false);
    
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

    // 게임종료 → 홈(세로 화면)으로
        const handleExitMiniGame = async () => {
            keepLandscapeRef.current = false; // 세로로 복구해야 함
            if (isNative) {
                try {
                    await ScreenOrientation.lock({ orientation: "portrait" });
                    await new Promise((resolve) => {
                        requestAnimationFrame(() => requestAnimationFrame(resolve));
                    });
                } catch (error) {
                    console.error("세로 화면 전환 실패:", error);
                }
            }
            navigate("/", { replace: true });
        };

        // 뒤로가기 → 미니게임 허브(가로 화면)로
        const handleExitToHub = () => {
            keepLandscapeRef.current = true;  // 가로 유지, 세로로 복구하지 않음
            navigate("/minigamehub", { replace: true });
        };

        window.addEventListener("exitMiniGame", handleExitMiniGame);
        window.addEventListener("exitToMinigameHub", handleExitToHub);

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

            // 관리자는 일기를 안 써도 모든 맵을 열어서 시작 (테스트/검수용)
            // todayEmotion은 그대로 둬서 데일리 모드는 평소 규칙을 따름
            if (await checkIsAdmin()) { 
                diaryInfo = {
                    ...diaryInfo,
                    unlockedEmotions: ALL_EMOTIONS,
                };
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
            window.removeEventListener("exitMiniGame", handleExitMiniGame);
            window.removeEventListener("exitToMinigameHub", handleExitToHub);

            cancelled = true;
            resizeObserver?.disconnect();
            if (resizeFrame !== null) {
                cancelAnimationFrame(resizeFrame);
            }
            game?.destroy(true);
            game = null;

            // 허브로 가는 경우(keepLandscapeRef = true)는 가로 유지, 그 외(홈으로 나가기)만 세로로 복구
            if (isNative && !keepLandscapeRef.current) {
                void orientationRequest
                    .then(() => ScreenOrientation.lock({ orientation: "portrait" }))
                    .catch((error) => {
                        console.error("세로 화면 복구 실패:", error);
                    });
            }
        };


    }, [navigate]);

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
