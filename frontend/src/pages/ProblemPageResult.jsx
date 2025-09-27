import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Container from '../components/Container'
import "./ProblemPageResult.css"

const ResultPage = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const { total = 0, correct = 0 } = location.state || {}
  const percentage = ((correct / total) * 100).toFixed(1)

  return (
    <Container>
      <div className="result-wrapper">
        <section className="result-section">
          <p className="result-heading">📘 퀴즈 결과 확인</p>

          <div className="result-card">
            <h2 className="result-title">퀴즈 결과</h2>
            <div className="result-content">
              <div className="result-item">
                <span className="label">총 문제 수</span>
                <span className="value">{total}</span>
              </div>
              <div className="result-item">
                <span className="label">맞춘 문제 수</span>
                <span className="value">{correct}</span>
              </div>
              <div className="result-item">
                <span className="label">정답률</span>
                <span className="value">{percentage}%</span>
              </div>
            </div>
            <button className="retry-button" onClick={() => navigate('/')}>
              다시 풀기
            </button>
          </div>
        </section>
      </div>
    </Container>
  )
}

export default ResultPage
