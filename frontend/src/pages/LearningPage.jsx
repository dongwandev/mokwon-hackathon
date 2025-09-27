import Container from "../components/Container"
import "./pages.css"

const LearningPage = () => {
  return (
    <Container>
      <h2>학습 페이지</h2>

      <div className="big-container">
        <p>학습 내용입니다.</p>
      </div>
      <div>
        <button>다음 페이지</button>
      </div>
    </Container>
  )
}

export default LearningPage
