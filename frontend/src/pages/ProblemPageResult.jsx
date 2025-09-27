import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const ResultPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { total, correct } = location.state || {}

  if (total === undefined || correct === undefined) {
    return <p>잘못된 접근입니다.</p>
  }

  const percent = ((correct / total) * 100).toFixed(1)

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>퀴즈 결과</h2>
      <p>총 문제 수: {total}</p>
      <p>맞춘 문제 수: {correct}</p>
      <p>정답률: {percent}%</p>
      <button onClick={() => navigate('/')} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
        다시 풀기
      </button>
    </div>
  )
}

export default ResultPage
