// 아래의 모든 함수는 "같은 이름의 핸들러"가 Game1/2.jsx에 존재해야만 사용이 가능합니다

// 티켓사용
export function useGameTicket() {
    return new Promise((resolve, reject) => {
        window.dispatchEvent(
            new CustomEvent("useTicket", {
                detail: { resolve, reject },
            })
        );
    });
}

// 티켓조회
export function getGameTicket() {
    return new Promise((resolve, reject) => {
        window.dispatchEvent(
            new CustomEvent("getTicket", {
                detail: { resolve, reject },
            })
        );
    });
}

// 코인 조회
export function getGameCoin() {
    return new Promise((resolve, reject) => {
        window.dispatchEvent(
            new CustomEvent("getCoin", {
                detail: { resolve, reject },
            })
        );
    });
}

// 코인 추가
export function addGameCoin(finalScore) {
    return new Promise((resolve, reject) => {
        window.dispatchEvent(
            new CustomEvent("addCoin", {
                detail: { finalScore, resolve, reject },
            })
        );
    });
}