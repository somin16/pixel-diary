// store/useCoinStore.js
import { create } from 'zustand';
import { authFetch } from '../utils/AuthHelper'; 

export const useGetCoinStore = create((set) => ({

    // 코인 갯수
    coin: 0,

    // 에러 출력용(차후에 프론트에서 토스트 메세지로 나오게 하는 등의 추가작업을 위해, 현재는 사용하지 않고 있습니다)
    error: null,

    // 코인 연산처리
    setMyCoins: (newAmount) => set({ coin : newAmount }),

    // 보유 코인 조회 API(더보기창(MorePage.jsx)에서 실행됩니다)
    startGetCoin: async () => {

        try {
            const result = await authFetch(

                `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/coins/`, {

                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            set({ coin: result.coin});
        } 
        
        // 에러 발생시
        catch (error) {

            // 에러 메세지 출력
            console.error("코인 조회 도중 에러 발생:" + error.message);

            // 차후에 프론트쪽에서 에러를 토스트로 나오게 할수도 있으니깐 error에 set
            set({ error: error.message});
        }
    }
}));