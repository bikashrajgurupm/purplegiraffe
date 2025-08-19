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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signup'); // 'login' or 'signup'
  const [user, setUser] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const messagesEndRef = useRef(null);

  // Auth form states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Question limit
  const QUESTION_LIMIT = 10;

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('pg_token');
    const userData = localStorage.getItem('pg_user');
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      // Only set user if email is verified
      if (parsedUser.email_verified) {
        setUser(parsedUser);
        setIsBlocked(false);
      }
    }

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
        
        setQuestionCount(data.questionCount || 0);
        
        // Check if user has hit limit and is not logged in
        if (data.questionCount >= QUESTION_LIMIT && !user) {
          setIsBlocked(true);
          // Will show auth modal after first blocked attempt
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    };

    initSession();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start new chat function
  const startNewChat = () => {
    // Only allow if user is logged in or under question limit
    if (isBlocked && !user) {
      setShowAuthModal(true);
      return;
    }
    
    setMessages([]);
    setInput('');
    setQuestionCount(0);
    
    const newSessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('pg_session_id', newSessionId);
    setSessionId(newSessionId);
    
    setTimeout(() => {
      setMessages([{
        id: Date.now().toString(),
        type: 'bot',
        content: "👋 Welcome to PurpleGiraffe! I'm your AI monetization expert. Ask me anything about app monetization, ad networks, eCPM optimization, or revenue strategies."
      }]);
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Check if blocked
    if (isBlocked && !user) {
      setShowAuthModal(true);
      return;
    }

    // Check question limit before sending
    if (questionCount >= QUESTION_LIMIT - 1 && !user) {
      // This is their last free question
      setIsBlocked(true);
    }

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add auth token if user is logged in
      const token = localStorage.getItem('pg_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: input, sessionId })
      });

      const data = await response.json();
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.response || data.error || 'Sorry, something went wrong.'
      };

      setMessages(prev => [...prev, botMessage]);
      
      const newCount = data.questionCount || questionCount + 1;
      setQuestionCount(newCount);
      
      // Show auth modal after reaching limit
      if (newCount >= QUESTION_LIMIT && !user) {
        setTimeout(() => {
          setShowAuthModal(true);
          const limitMessage = {
            id: (Date.now() + 2).toString(),
            type: 'bot',
            content: "🔒 You've reached the free question limit. Please sign up to continue our conversation and unlock unlimited access!"
          };
          setMessages(prev => [...prev, limitMessage]);
        }, 1000);
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

  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          sessionId
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Show verification message
        setShowVerificationMessage(true);
        setShowAuthModal(false);
        setAuthEmail('');
        setAuthPassword('');
        
        // Don't log them in yet - they need to verify email
        const verifyMessage = {
          id: Date.now().toString(),
          type: 'bot',
          content: "📧 Thanks for signing up! Please check your email and click the verification link to continue. Once verified, you can log in and enjoy unlimited access!"
        };
        setMessages(prev => [...prev, verifyMessage]);
      } else {
        setAuthError(data.error || 'Signup failed');
      }
    } catch (error) {
      setAuthError('Network error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (!data.user.email_verified) {
          setAuthError('Please verify your email before logging in');
          return;
        }

        // Store token and user data
        localStorage.setItem('pg_token', data.token);
        localStorage.setItem('pg_user', JSON.stringify(data.user));
        
        setUser(data.user);
        setIsBlocked(false);
        setShowAuthModal(false);
        setAuthEmail('');
        setAuthPassword('');
        
        const welcomeMessage = {
          id: Date.now().toString(),
          type: 'bot',
          content: `🎉 Welcome back! You now have unlimited access. How can I help you optimize your monetization today?`
        };
        setMessages(prev => [...prev, welcomeMessage]);
      } else {
        setAuthError(data.error || 'Login failed');
      }
    } catch (error) {
      setAuthError('Network error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pg_token');
    localStorage.removeItem('pg_user');
    setUser(null);
    startNewChat();
  };

  // Example questions for quick start
  const exampleQuestions = [
    "My eCPM dropped 40% overnight",
    "How to optimize AppLovin waterfall?",
    "Best fill rate for rewarded ads?",
    "Unity ads showing blank screen"
  ];

  const handleExampleClick = (question) => {
    if (isBlocked && !user) {
      setShowAuthModal(true);
      return;
    }
    setInput(question);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <img src="/logo.png" alt="PurpleGiraffe" style={{width: '32px', height: '32px'}} />
            <h1>PurpleGiraffe</h1>
          </div>
          <div className="header-actions">
            {user ? (
              <>
                <span className="user-email">{user.email}</span>
                <button className="logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button className="login-btn" onClick={() => {
                setAuthMode('login');
                setShowAuthModal(true);
              }}>
                Login
              </button>
            )}
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
            <button 
              className="new-chat-btn" 
              onClick={startNewChat}
              disabled={isBlocked && !user}
            >
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
                
                {!user && (
                  <div className="question-counter-display">
                    <p>Free questions used: <strong>{questionCount} / {QUESTION_LIMIT}</strong></p>
                    {questionCount >= QUESTION_LIMIT && (
                      <p className="limit-warning">Please sign up to continue</p>
                    )}
                  </div>
                )}
                
                <div className="example-questions">
                  {exampleQuestions.map((question, index) => (
                    <button
                      key={index}
                      className="example-question"
                      onClick={() => handleExampleClick(question)}
                      disabled={isBlocked && !user}
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
            {!user && (
              <div className="question-limit-bar">
                <div className="limit-progress">
                  <div 
                    className="limit-fill" 
                    style={{width: `${(questionCount / QUESTION_LIMIT) * 100}%`}}
                  />
                </div>
                <span className="limit-text">
                  {questionCount} / {QUESTION_LIMIT} free questions used
                </span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="input-form">
              <div className="input-container">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isBlocked && !user ? "Sign up to continue chatting..." : "Ask about monetization, ad networks, eCPM optimization..."}
                  className="message-input"
                  disabled={loading || (isBlocked && !user)}
                />
                <button 
                  type="submit" 
                  className="send-button" 
                  disabled={loading || !input.trim() || (isBlocked && !user)}
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

        {/* Pricing Sidebar - existing code */}
        {showSidebar && (
          <aside className="pricing-sidebar">
            {/* Your existing sidebar content */}
          </aside>
        )}
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget && !isBlocked) {
            setShowAuthModal(false);
          }
        }}>
          <div className="auth-modal">
            {!isBlocked && (
              <button className="modal-close" onClick={() => setShowAuthModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
            
            <div className="auth-header">
              <img src="/logo.png" alt="PurpleGiraffe" style={{width: '48px', height: '48px'}} />
              <h2>{authMode === 'signup' ? 'Create Your Account' : 'Welcome Back'}</h2>
              {isBlocked && (
                <p className="auth-subtitle">
                  You've used all {QUESTION_LIMIT} free questions. Sign up to continue with unlimited access!
                </p>
              )}
            </div>

            <form onSubmit={authMode === 'signup' ? handleSignup : handleLogin} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="auth-input"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength="6"
                  className="auth-input"
                />
              </div>

              {authError && (
                <div className="auth-error">
                  {authError}
                </div>
              )}

              <button type="submit" className="auth-submit" disabled={authLoading}>
                {authLoading ? 'Processing...' : (authMode === 'signup' ? 'Sign Up' : 'Log In')}
              </button>
            </form>

            <div className="auth-footer">
              {authMode === 'signup' ? (
                <p>
                  Already have an account?{' '}
                  <button onClick={() => setAuthMode('login')} className="auth-switch">
                    Log in
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account?{' '}
                  <button onClick={() => setAuthMode('signup')} className="auth-switch">
                    Sign up
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verification Message */}
      {showVerificationMessage && (
        <div className="verification-banner">
          <p>📧 Check your email for verification link!</p>
          <button onClick={() => setShowVerificationMessage(false)}>×</button>
        </div>
      )}
    </div>
  );
}
