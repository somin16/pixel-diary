import { useState, useEffect } from 'react';
// 유효성 검사를 매순간마다 하고 있기때문에 서버 과부화를 막기위해 일부러 딜레이를 부여해 서버 요청 횟수를 조절함
export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler); // 다음 입력이 들어오면 이전 타이머를 취소!
  }, [value, delay]);

  return debouncedValue;
}