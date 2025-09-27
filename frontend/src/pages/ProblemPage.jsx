import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const questions = [
  // 위 문제들 동일하게 복사
  {
    question: '123',
    options: ['1', '2', '3', '4'],
    correctIndex: 1,
    explanation: '정답은 2번',
  },
  {
    question: '234',
    options: ['1', '2', '3', '4'],
    correctIndex: 0,
    explanation: '',
  },
  {
    question: '234',
    options: ['1', '2', '3', '4'],
    correctIndex: 0,
    explanation: '',
  },
  {
    question: '234',
    options: ['1', '2', '3', '4'],
    correctIndex: 0,
    explanation: '',
  },
  {
    question: '234',
    options: ['1', '2', '3', '4'],
    correctIndex: 0,
    explanation: '',
  },
  {
    question: '234',
    options: ['1', '2', '3', '4'],
    correctIndex: 0,
    explanation: '',
  },
  {
    question: '234',
    options: ['1', '2', '3', '4'],
    correctIndex: 0,
    explanation: '',
  },
  {
    question: '234',
    options: ['1', '2', '3', '4'],
    correctIndex: 0,
    explanation: '',
  },
  {
    question: '234',
    options: ['1', '2', '3', '4'],
    correctIndex: 0,
    explanation: '',
  },
  {
    question: '234',
    options: ['1', '2', '3', '4'],
    correctIndex: 0,
    explanation: '',
  },
  // ... 더 문제 추가
]

function shuffleArray(array) {
  const arr = array.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const QuizWithExplanation = () => {
  const navigate = useNavigate()

  const [currentIdx, setCurrentIdx] = useState(0)
  const [showExplanation, setShowExplanation] = useState(false)
  const [shuffledOptions, setShuffledOptions] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)

  useEffect(() => {
    setShuffledOptions(shuffleArray(questions[currentIdx].options))
    setSelectedIndex(null)
    setShowExplanation(false)
  }, [currentIdx])

  const currentQuestion = questions[currentIdx]
  const correctAnswer = currentQuestion.options[currentQuestion.correctIndex]
  const selectedAnswer = selectedIndex !== null ? shuffledOptions[selectedIndex] : null
  const isCorrect = selectedAnswer === correctAnswer

  const handleShowExplanation = () => {
    if (selectedIndex === null) {
      alert('답변을 선택해주세요.')
      return
    }
    if (isCorrect) {
      setCorrectCount(prev => prev + 1)
    }
    setShowExplanation(true)
  }

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1)
    } else {
      // 정답률 페이지로 이동
      navigate('/ProblemPageResult', { state: { total: questions.length, correct: correctCount } })
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>문제 {currentIdx + 1} / {questions.length}</h2>

      {!showExplanation ? (
        <>
          <h3>{currentQuestion.question}</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {shuffledOptions.map((option, idx) => (
              <li key={idx} style={{ margin: '0.5rem 0' }}>
                <label style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="quiz-option"
                    checked={selectedIndex === idx}
                    onChange={() => setSelectedIndex(idx)}
                  />
                  {' '}
                  {option}
                </label>
              </li>
            ))}
          </ul>
          <button onClick={handleShowExplanation} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
            해설 보기
          </button>
        </>
      ) : (
        <>
          <h3>해설</h3>
          <p>당신의 답: {selectedAnswer} {isCorrect ? '✅' : '❌'}</p>
          <p>정답: {correctAnswer}</p>
          <p>{currentQuestion.explanation}</p>
          <button onClick={handleNext} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
            {currentIdx < questions.length - 1 ? '다음 문제' : '정답률 보기'}
          </button>
        </>
      )}
    </div>
  )
}

export default QuizWithExplanation
