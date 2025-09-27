import { useNavigate } from 'react-router-dom'
import Container from '../components/Container';
import './LearningChoicePage.css'

const SelectPage = () => {
  const navigate = useNavigate()

  return (
    <Container>
      <div className="min-h-screen flex flex-col justify-center items-center gap-6 bg-gray-100">
        <h1 className="text-3xl font-bold">어떤걸로 선택하실건가요?</h1>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/LearningPage')}
            className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            학습
          </button>
          <button
            onClick={() => navigate('/ProblemPage')}
            className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600"
          >
            테스트
          </button>
        </div>
      </div>
    </Container>
    
  )
}

export default SelectPage
