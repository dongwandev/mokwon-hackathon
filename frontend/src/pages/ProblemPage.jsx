import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Container from "../components/Container";
import "./ProblemPage.css";
import axios from "axios";

const API_BASE = "http://localhost:4000"; // .env 미사용

const QuizWithExplanation = () => {
  const navigate = useNavigate();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [shuffledQuizs, setShuffledQuizs] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [options, setOptions] = useState([]);

  useEffect(() => {
    setSelectedIndex(null);
    setShowExplanation(false);
  }, [currentIdx, shuffledQuizs]);

  const handleShowExplanation = () => {
    if (selectedIndex === null) {
      alert("답변을 선택해주세요.");
      return;
    }
    if (selectedAnswer === correctAnswer) setCorrectCount((prev) => prev + 1);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIdx < shuffledQuizs.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      navigate("/ProblemPageResult", {
        state: { total: shuffledQuizs.length, correct: correctCount },
      });
    }
  };

  const getOptions = useCallback((quiz) => {
    const options = [quiz.options, quiz.answer].flat();
    const shuffledOptions = options.sort(() => Math.random() - 0.5);
    return shuffledOptions;
  }, []);

  // 테스트 문항 조회
  const fetchQuestions = useCallback(async () => {
    const res = await axios.get(`${API_BASE}/api/questions`, {
      params: { nocache: 1 },
    });

    const beginner = Array.isArray(res.data?.beginner) ? res.data.beginner : [];
    const intermediate = Array.isArray(res.data?.intermediate)
      ? res.data.intermediate
      : [];
    const advanced = Array.isArray(res.data?.advanced) ? res.data.advanced : [];
    const answers = [beginner, intermediate, advanced].flat();

    const shuffledAnswers = answers.sort(() => Math.random() - 0.5);
    const slicedAnswers = shuffledAnswers.slice(0, 10);
    setShuffledQuizs(slicedAnswers);
    setCurrentQuestion(slicedAnswers[currentIdx]);

    const newOptions = getOptions(slicedAnswers[currentIdx]);
    setOptions(newOptions);
    setCorrectAnswer(
      newOptions.find((opt) => opt === slicedAnswers[currentIdx].answer)
    );
  }, [currentIdx, getOptions]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // 선택지 선택
  const handleRadioChange = useCallback(
    (e) => {
      const idx = parseInt(e.target.id.split("-").pop(), 10);
      setSelectedIndex(idx);
      setSelectedAnswer(options[idx]);
    },
    [options]
  );

  // 문항 불러오는 중
  if (!shuffledQuizs[currentIdx]) {
    return (
      <Container>
        <p>문항을 불러오는 중입니다...</p>
      </Container>
    );
  }

  // 불러온 문항 렌더링
  return (
    <Container>
      <header className="quiz-header">
        <h2 className="quiz-title">
          문제 {currentIdx + 1} / {shuffledQuizs.length}
        </h2>
      </header>

      {!showExplanation ? (
        <>
          <h3 className="quiz-question">
            {shuffledQuizs[currentIdx].sentence.split("B:")[0].trim()}
          </h3>

          <ul className="options">
            {options.map((option, idx) => {
              const id = `opt-${currentIdx}-${idx}`;
              return (
                <li key={id} className="option-wrap">
                  <input
                    id={id}
                    className="option-radio"
                    type="radio"
                    name="quiz-option"
                    checked={selectedIndex === idx}
                    onChange={handleRadioChange}
                  />
                  <label htmlFor={id} className="option--label">
                    <span className="option-number radio">{idx + 1}</span>
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
            당신의 답: {selectedAnswer}{" "}
            {selectedAnswer === correctAnswer ? "✅" : "❌"}
            <br />
            정답: {correctAnswer}
          </div>
          {currentQuestion.explanation && (
            <p className="explain-text">{currentQuestion.explanation}</p>
          )}

          <div className="actions">
            <button className="btn btn-next" onClick={handleNext}>
              {currentIdx < shuffledQuizs.length - 1
                ? "다음 문제"
                : "정답률 보기"}
            </button>
          </div>
        </>
      )}
    </Container>
  );
};

export default QuizWithExplanation;
