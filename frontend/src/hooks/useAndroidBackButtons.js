// src/hooks/useAndroidBackButton.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';

export function useAndroidBackButton() {
    const navigate = useNavigate();

    useEffect(() => {
        // 안드로이드 뒤로가기 버튼 이벤트 감지
        const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack) {
                // 뒤로 갈 페이지가 있으면 뒤로가기
                navigate(-1);
            } else {
                // 뒤로 갈 페이지가 없으면 앱 종료
                App.exitApp();
            }
        });

        // 컴포넌트 언마운트 시 이벤트 제거
        return () => {
            backButtonListener.then((listener) => listener.remove());
        };
    }, [navigate]);
}