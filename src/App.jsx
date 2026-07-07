import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';
import './App.css';

import Sidebar from './components/Sidebar';
import DynamicInputBar from './components/DynamicInputBar';
import ActionCard from './components/ActionCard';
import ChatInterface from './components/ChatInterface';
import DocumentAnalyzer from './components/DocumentAnalyzer';
import CitizenTimeline from './components/CitizenTimeline';

import HistoryPage from './pages/HistoryPage';
import TimelinePage from './pages/TimelinePage';
import DocumentsPage from './pages/DocumentsPage';
import ProfilePage from './pages/ProfilePage';

function HomePage({ onIntentSubmit, onUploadClick }) {
  return (
    <div className="content-wrapper">
      <section className="hero">
        <h1 className="greeting">Good Morning, Garv <span className="wave">👋</span></h1>
        <p className="subtitle">How can Saarthi help you today?</p>
      </section>

      <DynamicInputBar onSubmit={onIntentSubmit} onUploadClick={onUploadClick} />

      <section className="quick-actions-container">
        <h3 className="section-title">Suggested for you</h3>
        <div className="quick-actions">
          <ActionCard icon="FileText" title="Lost Aadhaar" onClick={() => onIntentSubmit('I lost my Aadhaar')} />
          <ActionCard icon="GraduationCap" title="Scholarship" onClick={() => onIntentSubmit('I want to apply for a scholarship')} />
          <ActionCard icon="Plane" title="Passport" onClick={() => onIntentSubmit('I need a new passport')} />
          <ActionCard icon="Car" title="Driving Licence" onClick={() => onIntentSubmit('I want to renew my driving licence')} />
          <ActionCard icon="Heart" title="Healthcare" onClick={() => onIntentSubmit('I need Ayushman Bharat card')} />
          <ActionCard icon="Wheat" title="Agriculture" onClick={() => onIntentSubmit('I want to register my wheat crop for MSP')} />
        </div>
      </section>

      <CitizenTimeline />
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [initialIntent, setInitialIntent] = useState('');
  const [restoredChat, setRestoredChat] = useState(null);

  const handleIntentSubmit = (intent) => {
    setInitialIntent(intent);
    setRestoredChat(null);
    navigate('/chat');
  };

  const handleRestoreChat = (chat) => {
    setRestoredChat(chat);
    setInitialIntent('');
    navigate('/chat');
  };

  const isChatPage = location.pathname === '/chat';

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <header className="header">
          <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SAARTHI</div>
          <div className="avatar" onClick={() => navigate('/profile')} title="Profile">
            <User size={20} />
          </div>
        </header>

        <Routes>
          <Route path="/" element={<HomePage onIntentSubmit={handleIntentSubmit} onUploadClick={() => setIsUploadOpen(true)} />} />
          <Route path="/chat" element={
            <ChatInterface
              key={initialIntent + (restoredChat?.sessionId || '')}
              initialMessage={initialIntent}
              restoredChat={restoredChat}
              onUploadClick={() => setIsUploadOpen(true)}
            />
          } />
          <Route path="/history" element={<HistoryPage onRestoreChat={handleRestoreChat} />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>

      {isUploadOpen && <DocumentAnalyzer onClose={() => setIsUploadOpen(false)} />}
    </div>
  );
}

export default App;
