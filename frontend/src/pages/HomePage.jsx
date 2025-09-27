import Menu from "../components/Menu";

function HomePage() {
  return (
    <div className="min-h-screen pb-16">
      <h1 className="p-4 text-2xl font-bold">홈 페이지</h1>
      <p className="p-4">여기에 홈 페이지 콘텐츠가 들어갑니다.</p>
      <Menu />
    </div>
  );
}

export default HomePage;