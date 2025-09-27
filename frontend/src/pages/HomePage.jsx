import React, { useState, useEffect } from 'react';
import Container from "../components/Container";
import "./HomePage.css";

function HomePage() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [accuracy, setAccuracy] = useState(75);

  const [recommendation, setRecommendation] = useState({ message: '', nextLevel: currentLevel });

  // 공지사항 데이터 예시
  const announcements = [
    { id: 1, title: '업데이트 내용', date: '2025-09-28', content: '1.00패치' },
    { id: 2, title: '공지사항', date: '2025-09-28', content: '2025-09-28 앱 출시!' },
  ];

  useEffect(() => {
    const rec = getRecommendation(accuracy, currentLevel);
    setRecommendation(rec);
  }, [accuracy, currentLevel]);

  return (
    <Container>
      <header className="home-header">
        <h1 className="home-title">홈</h1>
      </header>

      <section className="home-card">
        <p className="home-paragraph" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>🎶학습목표 및 업데이트</p>

        {/* 학습추천과 업데이트 공지사항 박스를 감싸는 flex 컨테이너 */}
        <section className="home-flex-container">
  {/* 학습 추천 박스 */}
  <div>
    <h3>학습 추천</h3>
    <p style={{ fontWeight: 'bold', margin: 0 }}>{recommendation.message}</p>
  </div>

  {/* 업데이트 및 공지사항 박스 */}
  <div>
    <h3>업데이트 및 공지사항</h3>
    <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
      {announcements.map(({ id, title, date, content }) => (
        <li key={id} style={{ marginBottom: '1rem' }}>
          <strong>{title}</strong> <em>({date})</em>
          <p style={{ margin: '0.3rem 0 0 0' }}>{content}</p>
        </li>
      ))}
    </ul>
  </div>
</section>

      </section>
    </Container>
  );
}

function getRecommendation(accuracy, currentLevel) {
  if (accuracy >= 80) {
    return {
      message: '축하합니다! 다음 단계 문제를 도전해보세요.',
      nextLevel: currentLevel + 1,
    };
  } else if (accuracy >= 50) {
    return {
      message: '현재 단계 문제를 한 번 더 풀어보는 걸 추천합니다.',
      nextLevel: currentLevel,
    };
  } else {
    return {
      message: '기본 개념부터 다시 복습해보세요.',
      nextLevel: currentLevel - 1 > 0 ? currentLevel - 1 : 1,
    };
  }
}

export default HomePage;
