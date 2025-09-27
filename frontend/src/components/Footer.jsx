import "./Footer.css";
import React from "react";
import { useNavigate, useLocation  } from "react-router-dom";

const LABELS = ["홈", "학습", "분석", "업적"];

const INDEX_TO_PATH = {
  0: "/home",
  1: "/learningchoice",
};

const PATH_TO_INDEX = {
  "/home": 0,
  "/learningchoice": 1,
};

export default function Footer({ onChange, activeIndex = 0 }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // 라우트가 홈/학습이면 그 인덱스를 우선 사용, 아니면 기존 activeIndex 사용
  const routeActiveIndex =
    PATH_TO_INDEX[pathname] ??
    // 경로 변형 대비(트레일링 슬래시나 쿼리 등) - startsWith로 유연 처리
    (pathname.startsWith("/home") ? 0 :
     pathname.startsWith("/learningchoice") ? 1 :
     null);

  const effectiveActiveIndex =
    routeActiveIndex !== null && routeActiveIndex !== undefined
      ? routeActiveIndex
      : activeIndex;

  return (
    <footer className="home-bottomnav">
      <nav aria-label="하단 메뉴" className="menu-nav">
        <ul className="menu">
          {LABELS.map((label, i) => (
            <li className="menu-item" key={label}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onChange?.(i);
                  if (i in INDEX_TO_PATH) {
                    navigate(INDEX_TO_PATH[i]);
                  }
                }}
                className={i === effectiveActiveIndex ? "is-active" : undefined}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
