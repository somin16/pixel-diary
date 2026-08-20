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
    },
  });
};