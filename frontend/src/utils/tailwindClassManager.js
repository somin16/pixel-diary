import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 여러 개의 Tailwind 클래스를 합치고, 중복되거나 충돌하는 클래스를 정리해주는 함수
 * @param {...string} classNames - 합칠 클래스명들
 * @returns {string} - 최적화된 최종 클래스 문자열
 */
export function combineTailwindClasses(...classNames) {
  return twMerge(clsx(classNames));
}