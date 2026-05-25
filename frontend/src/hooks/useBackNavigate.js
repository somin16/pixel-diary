// src/hooks/useBackNavigate.js
import { useNavigate } from 'react-router-dom';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

/**
 * 키보드가 열려있을 때 화면 전환 시
 * 키보드를 먼저 내린 후 이동하는 훅
 */
export function useBackNavigate() {
    const navigate = useNavigate();

    // 키보드 닫힘을 기다리는 공통 함수
    const waitForKeyboard = async () => {
        if (!Capacitor.isNativePlatform()) return;

        await Keyboard.hide();
        await Promise.race([
            new Promise(resolve =>
                Keyboard.addListener('keyboardDidHide', () => resolve())
                    .then(listener => setTimeout(() => listener.remove(), 0))
            ),
            new Promise(resolve => setTimeout(resolve, 300))
        ]);
    };

    // 뒤로가기
    const goBack = async (backPath = null) => {
        await waitForKeyboard();
        if (backPath) {
            navigate(backPath, { replace: true });
        } else {
            navigate(-1);
        }
    };

    // 일반 화면 이동
    const goTo = async (path, options = {}) => {
        await waitForKeyboard();
        navigate(path, options);
    };

    return { goBack, goTo };
}