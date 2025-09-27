import "./Container.css";

function Container({ children }) {
  return (
    <main className="home-page">
      {/* ▶ 페이지 내부를 감싸는 단일 컨테이너 */}
      <div className="home-shell">
        {children}
      </div>
    </main>
  );
}

export default Container;
