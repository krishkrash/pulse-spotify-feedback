import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AskPulse from './pages/AskPulse';
import TopicExplorer from './pages/TopicExplorer';
import UserSegments from './pages/UserSegments';
import WeeklyDigest from './pages/WeeklyDigest';
import SystemControl from './pages/SystemControl';

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-[#0c0b0b] text-zinc-200 overflow-hidden font-sans">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-[#0c0b0b]">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ask" element={<AskPulse />} />
            <Route path="/topics" element={<TopicExplorer />} />
            <Route path="/segments" element={<UserSegments />} />
            <Route path="/digest" element={<WeeklyDigest />} />
            <Route path="/settings" element={<SystemControl />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
