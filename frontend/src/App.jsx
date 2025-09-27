// import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LevelPage from "./pages/LevelPage.jsx";
import LearningChoicePage from "./pages/LearningChoicePage.jsx";
import HomePage from "./pages/HomePage.jsx";
import './App.css'

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
        <Route path="/learningchoice" element={<LearningChoicePage />} />
        <Route path="/home" element={<HomePage />} />
        {/* 선택: 404 최소 대응 */}
        <Route path="*" element={<div style={{ padding: 16 }}>Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
