import { useNavigate } from 'react-router-dom'
import './LearningChoicePage.css'

const SelectPage = () => {
  const navigate = useNavigate()

  return (
    <div className="select-container">
      <h1 className="select-title">어떤걸로 선택하실건가요?</h1>
      <div className="select-button-box">
        <button
          onClick={() => navigate('/LearningPage')}
          className="select-button learn"
        >
          학습
        </button>
        <button
          onClick={() => navigate('/ProblemPage')}
          className="select-button test"
        >
          테스트
        </button>
      </div>
    </div>
  )
}

export default SelectPage
