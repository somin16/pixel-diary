import { authFetch } from '../utils/AuthHelper';

// 티켓 조회 API 연동
// async function: 비동기 함수 (게임에 방해되지않도록 백그라운드에서 실행됩니다)
export async function getGameTicket() {

    try {

        // API 호출
        // 값을 갯수를 보여줘야하니 result 값에 넣는식으로 작성
        const result = await authFetch(

            // 티켓 조회
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/inventory/tickets/`, {

                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }
        );

        // 콘솔에서 통신 성공 여부와 남은 티켓 수를 확인합니다
        console.log("티켓 조회 성공, 현재 티켓 수: ", result.count);

        // 현재 갯수를 return해준다
        return result.count;

    } 
    
    // 에러가 발생했을 경우(콘솔 확인용)
    catch (error) {
        
        console.error("티켓 조회 실패, 에러코드: ", error.message);

        // 에러방지용으로 0을 return
        return 0;
    }
};

// 티켓 사용 API 연동
// async function: 비동기 함수 (게임에 방해되지않도록 백그라운드에서 실행됩니다)
export async function useGameTicket() {

    try {

        // API 호출
        await authFetch(

            // 티켓 사용
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/inventory/tickets/`, {

                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            }
        );

        // 성공시 확인용 메세지
        console.log("티켓 사용 성공");
    } 
    
    // 에러가 발생했을 경우(콘솔 확인용)
    catch (error) {
        
        console.error("티켓 사용 실패, 에러코드: ", error.message);
    }
};