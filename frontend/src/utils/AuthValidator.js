

export default class AuthValidator {
    // 상태에 따른 텍스트 컬러
    static STATUS_COLORS = {
        default: "text-gray-400",
        error: "text-red-500",
        success: "text-green-600"
    };

    // 정규표현식 상수를 클래스 내부에서 관리
    static MIN_PASSWORD_LENGTH = 8; // 비밀번호 최소길이
    static MAX_PASSWORD_LENGTH = 30; // 비밀번호 최대길이

    static MIN_USER_NAME_LENGTH = 2; // 유저네임 최소길이
    static MAX_USER_NAME_LENGTH = 10; // 유저네임 최대길이

    // 이메일 정규 표현식: 언더바(_), 하이픈(-), 점(.) 등을 아이디 부분에 허용
    static EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // 비밀번호 정규표현식: 영문, 숫자, 특수문자(@$!%*#?&)가 최소 하나씩 포함되어야 함
    static PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

    // 이메일 중복(백엔드 연동) 또는 형식 유효성 검사 선택해서
    static async vaildateEmail(user_email, checkAvailable = true) {
        
        if (!user_email)
            return { state: 'default', message: '' };
        
        // 이메일 형식 공통 검사
        if (!this.EMAIL_REGEX.test(user_email))
            return { state: 'error', message: '올바른 이메일 형식이 아닙니다.' };
        
        // 중복 체크X (로그인 페이지)
        if(!checkAvailable) {
            return { state: 'success', message: '' };
        }

        // 백엔드 이메일 중복 체크 (회원가입 페이지)
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/check-email/?user_email=${encodeURIComponent(user_email)}`);
            const data = await response.json();
            console.log("서버 응답 데이터:", data);
            return !data.is_available
                ? { state: 'error', message: '이미 사용 중인 이메일입니다.' }
                : { state: 'success', message: '사용 가능한 이메일입니다.' };
        } catch (e) {
            return { state: 'error', message: '서버 연결 확인 불가' };
        }
    }
    
    // 비밀번호 유효성 검사
    static validatePassword(password) {
        if (!password) 
            return { state: 'default', message: '' };

        // 비밀번호 길이 검사
        if (password.length < this.MIN_PASSWORD_LENGTH)
            return { state: 'error', message: `최소 ${this.MIN_PASSWORD_LENGTH}자 이상` };
        if (password.length > this.MAX_PASSWORD_LENGTH)
            return { state: 'error', message: `최대 ${this.MAX_PASSWORD_LENGTH}자 이하` };
        
        // 비밀번호 조합 체크
        if (!this.PASSWORD_REGEX.test(password))
            return { state: 'error', message: '영문, 숫자, 특수문자를 모두 포함해야 합니다.' };

        return { state: 'success', message: '안전한 비밀번호입니다.' };

        
    }

    // 비밀번호 확인 유효성 검사
    static validateConfirmPassword(password, confirmPassword) {
        if (!confirmPassword)
            return { state: 'default', message: '' };

        const isMatch = password === confirmPassword;
        return isMatch
            ? { state: 'success', message: '비밀번호가 일치합니다.' }
            : { state: 'error', message: '비밀번호가 일치하지 않습니다.'};
    }

    // 유저이름 중복(백엔드 연동) & 길이 유효성 검사
    static async validateUserName(user_name) {
        if (!user_name)
            return { state: 'default', message: ''};

        // 유저이름 길이 검사
        if (user_name.length < this.MIN_USER_NAME_LENGTH)
            return { state: 'error', message: `최소 ${this.MIN_USER_NAME_LENGTH}자 이상`};
        if (user_name.length > this.MAX_USER_NAME_LENGTH)
            return { state: 'error', message: `최대 ${this.MAX_USER_NAME_LENGTH}자 이하`};

        // 유저이름 중복 검사 (백엔드 연동) 아직 미구현 
        // try {
        //     const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/check-user_name/?user_name=${encodeURIComponent(user_name)}` );
        //     const data = await response.json();
        //     return !data.is_available
        //         ? { state: 'error', message: '이미 누군가 사용 중입니다.' }
        //         : { state: 'success', message: '사용 가능한 닉네임입니다.' };
        // } catch (e) {
        //     return { state: 'error', message:'서버 연결 확인 불가'};
        // }
        return { state: 'success', message: '사용 가능한 닉네임입니다.' };
    }

}
