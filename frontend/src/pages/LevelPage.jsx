import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from "react-router-dom";

// .env 안 씀: 하드코딩
const API_BASE = 'http://localhost:4000';

// Fisher–Yates 셔플
function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function LevelPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState([]); // 현재 레벨 문제 목록
  const [qIndex, setQIndex] = useState(0); // 현재 문제 인덱스
  const [selectedIdx, setSelectedIdx] = useState(null);

  // 우선 beginner만 (원하면 URL 쿼리/상태로 교체)
  const level = 'beginner';

  // 1) 문제 로드: 서버가 전체/부분 둘 다 대응하도록 방어
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        setSelectedIdx(null);

        const res = await fetch(`${API_BASE}/api/questions?level=${level}`);
        if (!res.ok) throw new Error(`문제 로드 실패: ${res.status}`);

        const data = await res.json();
        // 서버가 { beginner:[...] } 형태로 내려줌
        // 혹은 실수로 전체 { beginner, intermediate, advanced }가 올 수도 있어 방어
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data[level])
          ? data[level]
          : Array.isArray(data?.beginner)
          ? data.beginner
          : [];

        if (list.length === 0) throw new Error('받은 문제가 비어 있습니다.');
        setQuestions(list);
        setQIndex(0);
      } catch (e) {
        console.error(e);
        setError(e.message || '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    })();
  }, [level]);

  // 2) 현재 문제
  const current = questions[qIndex];

  // 3) 보기 구성 + 셔플 (정답이 options에 실수로 포함되어도 중복 제거)
  const options = useMemo(() => {
    if (!current) return [];
    const base = new Set(current.options || []);
    base.delete(current.answer); // 혹시 포함돼 있으면 제거
    const merged = [...base, current.answer] // 정답 추가
      .slice(0, 4) // 4개로 제한(혹시 실수로 3개 이상 넣었을 때 대비)
      .map((t) => ({ text: t, isCorrect: t === current.answer }));
    return shuffle(merged);
  }, [current]);

  const isCorrect =
    selectedIdx !== null ? options[selectedIdx]?.isCorrect === true : null;

  const navigate = useNavigate();
  const goToLevelResult = () => navigate("/levelresult");
  
    const onNext = () => {
    setSelectedIdx(null);
    setQIndex((prev) => {
      const next = prev + 1;
      return next >= questions.length ? goToLevelResult() : next;
    });
  };

  if (loading) return <main style={{ padding: 16 }}>불러오는 중…</main>;
  if (error)
    return <main style={{ padding: 16, color: 'crimson' }}>에러: {error}</main>;
  if (!current) return <main style={{ padding: 16 }}>문제가 없습니다.</main>;

  return (
    <main style={{ padding: 16, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontWeight: 700 }}>Q. 다음 중 정답은 무엇인가요?</span>
      </div>

      <div style={{ marginBottom: 12, fontSize: 18 }}>
        문제: {current.sentence}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {options.map((opt, idx) => {
          const number = idx + 1;
          const chosen = selectedIdx === idx;
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
              key={`${opt.text}-${idx}`}
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
                onClick={() => setSelectedIdx(idx)}
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
          {isCorrect ? '✅ 정답입니다!' : '❌ 오답입니다.'}
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
          다음 문제
        </button>
      </div>

      <div style={{ marginTop: 12, color: '#6b7280', fontSize: 14 }}>
        {qIndex + 1} / {questions.length}
      </div>
    </main>
  );
}
