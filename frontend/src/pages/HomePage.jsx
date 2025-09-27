import "./HomePage.css";
import Menu from "../components/Menu";

function HomePage() {
  return (
    <main className="home-page">
      {/* ▶ 페이지 내부를 감싸는 단일 컨테이너 */}
      <div className="home-shell">
        <header className="home-header">
          <h1 className="home-title">홈 페이지</h1>
        </header>

        <section className="home-card">
          <p className="home-paragraph">여기에 홈 페이지 콘텐츠가 들어갑니다.</p>
        </section>

        {/* 메뉴는 수정 X, 래퍼만 유지 */}
        <footer className="home-bottomnav">
          <Menu />
        </footer>
      </div>
    </main>
  );
}

export default HomePage;
