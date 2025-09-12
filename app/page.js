// app/page.js - FIXED VERSION

'use client';
import { useState, useEffect, useRef } from 'react';
import './globals.css';
import PricingTiers from './components/PricingTiers';

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
  const [showMobilePricing, setShowMobilePricing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);

  // Auth form states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Question limit
  const QUESTION_LIMIT = 10;

  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setShowSidebar(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

    // Handle verification redirect
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    const email = urlParams.get('email');
    const error = urlParams.get('error');
    
    if (verified === 'true' && email) {
      // Show success message
      const successMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: `✅ Email verified successfully! You can now log in with ${decodeURIComponent(email)} to access unlimited questions as a Community Member.`
      };
      setMessages([successMessage]);
      
      // Show login modal
      setAuthMode('login');
      setShowAuthModal(true);
      setAuthEmail(decodeURIComponent(email)); // Pre-fill email
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (error) {
      let errorMessage = '';
      switch(error) {
        case 'invalid-token':
          errorMessage = '❌ Invalid verification link. Please sign up again.';
          break;
        case 'token-expired':
          errorMessage = '❌ Verification link expired. Please sign up again to receive a new link.';
          break;
        case 'already-verified':
          errorMessage = '✅ Email already verified. Please log in.';
          setAuthMode('login');
          setShowAuthModal(true);
          break;
        case 'verification-failed':
          errorMessage = '❌ Verification failed. Please try again or contact support.';
          break;
        default:
          errorMessage = '❌ An error occurred. Please try again.';
      }
      
      if (errorMessage) {
        const message = {
          id: Date.now().toString(),
          type: 'bot',
          content: errorMessage
        };
        setMessages([message]);
      }
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
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
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    };

    initSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start new chat function
  const startNewChat = async () => {
    // Only allow if user is logged in or under question limit
    if (isBlocked && !user) {
      setShowAuthModal(true);
      return;
    }
    
    // Clear messages and input
    setMessages([]);
    setInput('');
    
    // For logged-in users, create a new session
    // For non-logged users, keep the same session to preserve question count
    if (user) {
      // Logged-in users get a new session
      const newSessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('pg_session_id', newSessionId);
      setSessionId(newSessionId);
      
      // Reset question count for logged-in users (they have unlimited)
      setQuestionCount(0);
      setIsBlocked(false); 
    } else {
      // Non-logged users keep their session and question count
      // Don't reset the question count or session ID
      // Just verify the current count from the backend
      try {
        const response = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
        const data = await response.json();
        
        // Keep the actual question count from backend
        setQuestionCount(data.questionCount || 0);
        
        // Check if they're already blocked
        if (data.questionCount >= QUESTION_LIMIT) {
          setIsBlocked(true);
          
          // Show limit reached message
          setTimeout(() => {
            setMessages([{
              id: Date.now().toString(),
              type: 'bot',
              content: "🔒 You've reached the free question limit. Please sign up to continue our conversation and unlock unlimited access!"
            }]);
            setShowAuthModal(true);
          }, 100);
          return;
        }
      } catch (error) {
        console.error('Failed to verify session:', error);
      }
    }
    
    // Show welcome message
    setTimeout(() => {
      const welcomeMessage = user ? 
        "👋 New chat started! How can I help you optimize your monetization today?" :
        `👋 Welcome to Purple Giraffe! I'm your AI monetization expert. You have ${QUESTION_LIMIT - questionCount} free questions remaining.`;
      
      setMessages([{
        id: Date.now().toString(),
        type: 'bot',
        content: welcomeMessage
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

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Store the input before clearing
    const currentInput = input;
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
        body: JSON.stringify({ message: currentInput, sessionId })
      });

      const data = await response.json();
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.response || data.error || 'Sorry, something went wrong.'
      };

      setMessages(prev => [...prev, botMessage]);
      
      // ALWAYS use the backend's count
      const newCount = data.questionCount || 0;
      setQuestionCount(newCount);
      
      // Check if should be blocked based on backend's decision
      if (!user && newCount >= QUESTION_LIMIT) {
        setIsBlocked(true);
  
        // Only show message if we JUST hit the limit
        if (newCount === QUESTION_LIMIT) {
          setTimeout(() => {
            const limitMessage = {
              id: (Date.now() + 2).toString(),
              type: 'bot',
              content: "🔒 You've reached the free question limit. Please sign up to continue our conversation and unlock unlimited access!"
            };
            setMessages(prev => [...prev, limitMessage]);
            setShowAuthModal(true);
          }, 1000);
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
        setQuestionCount(0);
        
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
    // Don't call startNewChat() immediately, let useEffect handle session
    // This prevents race conditions
    window.location.reload(); // Or just reload to reset state cleanly
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
            <h1>Purple Giraffe</h1>
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
            
            {/* Desktop toggle sidebar button */}
            {!isMobile && (
              <button 
                className="toggle-sidebar-btn desktop-only"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            )}
            
            {/* Mobile pricing button */}
            {isMobile && (
              <button 
                className="mobile-pricing-btn"
                onClick={() => setShowMobilePricing(true)}
              >
                💰
              </button>
            )}
            
            <button 
              className="new-chat-btn" 
              onClick={startNewChat}
              disabled={isBlocked && !user}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span className="new-chat-text">New Chat</span>
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
                <h2 className="welcome-title">Welcome to Purple Giraffe</h2>
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
              Purple Giraffe AI can make mistakes. Verify important information.
            </p>
          </div>
        </main>

        {/* Pricing Sidebar - Desktop Only */}
        {showSidebar && !isMobile && (
          <aside className="pricing-sidebar">
            <PricingTiers 
              user={user} 
              currentTier={user?.tier || 'free'}
              onSignupClick={() => {
                setAuthMode('signup');
                setShowAuthModal(true);
              }}
              onLoginClick={() => {
                setAuthMode('login');
                setShowAuthModal(true);
              }}
            />
          </aside>
        )}
      </div>
      
      {/* Mobile Pricing Modal */}
      {showMobilePricing && isMobile && (
        <div className="mobile-pricing-overlay" onClick={() => setShowMobilePricing(false)}>
          <div className="mobile-pricing-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-pricing-header">
              <h3>Choose Your Plan</h3>
              <button 
                className="mobile-pricing-close"
                onClick={() => setShowMobilePricing(false)}
              >
                ✕
              </button>
            </div>
            <div className="mobile-pricing-content">
              <PricingTiers 
                user={user} 
                currentTier={user?.tier || 'free'}
                onSignupClick={() => {
                  setShowMobilePricing(false);  // Close pricing modal first
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
                onLoginClick={() => {
                  setShowMobilePricing(false);  // Close pricing modal first
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
              />
            </div>
          </div>
        </div>
      )}
      
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
