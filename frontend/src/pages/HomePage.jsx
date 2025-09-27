import Container from "../components/Container";
import "./HomePage.css";

function HomePage() {
  return (
    <Container>
      <header className="home-header">
        <h1 className="home-title">홈 페이지</h1>
      </header>

      <section className="home-card">
        <p className="home-paragraph">여기에 홈 페이지 콘텐츠가 들어갑니다.</p>
      </section>
    </Container>
  );
}

export default HomePage;
