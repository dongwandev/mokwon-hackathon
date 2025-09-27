import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '../components/Container';
import './ProblemPage.css';

const questions = [
  { question: '123', options: ['1', '2', '3', '4'], correctIndex: 1, explanation: '정답은 2번' },
  { question: '234', options: ['1', '2', '3', '4'], correctIndex: 0, explanation: '' },
  { question: '234', options: ['1', '2', '3', '4'], correctIndex: 0, explanation: '' },
  { question: '234', options: ['1', '2', '3', '4'], correctIndex: 0, explanation: '' },
  { question: '234', options: ['1', '2', '3', '4'], correctIndex: 0, explanation: '' },
  { question: '234', options: ['1', '2', '3', '4'], correctIndex: 0, explanation: '' },
  { question: '234', options: ['1', '2', '3', '4'], correctIndex: 0, explanation: '' },
  { question: '234', options: ['1', '2', '3', '4'], correctIndex: 0, explanation: '' },
  { question: '234', options: ['1', '2', '3', '4'], correctIndex: 0, explanation: '' },
  { question: '234', options: ['1', '2', '3', '4'], correctIndex: 0, explanation: '' },
];

const QuizWithExplanation = () => {
  const navigate = useNavigate();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    setShuffledOptions(questions[currentIdx].options);
    setSelectedIndex(null);
    setShowExplanation(false);
  }, [currentIdx]);

  const currentQuestion = questions[currentIdx];
  const correctAnswer = currentQuestion.options[currentQuestion.correctIndex];
  const selectedAnswer =
    selectedIndex !== null ? shuffledOptions[selectedIndex] : null;
  const isCorrect = selectedAnswer === correctAnswer;

  const handleShowExplanation = () => {
    if (selectedIndex === null) {
      alert('답변을 선택해주세요.');
      return;
    }
    if (isCorrect) setCorrectCount(prev => prev + 1);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      navigate('/ProblemPageResult', {
        state: { total: questions.length, correct: correctCount },
      });
    }
  };

  return (
    <Container>
      <header className="quiz-header">
        <h2 className="quiz-title">
          문제 {currentIdx + 1} / {questions.length}
        </h2>
      </header>

      {!showExplanation ? (
        <>
          <h3 className="quiz-question">{currentQuestion.question}</h3>

          <ul className="options">
            {shuffledOptions.map((option, idx) => {
              const id = `opt-${currentIdx}-${idx}`;
              return (
                <li key={id} className="option-wrap">
                  <input
                    id={id}
                    className="option-radio"
                    type="radio"
                    name="quiz-option"
                    checked={selectedIndex === idx}
                    onChange={() => setSelectedIndex(idx)}
                  />
                  <label htmlFor={id} className="option--label">
                    <span className="option-number">{idx + 1}</span>
                    <span className="option-text">{option}</span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="actions">
            <button
              className="btn btn-next"
              onClick={handleShowExplanation}
              // ⬇️ 선택 전엔 비활성화(시각적 피드백과 통일)
              disabled={selectedIndex === null}
            >
              해설 보기
            </button>
          </div>
        </>
      ) : (
        <>
          <h3 className="explain-title">해설</h3>
          <div className="feedback">
            당신의 답: {selectedAnswer} {isCorrect ? '✅' : '❌'}
            <br />
            정답: {correctAnswer}
          </div>
          {currentQuestion.explanation && (
            <p className="explain-text">{currentQuestion.explanation}</p>
          )}

          <div className="actions">
            <button className="btn btn-next" onClick={handleNext}>
              {currentIdx < questions.length - 1 ? '다음 문제' : '정답률 보기'}
            </button>
          </div>
        </>
      )}
    </Container>
  );
};

export default QuizWithExplanation;
