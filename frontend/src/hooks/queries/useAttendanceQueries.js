import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from '../../utils/queryKeys';
import { attendanceApi } from "../../api/attendanceApi";

// 출석 기록 조회 훅
export const useAttendance = () => {
  return useQuery({
    queryKey: queryKeys.attendance,
    queryFn: attendanceApi.getAttendance,
  });
};

// 출석 체크 실행 훅
export const useCheckAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: attendanceApi.checkAttendance,
    onSuccess: () => {
      // 출석 성공 시 queryKeys.attendance 캐시 폐기 및 재조회
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance });
      // 통계(총 출석일, 연속 출석일)도 낡음 처리 → /stats 진입 시 최신 값으로 갱신
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics });
    },
  });
};

// 접속 시 만료된 출석 기록을 실제로 초기화하는 훅 (AttendanceResetView 호출)
export const useResetAttendanceIfExpired = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.resetIfExpired,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance }); // 리셋됐으면 캐시도 최신화
    },
  });
};