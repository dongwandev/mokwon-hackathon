import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Container from '../components/Container'

const ResultPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // location.state에서 total, correct 받기 (안 넘어왔으면 기본값 0 처리)
  const { total = 0, correct = 0 } = location.state || {}

  // 잘못된 접근 대비
  if (total === 0) {
    return (
      <Container>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>잘못된 접근입니다. 퀴즈를 먼저 풀어주세요.</p>
          <button onClick={() => navigate('/')} style={buttonStyle}>
            퀴즈 시작하기
          </button>
        </div>
      </Container>
    )
  }

  // 정답률 계산 (소수점 1자리)
  const percentage = ((correct / total) * 100).toFixed(1)

  return (
    <Container>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>퀴즈 결과</h2>
        <p>총 문제 수: <strong>{total}</strong></p>
        <p>맞춘 문제 수: <strong>{correct}</strong></p>
        <p>정답률: <strong>{percentage}%</strong></p>
        <button onClick={() => navigate('/')} style={buttonStyle}>
          다시 풀기
        </button>
      </div>
    </Container>
  )
}

// 공통 버튼 스타일
const buttonStyle = {
  marginTop: '1rem',
  padding: '0.6rem 1.2rem',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#00c7b1',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '1rem',
}

export default ResultPage
