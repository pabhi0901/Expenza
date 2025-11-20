import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for messages from the popup window
    const handleMessage = (event) => {
      // Security check - verify origin
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        const { data } = event.data;
        
        // Store user data and authentication status in localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(data));
        
        // Check firstTime field and redirect accordingly
        if (data.firstTime === true) {
          navigate('/setBudget');
        } else {
          navigate('/');
        }
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        alert('Authentication failed. Please try again.');
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate]);

  const handleGoogleLogin = () => {
    // Open Google auth in a popup window
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      'http://localhost:5000/auth/google',
      'Google Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Check if popup is closed
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
      }
    }, 1000);
  };

  return (
    <div className="login-page">
      {/* Animated Background Pattern */}
      <div className="background-pattern">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
        <div className="mesh-gradient"></div>
      </div>

      {/* Main Container */}
      <div className="login-main">
        {/* Left Side - Branding & Features */}
        <div className="login-left">
          {/* Brand Header */}
          <div className="brand-header">
            <div className="brand-logo">
              <div className="logo-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M2 12h20" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="9" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="brand-text">
                <h1>Expenza</h1>
                <p>Track Smarter. Spend Better</p>
              </div>
            </div>
          </div>

          {/* Features Showcase */}
          <div className="features-showcase">
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 17l-5-5-4 4-3-3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="feature-content">
                <h3>Real-Time Tracking</h3>
                <p>Monitor every transaction as it happens with instant expense tracking</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeLinecap="round"/>
                  <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="feature-content">
                <h3>Smart Budgets</h3>
                <p>Set intelligent spending limits that adapt to your lifestyle</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="feature-content">
                <h3>AI Insights</h3>
                <p>Get personalized recommendations powered by machine learning</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="feature-content">
                <h3>Bank-Level Security</h3>
                <p>Your financial data is encrypted and protected 24/7</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-right">
          <div className="login-card">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue managing your finances</p>
            </div>

            <button onClick={handleGoogleLogin} className="google-btn">
              <svg className="google-icon" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="divider">
              <span>Secure Authentication</span>
            </div>

            <div className="login-footer">
              <p>By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;