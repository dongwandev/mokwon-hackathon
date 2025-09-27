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

// 절대 경로
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const QUESTIONS_PATH = path.join(__dirname, 'data', 'questions.json');
const QUESTIONS_CONTEXT_PATH = path.join(
  __dirname,
  'data',
  'questions_context.json'
);

// 캐시(questions.json용)
let cache = null;

// OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ───────────────────────── 유틸 ───────────────────────── */

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

// 공통 병합: 문장 기준 중복 제거 + 오답에서 정답 제거
function normalizeAndMerge(base, incoming) {
  const out = { ...base };
  for (const lvl of ['beginner', 'intermediate', 'advanced']) {
    if (!incoming[lvl]) continue;
    const existed = new Map((out[lvl] || []).map((q) => [q.sentence, q]));
    for (const q of incoming[lvl]) {
      if (!q?.sentence || !q?.answer || !Array.isArray(q?.options)) continue;
      const cleanSentence = String(q.sentence).trim();
      const cleanAnswer = String(q.answer).trim();
      const options = Array.from(
        new Set(
          q.options.filter(
            (o) => o && String(o).trim() && String(o).trim() !== cleanAnswer
          )
        )
      );
      if (options.length !== 3) continue; // 정확히 3개만 허용
      existed.set(cleanSentence, {
        sentence: cleanSentence,
        answer: cleanAnswer,
        options: options.slice(0, 3).map((s) => String(s).trim()),
      });
    }
    out[lvl] = Array.from(existed.values());
  }
  return out;
}

/* ── (기존) 빈칸 문제용 검증: sentence에 '____' 포함 ── */
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
      if (typeof it.answer !== 'string' || !it.answer.trim())
        return { ok: false, reason: `answer invalid: ${lvl}` };
      if (!Array.isArray(it.options) || it.options.length !== 3)
        return { ok: false, reason: `options must be 3: ${lvl}` };
      if (it.options.some((o) => typeof o !== 'string' || !o.trim()))
        return { ok: false, reason: `options item invalid: ${lvl}` };
    }
  }
  return { ok: true };
}

/* ── (신규) 대화형 문제용 검증: 2문장 대화처럼 보이는지 ── */
function validateDialoguePayloadShape(
  obj,
  expectCounts = { beginner: 1, intermediate: 1, advanced: 1 }
) {
  const levels = ['beginner', 'intermediate', 'advanced'];
  if (!obj || typeof obj !== 'object')
    return { ok: false, reason: 'root not object' };

  const looksLikeDialogue = (s) => {
    if (typeof s !== 'string') return false;
    const lines = s.split(/\r?\n/);
    const hasLineBreak = lines.length >= 2;
    const hasSpeaker = /(^|\n)\s*[A-Za-z가-힣]{1,3}\s*[:：]/.test(s); // "A:" "B:" "철수:"
    return hasLineBreak || hasSpeaker;
  };

  for (const lvl of levels) {
    if (!Array.isArray(obj[lvl]))
      return { ok: false, reason: `missing array: ${lvl}` };
    if ((obj[lvl].length || 0) < (expectCounts[lvl] || 1))
      return { ok: false, reason: `too few items: ${lvl}` };

    for (const it of obj[lvl]) {
      if (!it || typeof it !== 'object')
        return { ok: false, reason: `item not object: ${lvl}` };

      if (typeof it.sentence !== 'string' || !looksLikeDialogue(it.sentence))
        return { ok: false, reason: `sentence is not dialogue-like: ${lvl}` };

      if (typeof it.answer !== 'string' || !it.answer.trim())
        return { ok: false, reason: `answer invalid: ${lvl}` };

      if (!Array.isArray(it.options) || it.options.length !== 3)
        return { ok: false, reason: `options must be 3: ${lvl}` };

      if (it.options.some((o) => typeof o !== 'string' || !o.trim()))
        return { ok: false, reason: `options item invalid: ${lvl}` };
    }
  }
  return { ok: true };
}

/* ───────────────────────── 라우트 ───────────────────────── */

// 기본 라우트
app.get('/', (_req, res) => {
  res.send('Welcome to hackathon Server!');
});

// 디버그: 파일 경로/존재
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

// (있다면) 학습 컨텍스트 조회
app.get('/api/questions-context', async (_req, res) => {
  try {
    const text = await fs.readFile(QUESTIONS_CONTEXT_PATH, 'utf-8');
    const data = JSON.parse(text);
    return res.json(data);
  } catch (e) {
    console.error('Load questions_context error:', e);
    return res.status(500).json({ error: 'Failed to load questions_context' });
  }
});

/* ── (기존) 빈칸 문제 생성 API ───────────────────────────
   body: { replace?: boolean, perLevel?: number, prompt?: string } */
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
9. 난이도별 규칙:
   - beginner: 일상적인 기초 한국어, 동사/형용사 중심, 쉬운 어휘.
   - intermediate: 복합 문장, 조사/어미 변형, 일상 대화에서 쓰이는 표현.
   - advanced: 학술/신문/비즈니스 한국어, 추상적 개념, 고급 어휘.  

출력 형식:  
추가 설명 없이, 오직 JSON만 반환하라.
`.trim();

    console.log('[PROMPT GEN] request:', { replace, perLevel });

    const rsp = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: basePrompt,
      temperature: 0.7,
    });

    let raw = '';
    try {
      raw = rsp.output_text || '';
    } catch {}
    if (!raw.trim()) {
      try {
        raw = rsp.output?.[0]?.content?.[0]?.text || '';
      } catch {}
    }
    if (!raw.trim())
      return res.status(502).json({ error: 'OpenAI empty response' });

    let generated = null;
    try {
      generated = JSON.parse(raw);
    } catch {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '');
      try {
        generated = JSON.parse(cleaned);
      } catch {
        return res.status(502).json({ error: 'OpenAI returned invalid JSON' });
      }
    }

    const expectCounts = {
      beginner: perLevel,
      intermediate: perLevel,
      advanced: perLevel,
    };
    const check = validatePayloadShape(generated, expectCounts);
    if (!check.ok)
      return res
        .status(422)
        .json({ error: 'Invalid payload shape', reason: check.reason });

    let current;
    try {
      current = await loadQuestions(true);
    } catch {
      current = { beginner: [], intermediate: [], advanced: [] };
    }

    const base = replace
      ? { beginner: [], intermediate: [], advanced: [] }
      : current;
    const merged = normalizeAndMerge(base, generated);
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

/* ── (신규) 대화형 문제 생성 API ─────────────────────────
   body: { perLevel?: number, replace?: boolean, prompt?: string } */
app.post('/api/generate-questions/dialog', async (req, res) => {
  try {
    const { perLevel = 10, replace = true, prompt } = req.body || {};

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
     "sentence": "대화형식의 2문장.",
     "answer": "대화형식의 2문장중 마지막 문장의 답으로 알맞은 문장",
     "options": ["오답1", "오답2", "오답3"]
   }
4. "sentence"는 반드시 2명이서 하는 대화형식이여야 한다.
5. "answer"는 "sentence"다음으로 올수있는 대화의 맥락에 맞는 문장이여야 한다.
6. "options"에는 "answer"와 맥락상 전혀 다른 문장이 와야한다.
9. 난이도별 규칙:
   - beginner: 일상적인 기초 한국어, 동사/형용사 중심, 쉬운 어휘.
   - intermediate: 복합 문장, 조사/어미 변형, 일상 대화에서 쓰이는 표현.
   - advanced: 학술/신문/비즈니스 한국어, 추상적 개념, 고급 어휘.  

출력 형식:  
추가 설명 없이, 오직 JSON만 반환하라.
`.trim();

    console.log('[DIALOG GEN] request:', { perLevel, replace });

    const rsp = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: basePrompt,
      temperature: 0.7,
    });

    let raw = '';
    try {
      raw = rsp.output_text || '';
    } catch {}
    if (!raw.trim()) {
      try {
        raw = rsp.output?.[0]?.content?.[0]?.text || '';
      } catch {}
    }
    if (!raw.trim())
      return res.status(502).json({ error: 'OpenAI empty response' });

    let generated = null;
    try {
      generated = JSON.parse(raw);
    } catch {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '');
      try {
        generated = JSON.parse(cleaned);
      } catch {
        return res.status(502).json({ error: 'OpenAI returned invalid JSON' });
      }
    }

    const expectCounts = {
      beginner: perLevel,
      intermediate: perLevel,
      advanced: perLevel,
    };
    const check = validateDialoguePayloadShape(generated, expectCounts);
    if (!check.ok)
      return res
        .status(422)
        .json({ error: 'Invalid payload shape', reason: check.reason });

    let current;
    try {
      current = await loadQuestions(true);
    } catch {
      current = { beginner: [], intermediate: [], advanced: [] };
    }

    const base = replace
      ? { beginner: [], intermediate: [], advanced: [] }
      : current;
    const merged = normalizeAndMerge(base, generated);
    await saveQuestions(merged);

    console.log('[DIALOG GEN] saved counts:', {
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
    console.error('generate-questions/dialog error:', e);
    return res
      .status(500)
      .json({ error: 'Failed to generate dialogue questions' });
  }
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API 서버 실행: http://localhost:${PORT}`);
  console.log(`✅ CORS origin: ${ALLOW_ORIGIN}`);
  console.log(`📄 Questions path: ${QUESTIONS_PATH}`);
  console.log(`📄 Questions Context path: ${QUESTIONS_CONTEXT_PATH}`);
});
