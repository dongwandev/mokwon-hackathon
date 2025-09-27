// backend/index.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs/promises';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

dotenv.config();

// 서버 포트 / CORS
const PORT = Number(process.env.SERVER_PORT) || 4000;
const ALLOW_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:8080';

// Express
const app = express();
app.use(cors({ origin: ALLOW_ORIGIN }));
app.use(express.json());

// 실행 파일 기준 절대 경로 (process.cwd() 대신 안전)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const QUESTIONS_PATH = path.join(__dirname, 'data', 'questions.json');

// 캐시
let cache = null;

// OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------- 유틸 ----------

// 파일 로드/저장
async function loadQuestions(force = false) {
  if (!cache || force) {
    const text = await fs.readFile(QUESTIONS_PATH, 'utf-8');
    cache = JSON.parse(text);
  }
  return cache;
}
async function saveQuestions(obj) {
  await fs.writeFile(QUESTIONS_PATH, JSON.stringify(obj, null, 2), 'utf-8');
  cache = null; // 저장 후 캐시 무효화
}

// 정합성 보정 + 병합(문장 기준 중복 제거, 오답에서 정답 제거)
function normalizeAndMerge(base, incoming) {
  const out = { ...base };
  for (const lvl of ['beginner', 'intermediate', 'advanced']) {
    if (!incoming[lvl]) continue;
    const existed = new Map((out[lvl] || []).map((q) => [q.sentence, q]));
    for (const q of incoming[lvl]) {
      if (!q?.sentence || !q?.answer || !Array.isArray(q?.options)) continue;
      const options = Array.from(
        new Set(q.options.filter((o) => o && o !== q.answer))
      );
      if (options.length !== 3) continue; // 정확히 3개만 허용
      existed.set(String(q.sentence).trim(), {
        sentence: String(q.sentence).trim(),
        answer: String(q.answer).trim(),
        options: options.map((s) => String(s).trim()),
      });
    }
    out[lvl] = Array.from(existed.values());
  }
  return out;
}

// 생성 결과 간단 검증
function validatePayloadShape(
  obj,
  expectCounts = { beginner: 1, intermediate: 1, advanced: 1 }
) {
  const levels = ['beginner', 'intermediate', 'advanced'];
  if (!obj || typeof obj !== 'object')
    return { ok: false, reason: 'root not object' };
  for (const lvl of levels) {
    if (!Array.isArray(obj[lvl]))
      return { ok: false, reason: `missing array: ${lvl}` };
    if ((obj[lvl].length || 0) < (expectCounts[lvl] || 1))
      return { ok: false, reason: `too few items: ${lvl}` };
    for (const it of obj[lvl]) {
      if (!it || typeof it !== 'object')
        return { ok: false, reason: `item not object: ${lvl}` };
      if (typeof it.sentence !== 'string' || !it.sentence.includes('____'))
        return { ok: false, reason: `sentence must contain ____: ${lvl}` };
      if (typeof it.answer !== 'string' || !it.answer)
        return { ok: false, reason: `answer invalid: ${lvl}` };
      if (!Array.isArray(it.options) || it.options.length !== 3)
        return { ok: false, reason: `options must be 3: ${lvl}` };
      if (it.options.some((o) => typeof o !== 'string' || !o))
        return { ok: false, reason: `options item invalid: ${lvl}` };
    }
  }
  return { ok: true };
}

// ---------- 라우트 ----------

// 기본 라우트
app.get('/', (_req, res) => {
  res.send('Welcome to hackathon Server!');
});

// 디버그: JSON 파일 경로/존재 여부
app.get('/api/_debug', async (_req, res) => {
  try {
    await fs.access(QUESTIONS_PATH);
    res.json({ QUESTIONS_PATH, exists: true });
  } catch {
    res.json({ QUESTIONS_PATH, exists: false });
  }
});

// 문제 조회 (nocache 지원)
app.get('/api/questions', async (req, res) => {
  try {
    const force = req.query.nocache === '1';
    const data = await loadQuestions(force);
    const { level } = req.query;

    if (!level) return res.json(data);

    if (!['beginner', 'intermediate', 'advanced'].includes(String(level))) {
      return res.status(400).json({ error: 'Invalid level' });
    }
    return res.json({ [level]: data[level] });
  } catch (e) {
    console.error('Load questions error:', e);
    return res.status(500).json({ error: 'Failed to load questions' });
  }
});

// 프롬프트 기반 생성 API
// POST /api/generate-questions/prompt
// body: { replace?: boolean, perLevel?: number, prompt?: string }
app.post('/api/generate-questions/prompt', async (req, res) => {
  try {
    const { replace = false, perLevel = 10, prompt } = req.body || {};

    const basePrompt =
      (prompt && String(prompt)) ||
      `
너의 역할은 한국어 학습자를 위한 문제 생성기이다.  
다음 조건에 맞게 JSON 객체를 생성하라

조건:  
1. JSON은 세 개의 배열 키를 가져야 한다: "beginner", "intermediate", "advanced".  
2. 각 배열에는 문제 객체 ${perLevel}개씩 포함한다.  
3. 각 문제 객체는 다음 형식을 따른다:
   {
     "sentence": "빈칸이 포함된 한국어 문장",
     "answer": "정답",
     "options": ["오답1", "오답2", "오답3"]
   }
4. "sentence"는 반드시 빈칸(____)을 포함해야 한다.  
5. "answer"는 빈칸에 들어갈 정답 단어 또는 표현.  
6. "options"에는 정답과 관련 있으나 틀린 선택지 3개를 포함한다.
7. "answer"는 반드시 "형용사나 동사" 만 포함되어야 한다.
8. "answer"
9. 난이도별 규칙:
   - beginner: 일상적인 기초 한국어, 동사/형용사 중심, 쉬운 어휘.
   - intermediate: 복합 문장, 조사/어미 변형, 일상 대화에서 쓰이는 표현.
   - advanced: 학술/신문/비즈니스 한국어, 추상적 개념, 고급 어휘.  

출력 형식:  
추가 설명 없이, 오직 JSON만 반환하라.
`.trim();

    console.log('[PROMPT GEN] request:', { replace, perLevel });

    // OpenAI 호출: 순수 JSON 문자열로 받음
    const rsp = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: basePrompt,
      temperature: 0.7,
      // response_format 미사용 → 모델이 JSON 텍스트로 직접 반환
    });

    // 문자열 추출
    let raw = '';
    try {
      raw = rsp.output_text || '';
    } catch {}
    if (!raw.trim()) {
      try {
        raw = rsp.output?.[0]?.content?.[0]?.text || '';
      } catch {}
    }
    if (!raw.trim()) {
      console.error('[PROMPT GEN] empty output_text');
      return res.status(502).json({ error: 'OpenAI empty response' });
    }

    // JSON 파싱 (```json 코드블록 방지)
    let generated = null;
    try {
      generated = JSON.parse(raw);
    } catch {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '');
      try {
        generated = JSON.parse(cleaned);
      } catch {
        console.error('[PROMPT GEN] invalid JSON:', raw.slice(0, 400));
        return res.status(502).json({ error: 'OpenAI returned invalid JSON' });
      }
    }

    // 구조 검증 (레벨별 perLevel개 기대)
    const expectCounts = {
      beginner: perLevel,
      intermediate: perLevel,
      advanced: perLevel,
    };
    const check = validatePayloadShape(generated, expectCounts);
    if (!check.ok) {
      console.error('[PROMPT GEN] shape invalid:', check.reason);
      return res
        .status(422)
        .json({ error: 'Invalid payload shape', reason: check.reason });
    }

    // 기존 로드
    let current;
    try {
      current = await loadQuestions(true);
    } catch {
      // 파일이 없거나 비정상일 경우 기본 스켈레톤
      current = { beginner: [], intermediate: [], advanced: [] };
    }

    // 덮어쓰기 or 추가 병합
    const base = replace
      ? { beginner: [], intermediate: [], advanced: [] }
      : current;
    const merged = normalizeAndMerge(base, generated);

    // 저장
    await saveQuestions(merged);

    console.log('[PROMPT GEN] saved:', {
      beginner: merged.beginner.length,
      intermediate: merged.intermediate.length,
      advanced: merged.advanced.length,
    });

    return res.json({
      ok: true,
      replaced: !!replace,
      counts: {
        beginner: merged.beginner.length,
        intermediate: merged.intermediate.length,
        advanced: merged.advanced.length,
      },
    });
  } catch (e) {
    console.error('generate-questions/prompt error:', e);
    return res.status(500).json({ error: 'Failed to generate via prompt' });
  }
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API 서버 실행: http://localhost:${PORT}`);
  console.log(`✅ CORS origin: ${ALLOW_ORIGIN}`);
  console.log(`📄 Questions path: ${QUESTIONS_PATH}`);
});
