'use client';
import { useState, useEffect, useRef } from 'react';
import './globals.css';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  // ADD THIS FUNCTION HERE
const startNewChat = () => {
  // Clear current conversation
  setMessages([]);
  setInput('');
  setQuestionCount(0);
  
  // Generate new session ID
  const newSessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  localStorage.setItem('pg_session_id', newSessionId);
  setSessionId(newSessionId);
  
  // Show welcome message (optional)
  setTimeout(() => {
    setMessages([{
      id: Date.now().toString(),
      type: 'bot',
      content: "👋 Welcome to PurpleGiraffe! I'm your AI monetization expert. Ask me anything about app monetization, ad networks, eCPM optimization, or revenue strategies."
    }]);
  }, 100);
};


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
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    };

    initSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

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
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.response || data.error || 'Sorry, something went wrong.'
      };

      setMessages(prev => [...prev, botMessage]);
      setQuestionCount(data.questionCount || questionCount + 1);
      
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

  // Example questions for quick start
  const exampleQuestions = [
    "My eCPM dropped 40% overnight",
    "How to optimize AppLovin waterfall?",
    "Best fill rate for rewarded ads?",
    "Unity ads showing blank screen"
  ];

  const handleExampleClick = (question) => {
    setInput(question);
  };

  return (
    <div className="app">
      {/* Clean Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <img src="/logo.png" alt="PurpleGiraffe" style={{width: '32px', height: '32px'}} />
            <h1>PurpleGiraffe</h1>
          </div>
          <div className="header-actions">
            <button 
              className="toggle-sidebar-btn"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
           <button className="new-chat-btn" onClick={startNewChat}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
              New Chat
            </button>
          </div>
        </div>
      </header>

      <div className="main-container">
        {/* Main Chat Area */}
        <main className="chat-container">
          <div className="chat-content">
            {messages.length === 0 ? (
              // Welcome Screen
              <div className="welcome-screen">
                <div className="welcome-logo">
                  <img src="/logo.png" alt="PurpleGiraffe" style={{width: '80px', height: '80px'}} />
                </div>
                <h2 className="welcome-title">Welcome to PurpleGiraffe</h2>
                <p className="welcome-subtitle">Your AI expert for app monetization</p>
                
                <div className="example-questions">
                  {exampleQuestions.map((question, index) => (
                    <button
                      key={index}
                      className="example-question"
                      onClick={() => handleExampleClick(question)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 17L17 7M17 7H7M17 7V17"/>
                      </svg>
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Messages
              <div className="messages">
                {messages.map((message) => (
                  <div key={message.id} className={`message-wrapper ${message.type}`}>
                    <div className="message-container">
                      {message.type === 'bot' && (
                        <div className="avatar">
                          <img src="/logo.png" alt="PurpleGiraffe" style={{width: '24px', height: '24px'}} />
                        </div>
                      )}
                      <div className="message-content">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="message-wrapper bot">
                    <div className="message-container">
                      <div className="avatar">
                        <img src="/logo.png" alt="PurpleGiraffe" style={{width: '24px', height: '24px'}} />
                      </div>
                      <div className="message-content">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="input-wrapper">
            <form onSubmit={handleSubmit} className="input-form">
              <div className="input-container">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about monetization, ad networks, eCPM optimization..."
                  className="message-input"
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  className="send-button" 
                  disabled={loading || !input.trim()}
                >
                  {loading ? (
                    <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  )}
                </button>
              </div>
            </form>
            <p className="input-footer">
              PurpleGiraffe AI can make mistakes. Verify important information.
            </p>
          </div>
        </main>

        {/* Pricing Sidebar */}
        {showSidebar && (
          <aside className="pricing-sidebar">
            <div className="sidebar-content">
              <h3 className="sidebar-title">Upgrade Your Experience</h3>
              
              {/* AI Pro Plan */}
              <div className="pricing-card premium">
                <div className="card-badge">MOST POPULAR</div>
                <div className="card-header">
                  <div className="card-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <h4>AI Pro Access</h4>
                  <div className="price">
                    <span className="amount">$99</span>
                    <span className="period">/month</span>
                  </div>
                </div>
                <ul className="features-list">
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Unlimited AI queries
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Priority response time
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Advanced analytics insights
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Custom report generation
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    API access for integration
                  </li>
                </ul>
                <button className="upgrade-btn primary">
                  Upgrade to Pro
                </button>
              </div>

              {/* Expert Consultation */}
              <div className="pricing-card expert">
                <div className="card-header">
                  <div className="card-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <h4>Expert Consultation</h4>
                  <div className="price">
                    <span className="amount">$499</span>
                    <span className="period">/month</span>
                  </div>
                </div>
                <ul className="features-list">
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Everything in AI Pro
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    40 hours of 1-on-1 consulting
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Direct expert email support
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Custom strategy development
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Weekly performance reviews
                  </li>
                </ul>
                <div className="expert-contact">
                  <p className="contact-label">Direct Expert Access:</p>
                  <a href="mailto:expert@purplegiraffe.in" className="expert-email">
                    expert@purplegiraffe.in
                  </a>
                </div>
                <button className="upgrade-btn secondary">
                  Book Consultation
                </button>
              </div>

              {/* Current Plan */}
              <div className="current-plan">
                <p className="plan-label">Current Plan</p>
                <p className="plan-name">Free Trial</p>
                <p className="plan-limit">Testing Mode - Unlimited</p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
