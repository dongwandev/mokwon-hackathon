import { useNavigate } from "react-router-dom";

function LevelResultPage() {
    let level = "중급";  let correct = 7;  let total = 10;
  const percent = Math.round((correct / total) * 100);

  const navigate = useNavigate();
  const goToHome = () => navigate("/home");

  return (
    <div>
      <h2>레벨 결과 페이지</h2>

      <div>
        <strong>레벨</strong>: <span>{level}</span>
      </div>

      <div>
        <strong>정답률</strong>: <span>{correct}/{total} ({percent}%)</span>
      </div>
      <div>
        <button onClick={goToHome}>홈으로</button>
      </div>
    </div>
  );
}
export default LevelResultPage;