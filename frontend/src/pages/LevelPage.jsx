// src/pages/LevelPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from "react-router-dom";

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

  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]); // 현재 레벨 문제 목록
  const [qIndex, setQIndex] = useState(0); // 현재 문제 인덱스


  // 초기 로드
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`${API_BASE}/api/questions`);
        if (!res.ok) throw new Error('문제 로드 실패');
        const data = await res.json();

        // 각 레벨 문제 셔플
        const nextBank = {
          beginner: shuffle(data.beginner || []),
          intermediate: shuffle(data.intermediate || []),
          advanced: shuffle(data.advanced || []),
        };
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

  const goToLevelResult = () => navigate("/levelresult");

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
      // 마지막 문제로 종료
      setAskedCount(10);
      setSelectedIdx(null);
      setWasCorrect(null);
      return;
    }

    // 상태 리셋(선택 초기화)
    setSelectedIdx(null);

    setQIndex((prev) => {
      const next = prev + 1;
      return next >= questions.length ? goToLevelResult() : next;
    });
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

      setAskedCount((c) => c + 1);
      return prevCounts;
    });
  };

  // 최종 레벨 계산: “정답 3개가 넘어간 단계”
  const finalLevel = useMemo(() => {
    if (correctCounts.advanced >= 3) return 'advanced';
    if (correctCounts.intermediate >= 3) return 'intermediate';
    if (correctCounts.beginner >= 3) return 'beginner';
    return 'beginner'; // 아무 것도 3 미만이면 기본값
  }, [correctCounts]);

  // 리스타트
  const onRestart = () => {
    // 전체를 새로 로드(간단)
    window.location.reload();
  };

  // 결과 화면
  if (!loading && !error && askedCount >= 10) {
    return (
      <main style={{ padding: 16, maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ marginTop: 0 }}>테스트 결과</h2>
        <div style={{ marginBottom: 12, fontSize: 16 }}>
          총 10문제 중 <b>{totalCorrect}</b>개 정답
        </div>
        <div style={{ marginBottom: 8 }}>레벨별 정답:</div>
        <ul>
          <li>초급: {correctCounts.beginner}</li>
          <li>중급: {correctCounts.intermediate}</li>
          <li>고급: {correctCounts.advanced}</li>
        </ul>
        <div style={{ marginTop: 12, fontSize: 18 }}>
          최종 레벨:{' '}
          <b>
            {finalLevel === 'beginner'
              ? '초급'
              : finalLevel === 'intermediate'
              ? '중급'
              : '고급'}
          </b>
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            onClick={onRestart}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #10b981',
              background: '#10b981',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            다시 시작
          </button>
        </div>
      </main>
    );
  }

  // 일반 화면
  if (loading) return <main style={{ padding: 16 }}>불러오는 중…</main>;
  if (error)
    return <main style={{ padding: 16, color: 'crimson' }}>에러: {error}</main>;
  if (!current) return <main style={{ padding: 16 }}>문제가 없습니다.</main>;

  return (
    <main style={{ padding: 16, maxWidth: 720, margin: '0 auto' }}>
      <header
        style={{
          marginBottom: 12,
          display: 'flex',
          gap: 12,
          alignItems: 'baseline',
          flexWrap: 'wrap',
        }}
      >
        <h2 style={{ margin: 0 }}>Q. 다음 중 정답은 무엇인가요?</h2>
        <small style={{ color: '#6b7280' }}>
          현재 레벨: <b>{level}</b> / 정답 B:{correctCounts.beginner} · I:
          {correctCounts.intermediate} · A:{correctCounts.advanced} / 진행{' '}
          {askedCount}/10
        </small>
      </header>

      <div style={{ marginBottom: 12, fontSize: 18 }}>
        문제: {current.sentence}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {options.map((opt, idxOpt) => {
          const number = idxOpt + 1;
          const chosen = selectedIdx === idxOpt;
          const bg =
            selectedIdx === null
              ? '#f3f4f6'
              : chosen
              ? opt.isCorrect
                ? '#d1fae5'
                : '#fee2e2'
              : '#f3f4f6';
          return (
            <div
              key={`${opt.text}-${idxOpt}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                borderRadius: 8,
                background: bg,
                border: '1px solid #e5e7eb',
              }}
            >
              <button
                onClick={() => onPick(idxOpt)}
                disabled={selectedIdx !== null}
                style={{
                  width: 48,
                  height: 36,
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  cursor: selectedIdx === null ? 'pointer' : 'default',
                }}
              >
                {number}번
              </button>
              <span style={{ fontSize: 16 }}>{opt.text}</span>
            </div>
          );
        })}
      </div>

      {selectedIdx !== null && (
        <div style={{ marginTop: 12, fontWeight: 600 }}>
          {wasCorrect ? '✅ 정답입니다!' : '❌ 오답입니다.'}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button
          onClick={onNext}
          disabled={selectedIdx === null}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #2563eb',
            background: selectedIdx === null ? '#93c5fd' : '#3b82f6',
            color: '#fff',
            cursor: selectedIdx === null ? 'not-allowed' : 'pointer',
          }}
        >
          {askedCount === 9 ? '결과 보기' : '다음 문제'}
        </button>
      </div>
    </main>
  );
}
