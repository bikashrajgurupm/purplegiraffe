'use client';
import { useState, useEffect, useRef } from 'react';
import './globals.css';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [remainingQuestions, setRemainingQuestions] = useState(3);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailCaptured, setEmailCaptured] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize session
    const initSession = async () => {
      let storedSessionId = localStorage.getItem('pg_session_id');
      if (!storedSessionId) {
        storedSessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('pg_session_id', storedSessionId);
      }
      setSessionId(storedSessionId);

      try {
        const response = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: storedSessionId })
        });
        const data = await response.json();
        setQuestionCount(data.questionCount);
        setRemainingQuestions(data.remainingQuestions);
        setEmailCaptured(data.emailCaptured);
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    };

    initSession();
    setMessages([{
      id: '1',
      type: 'bot',
      content: "👋 Welcome to PurpleGiraffe! I'm your AI monetization expert. Ask me anything about app monetization, ad networks, eCPM optimization, or revenue strategies."
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Check if email is needed - DISABLED FOR TESTING
// if (remainingQuestions === 0 && !emailCaptured) {
//   setShowEmailModal(true);
//   return;
// }

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, sessionId })
      });

      const data = await response.json();

      if (response.status === 403) {
        setShowEmailModal(true);
      } else {
        const botMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: data.response
        };

        setMessages(prev => [...prev, botMessage]);
        setQuestionCount(data.questionCount);
        setRemainingQuestions(data.remainingQuestions);

        if (data.remainingQuestions === 0 && !emailCaptured) {
          setTimeout(() => setShowEmailModal(true), 1000);
        }
      }
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: '❌ Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await fetch('/api/capture-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sessionId })
      });
      setEmailCaptured(true);
      setShowEmailModal(false);
      setRemainingQuestions(999);
      
      const thankYouMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: '✨ Thank you! You now have unlimited access to ask questions. How can I help you optimize your app monetization?'
      };
      setMessages(prev => [...prev, thankYouMessage]);
    } catch (error) {
      alert('Failed to save email. Please try again.');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <svg className="logo-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
            <h1>PurpleGiraffe</h1>
          </div>
          <div className="header-stats">
            {/* Question counter disabled for testing */}
            {/*!emailCaptured && (
              <div className="question-counter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <span>{remainingQuestions} of 3 free questions remaining</span>
              </div>
            )}*/}
          </div>
        </div>
      </header>

      <main className="chat-container">
        <div className="messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                {message.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message bot">
              <div className="message-content loading">
                <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about eCPM, ad networks, revenue optimization..."
            className="message-input"
            disabled={loading}
          />
          <button type="submit" className="send-button" disabled={loading || !input.trim()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </main>

      {showEmailModal && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="modal-close" onClick={() => setShowEmailModal(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div className="modal-header">
              <svg className="modal-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <h2>Continue with Unlimited Access</h2>
            </div>
            <p className="modal-description">
              Enter your email to continue asking questions and get expert monetization advice.
            </p>
            <form onSubmit={handleEmailSubmit} className="email-form">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="email-input"
                required
              />
              <button type="submit" className="email-submit">
                Get Unlimited Access
              </button>
            </form>
            <p className="modal-footer">
              No spam, ever. Upgrade to paid plans for advanced features.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
