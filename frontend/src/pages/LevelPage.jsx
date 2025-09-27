// src/pages/LevelPage.jsx
import { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom"; // (현재 페이지 내 네비게이션 사용 안 함)
import "./LevelPage.css";

const API_BASE = "http://localhost:4000"; // .env 미사용

// Fisher–Yates 셔플
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LEVELS = ["beginner", "intermediate", "advanced"];

export default function LevelPage() {
  // 로딩/에러
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 문제 뱅크
  const [bank, setBank] = useState({
    beginner: [],
    intermediate: [],
    advanced: [],
  });

  // 진행 상태
  const [level, setLevel] = useState("beginner");
  const [idx, setIdx] = useState({ beginner: 0, intermediate: 0, advanced: 0 });
  const [correctCounts, setCorrectCounts] = useState({
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  });
  const [askedCount, setAskedCount] = useState(0); // 총 출제 수(최대 10)
  const [totalCorrect, setTotalCorrect] = useState(0);

  // 현재 문제 선택 상태
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [wasCorrect, setWasCorrect] = useState(null);

  // const navigate = useNavigate();
  // (과거 로직에서 사용하던 questions/qIndex 제거)

  // 초기 로드
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/api/questions`);
        if (!res.ok) throw new Error("문제 로드 실패");
        const data = await res.json();

        // 각 레벨 문제 셔플
        const nextBank = {
          beginner: shuffle(data.beginner || []),
          intermediate: shuffle(data.intermediate || []),
          advanced: shuffle(data.advanced || []),
        };
        setBank(nextBank);

        // 상태 초기화
        setLevel("beginner");
        setIdx({ beginner: 0, intermediate: 0, advanced: 0 });
        setCorrectCounts({ beginner: 0, intermediate: 0, advanced: 0 });
        setAskedCount(0);
        setTotalCorrect(0);
        setSelectedIdx(null);
        setWasCorrect(null);
      } catch (e) {
        console.error(e);
        setError(e.message || "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 현재 문제
  const current = bank[level][idx[level]];

  // 보기(정답+오답) 셔플
  const options = useMemo(() => {
    if (!current) return [];
    const base = new Set(current.options || []);
    base.delete(current.answer); // 혹시 중복 대비
    const merged = [...base, current.answer]
      .slice(0, 4)
      .map((t) => ({ text: t, isCorrect: t === current.answer }));
    return shuffle(merged);
  }, [current]);

  // 보기 선택 시 처리
  const onPick = (optIdx) => {
    if (selectedIdx !== null) return; // 이미 선택했으면 무시
    const correct = options[optIdx]?.isCorrect === true;

    setSelectedIdx(optIdx);
    setWasCorrect(correct);

    if (correct) {
      setTotalCorrect((s) => s + 1);
      setCorrectCounts((prev) => ({ ...prev, [level]: prev[level] + 1 }));
    }
  };

  // 레벨 전환 규칙
  const decideNextLevel = (curLevel, counts) => {
    if (curLevel === "beginner" && counts.beginner >= 3) return "intermediate";
    if (curLevel === "intermediate" && counts.intermediate >= 3)
      return "advanced";
    return curLevel; // advanced는 유지
  };

  // 다음 문제로 이동
  const onNext = () => {
    if (selectedIdx === null) return;

    // 문제 10개 완료되었는지 먼저 체크
    if (askedCount + 1 >= 10) {
      // 마지막 문제로 종료
      setAskedCount(10);
      setSelectedIdx(null);
      setWasCorrect(null);
      return;
    }

    // 상태 리셋(선택 초기화)
    setSelectedIdx(null);
    setWasCorrect(null);

    // 이미 정답이면 correctCounts는 증가된 상태이므로 그 값을 기준으로 레벨 전환
    setCorrectCounts((prevCounts) => {
      const nextLevel = decideNextLevel(level, prevCounts);

      setLevel(nextLevel);
      setIdx((prevIdx) => {
        const cur = prevIdx[nextLevel] ?? 0;
        const next = cur + 1;
        const max = bank[nextLevel]?.length || 0;
        const nextVal = max > 0 ? (next >= max ? 0 : next) : 0; // 고갈 시 순환
        return { ...prevIdx, [nextLevel]: nextVal };
      });

      const newAskedCount = askedCount + 1;
      setAskedCount(newAskedCount);
      return prevCounts;
    });

    // (기존 qIndex/questions 기반 네비게이션 제거)
  };

  // 최종 레벨 계산: “정답 3개가 넘어간 단계”
  const finalLevel = useMemo(() => {
    if (correctCounts.advanced >= 3) return "advanced";
    if (correctCounts.intermediate >= 3) return "intermediate";
    if (correctCounts.beginner >= 3) return "beginner";
    return "beginner"; // 아무 것도 3 미만이면 기본값
  }, [correctCounts]);

  // 리스타트
  const onRestart = () => {
    // 전체를 새로 로드(간단)
    window.location.reload();
  };

  // 결과 화면
  if (!loading && !error && askedCount >= 10) {
    return (
      <main className="level-page">
        <h2 className="level-title">테스트 결과</h2>

        <div className="result-summary">
          총 10문제 중 <b>{totalCorrect}</b>개 정답
        </div>

        <div className="result-subtitle">레벨별 정답:</div>
        <ul className="result-list">
          <li>초급: {correctCounts.beginner}</li>
          <li>중급: {correctCounts.intermediate}</li>
          <li>고급: {correctCounts.advanced}</li>
        </ul>

        <div className="result-final">
          최종 레벨:{" "}
          <b>
            {finalLevel === "beginner"
              ? "초급"
              : finalLevel === "intermediate"
              ? "중급"
              : "고급"}
          </b>
        </div>

        <div className="actions">
          <button onClick={onRestart} className="btn btn-restart">
            다시 시작
          </button>
        </div>
      </main>
    );
  }

  // 일반 화면
  if (loading) return <main className="level-page">불러오는 중…</main>;
  if (error)
    return (
      <main className="level-page level-page--error">에러: {error}</main>
    );
  if (!current) return <main className="level-page">문제가 없습니다.</main>;

  return (
    <main className="level-page">
      <header className="level-header">
        <h2 className="level-title">Q. 다음 중 정답은 무엇인가요?</h2>
        <small className="level-meta">
          현재 레벨: <b>{level}</b> / 정답 B:{correctCounts.beginner} · I:
          {correctCounts.intermediate} · A:{correctCounts.advanced} / 진행{" "}
          {askedCount}/10
        </small>
      </header>

      <div className="level-question">문제: {current.sentence}</div>

      <div className="options">
        {options.map((opt, idxOpt) => {
          const number = idxOpt + 1;
          const chosen = selectedIdx === idxOpt;

          // 상태에 따른 클래스(배경색)
          let stateClass = "";
          if (selectedIdx !== null && chosen) {
            stateClass = opt.isCorrect ? "option--correct" : "option--incorrect";
          }

          return (
            <div key={`${opt.text}-${idxOpt}`} className={`option ${stateClass}`}>
              <button
                onClick={() => onPick(idxOpt)}
                disabled={selectedIdx !== null}
                className="option-btn"
              >
                {number}번
              </button>
              <span className="option-text">{opt.text}</span>
            </div>
          );
        })}
      </div>

      {selectedIdx !== null && (
        <div className="feedback">
          {wasCorrect ? "✅ 정답입니다!" : "❌ 오답입니다."}
        </div>
      )}

      <div className="actions">
        <button
          onClick={onNext}
          disabled={selectedIdx === null}
          className="btn btn-next"
        >
          {askedCount === 9 ? "결과 보기" : "다음 문제"}
        </button>
      </div>
    </main>
  );
}
