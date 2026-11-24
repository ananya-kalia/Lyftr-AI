import React, { useState, useEffect } from 'react';
import ChatHeader from './components/ChatHeader';
import Sidebar from './components/Sidebar';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import SimulationDrawer from './components/SimulationDrawer';
import {
  sendChatMessage,
  fetchSessionHistory,
  fetchAllSessions,
  checkBackendHealth,
} from './services/api';

function generateSessionId() {
  return 'sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export default function App() {
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('lyftr_session_id') || generateSessionId();
  });
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);
  const [isSimOpen, setIsSimOpen] = useState(false);
  const [simulationHeader, setSimulationHeader] = useState('');

  // Save session ID
  useEffect(() => {
    localStorage.setItem('lyftr_session_id', sessionId);
  }, [sessionId]);

  // Load backend health and session history on start or session change
  useEffect(() => {
    checkBackendHealth().then((h) => setHealth(h));
    fetchAllSessions().then((sList) => setSessions(sList));
  }, []);

  useEffect(() => {
    setError(null);
    fetchSessionHistory(sessionId).then((msgs) => {
      setMessages(msgs);
    });
  }, [sessionId]);

  const handleSendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    // Optimistically add user message to list
    const userMsg = {
      id: 'temp_' + Date.now(),
      session_id: sessionId,
      role: 'user',
      content: text,
      metadata: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await sendChatMessage(sessionId, text, simulationHeader);
      
      const assistantMsg = {
        id: 'resp_' + Date.now(),
        session_id: sessionId,
        role: 'assistant',
        content: response.reply,
        metadata: response.metadata,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh sessions sidebar
      fetchAllSessions().then((sList) => setSessions(sList));
    } catch (err) {
      console.error('Chat error:', err);
      const errMsg = err.message || 'An unexpected error occurred while communicating with AI service.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = () => {
    const newId = generateSessionId();
    setSessionId(newId);
    setMessages([]);
    setError(null);
  };

  const handleSelectSession = (selectedId) => {
    if (selectedId !== sessionId) {
      setSessionId(selectedId);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0d14] text-slate-100 font-sans">
      {/* Sidebar for Sessions and Memory Navigation */}
      <Sidebar
        sessions={sessions}
        currentSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        <ChatHeader
          sessionId={sessionId}
          health={health}
          onOpenSimulation={() => setIsSimOpen(true)}
          simulationHeader={simulationHeader}
          onResetSession={handleNewSession}
        />

        {/* Message Thread */}
        <MessageList
          messages={messages}
          isLoading={isLoading}
          error={error}
          onQuickPrompt={handleSendMessage}
        />

        {/* Chat Input with data-testid */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />

        {/* Simulation and Failover Testing Drawer */}
        <SimulationDrawer
          isOpen={isSimOpen}
          onClose={() => setIsSimOpen(false)}
          simulationHeader={simulationHeader}
          onSetSimulationHeader={setSimulationHeader}
          health={health}
        />
      </div>
    </div>
  );
}
