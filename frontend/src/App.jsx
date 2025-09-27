// import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LevelPage from "./pages/LevelPage.jsx";
import LevelResultPage from "./pages/LevelResultPage.jsx";
import LearningChoicePage from "./pages/LearningChoicePage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProblemPage from "./pages/ProblemPage.jsx";
import ProblemPageResult from "./pages/ProblemPageResult.jsx";
import LearningPage from "./pages/LearningPage.jsx";
import AchievementPage from "./pages/AchievementPage.jsx";
import Footer from "./components/Footer.jsx";

function Home() {
  return (
    <main style={{ padding: 16 }}>
      <h1>Home</h1>
      <p>여기는 "/" 라우트</p>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/level" element={<LevelPage />} />
        <Route path="/levelresult" element={<LevelResultPage />} />
        <Route path="/learningchoice" element={<LearningChoicePage />} />
        <Route path="/home" element={<HomePage />} />
        {/* 선택: 404 최소 대응 */}
        <Route
          path="*"
          element={<div style={{ padding: 16 }}>Not Found</div>}
        />
        <Route path="/LearningPage" element={<LearningPage />} />
        <Route path="/ProblemPage" element={<ProblemPage />} />
        <Route path="/ProblemPageResult" element={<ProblemPageResult/>} />
        <Route path="/achievement" element={<AchievementPage />} />
      </Routes>

      {/* 푸터 */}
      <Footer />
      
    </BrowserRouter>
  );
}

export default App;
