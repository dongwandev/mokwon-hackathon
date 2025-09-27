import React from "react";
import Container from "../components/Container";
import "./AchievementPage.css";
import trophyIcon from "./Thophy.svg";

// 예시 데이터
const ACHIEVEMENTS = [
  { id: 1, name: "튜토리얼 클리어", progress: 100 },
  { id: 2, name: "첫 학습", progress: 100 },
  { id: 3, name: "5일 연속 접속", progress: 60 },
  { id: 4, name: "누적 30일 출석", progress: 38 },
  { id: 5, name: "한국어 마스터", progress: 11 },
];

function clamp(n, min = 0, max = 100) {
  return Math.min(Math.max(n, min), max);
}

function AchievementCard({ name, progress }) {
  const pct = clamp(progress);
  const isDone = pct === 100; // 100% 달성 시 금색

  return (
    <article className="achv-card" data-state={isDone ? "done" : "undone"}>
      <div className="achv-card-top">
        <div className="achv-trophy-wrap">
          <img src={trophyIcon} className="achv-trophy" aria-hidden="true" alt="" />
        </div>
        <div className="achv-meta">
          <h3 className="achv-name" title={name}>{name}</h3>
          <p className="achv-sub">
            달성도 <span className="achv-percent">{pct}%</span>
          </p>
        </div>
      </div>

      <div className="achv-card-bottom">
        {/* 진행률은 퍼센트 문자열로 전달 → CSS에서 var(--pct)로 바로 사용 */}
        <div
          className="achv-progress"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ "--pct": `${pct}%` }}
        />
        <div className="achv-percent-label">{pct}%</div>
      </div>
    </article>
  );
}

export default function AchievementPage({ data = ACHIEVEMENTS }) {
  return (
    <Container>
      <div className="achv-page" data-mobile>
        <header className="achv-header">
          <h2 className="achv-title">업적</h2>
          <p className="achv-subtitle">학습 목표를 달성하고 트로피를 획득해보세요!</p>
        </header>

        <section className="achv-list" role="list">
          {data.map(({ id, name, progress }) => (
            <AchievementCard key={id ?? name} name={name} progress={progress} />
          ))}
        </section>
      </div>
    </Container>
  );
}
