import React from "react";

const LABELS = ["홈", "학습", "분석", "업적"];

export default function MenuNoCss({ onChange }) {
  return (
    <nav aria-label="하단 메뉴">
      {/* block 요소(ul/li) 대신 인라인 성질의 요소만 배치 */}
      {LABELS.map((label, i) => (
        <React.Fragment key={label}>
          <button type="button" onClick={() => onChange?.(i)}>
            {label}
          </button>
          {/* 간단한 구분자/간격: 텍스트 노드만 사용 */}
          {i < LABELS.length - 1 ? <span> </span> : null}
        </React.Fragment>
      ))}
    </nav>
  );
}