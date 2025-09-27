import "./Footer.css";
import React from "react";

const LABELS = ["홈", "학습", "분석", "업적"];

export default function Footer({ onChange, activeIndex = 0 }) {
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
                }}
                className={i === activeIndex ? "is-active" : undefined}
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
