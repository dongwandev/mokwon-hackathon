import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LevelPage.css';
import Container from '../components/Container';

const API_BASE = 'http://localhost:4000'; // .env 미사용

// Fisher–Yates 셔플
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LEVELS = ['beginner', 'intermediate', 'advanced'];

export default function LevelPage() {
  const navigate = useNavigate();

  // 로딩/에러
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 문제 뱅크
  const [bank, setBank] = useState({
    beginner: [],
    intermediate: [],
    advanced: [],
  });

  // 진행 상태
  const [level, setLevel] = useState('beginner');
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

  // 초기 로드: 1) 문제 생성(덮어쓰기) → 2) 최신 questions.json 조회
  useEffect(() => {
    console.log('초기 문제 생성 및 로드 시도');
    (async () => {
      try {
        setLoading(true);
        setError('');

        // 1) OpenAI 기반 문제 생성(API: replace=true, perLevel=10)
        try {
          await axios.post(`${API_BASE}/api/generate-questions/prompt`, {
            replace: true,
            perLevel: 10,
          });
        } catch (genErr) {
          console.warn('문제 생성 실패, 기존 데이터로 진행 시도:', genErr);
        }

        // 2) 최신 questions.json 조회 (nocache=1로 강제 무효화)
        const res = await axios.get(`${API_BASE}/api/questions`, {
          params: { nocache: 1 },
        });
        const data = res.data;

        // 각 레벨 문제 셔플
        const nextBank = {
          beginner: shuffle(data.beginner || []),
          intermediate: shuffle(data.intermediate || []),
          advanced: shuffle(data.advanced || []),
        };
        // 비어있으면 에러
        if (
          nextBank.beginner.length === 0 &&
          nextBank.intermediate.length === 0 &&
          nextBank.advanced.length === 0
        ) {
          throw new Error(
            '문제 데이터가 비어 있습니다. 관리자에게 문의하세요.'
          );
        }

        setBank(nextBank);

        // 상태 초기화
        setLevel('beginner');
        setIdx({ beginner: 0, intermediate: 0, advanced: 0 });
        setCorrectCounts({ beginner: 0, intermediate: 0, advanced: 0 });
        setAskedCount(0);
        setTotalCorrect(0);
        setSelectedIdx(null);
        setWasCorrect(null);
      } catch (e) {
        console.error(e);
        setError(e.message || '알 수 없는 오류');
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
    if (curLevel === 'beginner' && counts.beginner >= 3) return 'intermediate';
    if (curLevel === 'intermediate' && counts.intermediate >= 3)
      return 'advanced';
    return curLevel; // advanced는 유지
  };

  // 다음 문제로 이동
  const onNext = () => {
    if (selectedIdx === null) return;

    // 문제 10개 완료되었는지 먼저 체크
    if (askedCount + 1 >= 10) {
      setAskedCount(10);
      setSelectedIdx(null);
      setWasCorrect(null);
      return;
    }

    // 상태 리셋(선택 초기화)
    setSelectedIdx(null);
    setWasCorrect(null);

    // 정답 카운트는 이미 반영됨 → 그 값을 기준으로 레벨 전환
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

      setAskedCount((c) => c + 1);
      return prevCounts;
    });
  };

  // 최종 레벨 계산
  const finalLevel = useMemo(() => {
    if (correctCounts.advanced >= 3) return 'advanced';
    if (correctCounts.intermediate >= 3) return 'intermediate';
    if (correctCounts.beginner >= 3) return 'beginner';
    return 'beginner';
  }, [correctCounts]);

  // 홈으로 이동
  const goHome = () => navigate('/home');

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
          최종 레벨:{' '}
          <b>
            {finalLevel === 'beginner'
              ? '초급'
              : finalLevel === 'intermediate'
              ? '중급'
              : '고급'}
          </b>
        </div>

        <div className="actions">
          <button onClick={goHome} className="btn btn-restart">
            홈으로
          </button>
        </div>
      </main>
    );
  }

  // 일반 화면
  if (loading)
    return <main className="level-page">문제 생성 중… 잠시만요 ⏳</main>;
  if (error)
    return <main className="level-page level-page--error">에러: {error}</main>;
  if (!current) return <main className="level-page">문제가 없습니다.</main>;

  return (
    <Container>
      <header className="level-header">
        <h2 className="level-title">Q. 다음 중 정답은 무엇인가요?</h2>
        <small className="level-meta">
          현재 레벨: <b>{level}</b> / 정답 B:{correctCounts.beginner} · I:
          {correctCounts.intermediate} · A:{correctCounts.advanced} / 진행{' '}
          {askedCount}/10
        </small>
      </header>

      <div className="level-question">문제: {current.sentence}</div>

      {/* 라디오 패턴 */}
      <div className="options" role="radiogroup" aria-label="정답 선택">
        {options.map((opt, idxOpt) => {
          const number = idxOpt + 1;
          const id = `opt-${idxOpt}`;

          // 선택 후: 정답은 초록, 선택한 오답만 빨강
          let stateClass = '';
          if (selectedIdx !== null) {
            if (opt.isCorrect) stateClass = 'option--correct';
            if (selectedIdx === idxOpt && !opt.isCorrect)
              stateClass = 'option--incorrect';
          }

          return (
            <div key={id} className={`option-wrap ${stateClass}`}>
              <input
                id={id}
                name="question"
                type="radio"
                className="option-radio"
                checked={selectedIdx === idxOpt}
                disabled={selectedIdx !== null}
                onChange={() => selectedIdx === null && onPick(idxOpt)}
              />
              <label htmlFor={id} className="option option--label">
                <span className="option-number">{number}번</span>
                <span className="option-text">{opt.text}</span>
              </label>
            </div>
          );
        })}
      </div>

      {selectedIdx !== null && (
        <div className="feedback" aria-live="polite">
          {wasCorrect ? '✅ 정답입니다!' : '❌ 오답입니다.'}
        </div>
      )}

      <div className="actions">
        <button
          onClick={onNext}
          disabled={selectedIdx === null}
          className="btn btn-next"
        >
          {askedCount === 9 ? '결과 보기' : '다음 문제'}
        </button>
      </div>
    </Container>
  );
}
