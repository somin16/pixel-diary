import React from "react";
import styles from './ImageButton.module.css'; // 버튼 전용 CSS 불러오기

/**
 * ImageButton (버튼 구조 컴포넌트)
 * 프로젝트 전체에서 공통으로 사용되는 버튼 뼈대 컴포넌트
 * @param {string} label - 버튼 위에 띄울 글씨 (예: "로그아웃", "확인")
 * @param {function} onClick - 버튼을 눌렀을 때 실행될 함수
 * @param {string} imageSrc - 배경으로 깔릴 픽셀 이미지 경로
 * @param {string} className - 바깥(부모)에서 추가로 넘겨주는 CSS 클래스 (예: 가로길이, 여백 등)
 */

const ImageButton = ({ label, onClick, imageSrc, className }) => {
  return (
    // 뼈대 스타일(buttonWrapper)과 외부 스타일(className)을 백틱(`)으로 합쳐서 적용
    <button 
    type="button" // onClick으로 전달한 함수만 실행
    className={`${styles.buttonWrapper} ${className}`} 
    onClick={onClick}>
      {/* 바닥에 깔리는 배경 이미지 */}
      <img 
        src={imageSrc} 
        alt={label} 
        className={styles.buttonImage} />
      {/* 이미지 위로 정중앙에 위치하는 텍스트 */}
      <span className={styles.buttonText}>{label}</span>
    </button>
  );
};

export default ImageButton;