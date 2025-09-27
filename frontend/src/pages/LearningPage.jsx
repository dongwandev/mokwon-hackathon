// src/pages/LearningPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Container from "../components/Container";
import "./pages.css";

const API_BASE = "http://localhost:4000";

// 간단 셔플
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// sentence 2줄 + answer 한 줄로 보여주기 위한 안전한 분리
function splitDialogue(sentence) {
  if (!sentence || typeof sentence !== "string") return ["", ""];
  const s = sentence.trim();
  // 1) 우선 줄바꿈 기준
  const byNl = s
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (byNl.length >= 2) return [byNl[0], byNl[1]];

  // 2) 슬래시 구분
  if (/\s\/\s/.test(s)) {
    const parts = s
      .split(/\s\/\s/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (parts.length >= 2) return [parts[0], parts[1]];
  }

  // 3) 문장부호 기준
  const parts = s.split(/(?<=[\.!?…])\s+/).filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts[1]];

  // 4) 마지막 안전장치(반쯤 나눔)
  const mid = Math.floor(s.length / 2);
  return [s.slice(0, mid).trim(), s.slice(mid).trim()];
}

export default function LearningPage() {
  const navigate = useNavigate();

  // 로딩/에러
  const [loading, setLoading] = useState(true); // 생성+조회 전체 로딩
  const [loadingStep, setLoadingStep] = useState("생성 중…"); // 단계 표시
  const [error, setError] = useState("");

  // 학습 데이터 (최대 10개)
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0); // 0..9
  const [done, setDone] = useState(false);

  // 초기: 1) 생성(덮어쓰기) → 2) 조회 → 3) 10개 구성
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        // 1) 생성 호출 (덮어쓰기)
        setLoadingStep("문항 생성 중…");
        await axios.post(`${API_BASE}/api/generate-questions/dialog`, {
          perLevel: 10,
          replace: true,
        });

        // 2) 조회 (nocache=1)
        setLoadingStep("문항 불러오는 중…");
        const res = await axios.get(`${API_BASE}/api/questions`, {
          params: { nocache: 1 },
        });

        const beginner = Array.isArray(res.data?.beginner)
          ? res.data.beginner
          : [];
        const intermediate = Array.isArray(res.data?.intermediate)
          ? res.data.intermediate
          : [];
        const advanced = Array.isArray(res.data?.advanced)
          ? res.data.advanced
          : [];

        // 3) 10개 선택(초4·중3·고3 기본, 부족하면 남는 풀에서 채움)
        const pick = (arr, n) => arr.slice(0, Math.min(arr.length, n));
        const sb = shuffle(beginner);
        const si = shuffle(intermediate);
        const sa = shuffle(advanced);

        let picked = [...pick(sb, 4), ...pick(si, 3), ...pick(sa, 3)];
        if (picked.length < 10) {
          const pool = shuffle([
            ...sb.slice(4),
            ...si.slice(3),
            ...sa.slice(3),
          ]);
          while (picked.length < 10 && pool.length) picked.push(pool.shift());
        }
        picked = picked.slice(0, 10);

        if (picked.length === 0) {
          throw new Error("학습에 사용할 문장이 없습니다.");
        }

        setItems(picked);
        setIndex(0);
        setDone(false);
      } catch (e) {
        console.error(e);
        setError(e.response?.data?.error || e.message || "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const current = items[index];

  const view = useMemo(() => {
    if (!current) return null;
    const [line1, line2] = splitDialogue(current.sentence);
    return {
      line1,
      line2,
      answer: current.answer || "",
    };
  }, [current]);

  const onNext = () => {
    // 마지막(10번째) 이후 완료
    if (index + 1 >= 10) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
  };

  // 렌더
  if (loading) {
    return (
      <Container>
        <h2>학습 페이지</h2>
        <div className="big-container">
          <h1>
            {loadingStep}
            <br />
            잠시만 기다려주세요 ⏳
          </h1>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <h2>학습 페이지</h2>
        <div className="big-container">
          <p style={{ color: "crimson", fontWeight: 700 }}>에러: {error}</p>
          <p style={{ marginTop: 8 }}>
            관리자에게 문의하거나 새로 고침 후 다시 시도해 주세요.
          </p>
        </div>
      </Container>
    );
  }

  if (done) {
    return (
      <Container>
        <h2>학습 페이지</h2>
        <div className="big-container">
          <p style={{ fontSize: 20, fontWeight: 900, marginBottom: 18 }}>
            학습을 완료하였습니다.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                // 학습 페이지로 돌아가기(초기화)
                setIndex(0);
                setDone(false);
              }}
            >
              돌아가기
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/home")}
            >
              홈으로
            </button>
          </div>
        </div>
      </Container>
    );
  }

  if (!current || !view) {
    return (
      <Container>
        <h2>학습 페이지</h2>
        <div className="big-container">
          <p>학습할 문장을 찾을 수 없습니다.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <h2>학습 페이지</h2>

      <div className="big-container">
        {/* 문장1, 문장2, 답 — 각 줄 bold */}
        <p>
          <b>{view.line1}</b>
        </p>
        <p>
          <b>{view.line2}</b>
        </p>
        <p>
          <b>{view.answer}</b>
        </p>

        {/* 번역 안내 */}
        <p className="learn-translation">회화를 선택한 외국어로 번역해 출력</p>
      </div>

      <div className="learn-actions-row">
        <button className="btn btn-primary" onClick={onNext}>
          {index + 1 >= 10 ? "완료" : "다음 페이지"}
        </button>
        <span className="learn-progress">진행: {index + 1} / 10</span>
      </div>
    </Container>
  );
}
