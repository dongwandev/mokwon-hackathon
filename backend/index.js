import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs/promises";
import path from "path";

// env 로드
dotenv.config();

// 포트: .env SERVER_PORT 우선
const PORT = Number(process.env.SERVER_PORT) || 4000;

// Express 앱
const app = express();

// CORS 설정 (프론트엔드 주소만 허용)
const ALLOW_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:8080";
app.use(
  cors({
    origin: ALLOW_ORIGIN,
  })
);

app.use(express.json());

// 간단 캐시
let cache = null;

// 기본 라우트
app.get("/", (req, res) => {
  res.send("Welcome to hackathon Server!");
});

// 문제 API
app.get("/api/questions", async (req, res) => {
  try {
    if (!cache) {
      const filePath = path.join(process.cwd(), "data", "questions.json");
      const text = await fs.readFile(filePath, "utf-8");
      cache = JSON.parse(text);
    }
    const { level } = req.query;
    if (!level) return res.json(cache);

    if (!["beginner", "intermediate", "advanced"].includes(String(level))) {
      return res.status(400).json({ error: "Invalid level" });
    }

    return res.json({ [level]: cache[level] });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load questions" });
  }
});

// 서버 시작
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ API 서버 실행: http://localhost:${PORT}`);
  console.log(`✅ CORS origin: ${ALLOW_ORIGIN}`);
});

