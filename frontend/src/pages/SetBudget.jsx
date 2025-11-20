import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import './SetBudget.css';

const SetBudget = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const containerRef = useRef(null);
  const formRef = useRef(null);
  const headerRef = useRef(null);
  const bgCircles = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Subtle background circles animation
      bgCircles.current.forEach((circle, index) => {
        gsap.to(circle, {
          x: '+=30',
          y: '+=20',
          duration: 15 + index * 3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      });

      // Fade in header
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );

      // Fade in form
      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: 'power2.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || amount <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/budget/setbudget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ amount: Number(amount) })
      });

      const data = await response.json();

      if (response.ok) {
        // Update user's firstTime status in localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.firstTime = false;
        localStorage.setItem('user', JSON.stringify(user));

        // Animate success and redirect
        gsap.to(formRef.current, {
          scale: 0.95,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => navigate('/')
        });
      } else {
        setError(data.message || 'Failed to set budget. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error setting budget:', err);
      setError('Network error. Please check your connection.');
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  return (
    <div className="setbudget-page" ref={containerRef}>
      {/* Brand Stickers */}
      <div className="brand-sticker sticker-visa">
        <svg viewBox="0 0 48 16" fill="currentColor">
          <path d="M20.5 2L17.5 14h-3L17.5 2h3zm8 0l-4.8 12h-3.2l-2-9.5L16 14h-3L16.8 2h4l1.7 8 4.5-8h4zm8.5 0c1.1 0 2 .4 2.6 1.1.6.7.9 1.6.9 2.7 0 1.5-.5 2.8-1.4 3.8-.9 1-2.1 1.5-3.6 1.5h-1.5L33 14h-3l3-12h5.5zm-1.5 6.5c.6 0 1.1-.2 1.5-.6.4-.4.6-.9.6-1.5 0-.4-.1-.7-.3-.9-.2-.2-.5-.3-.9-.3h-1.4l-.8 3.3h1.3zM46 2l-3 12h-3.5l.5-2h-3.5L35 14h-3.5L38 2h4.5L41 8l3.5-6H46z"/>
        </svg>
      </div>

      <div className="brand-sticker sticker-mastercard">
        <svg viewBox="0 0 48 32" fill="none">
          <circle cx="18" cy="16" r="12" fill="#EB001B" opacity="0.9"/>
          <circle cx="30" cy="16" r="12" fill="#F79E1B" opacity="0.9"/>
        </svg>
      </div>

      <div className="brand-sticker sticker-rupee">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 3h12M6 8h12M6 8c0 3.3 2.7 6 6 6h0c1.3 0 2.5-.4 3.5-1.1M6 13l9 8"/>
        </svg>
      </div>

      <div className="brand-sticker sticker-wallet">
        <svg viewBox="0 0 48 40" fill="none">
          <rect x="4" y="8" width="40" height="28" rx="4" fill="url(#walletGrad)" opacity="0.9"/>
          <rect x="28" y="18" width="12" height="8" rx="2" fill="rgba(255,255,255,0.3)"/>
          <circle cx="34" cy="22" r="2" fill="rgba(255,255,255,0.8)"/>
          <defs>
            <linearGradient id="walletGrad" x1="4" y1="8" x2="44" y2="36">
              <stop offset="0%" stopColor="#667eea"/>
              <stop offset="100%" stopColor="#764ba2"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="brand-sticker sticker-bank">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M24 8L6 18h36L24 8zM10 20v14M18 20v14M26 20v14M34 20v14M4 36h40M8 40h32"/>
        </svg>
      </div>

      {/* Floating Currency */}
      <div className="float-currency currency-1">₹</div>
      <div className="float-currency currency-2">$</div>
      <div className="float-currency currency-3">€</div>

      {/* Main Content */}
      <div className="setbudget-container">
        {/* Header Section */}
        <div className="setbudget-header" ref={headerRef}>
          <div className="brand-badge">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
            <span>Expenza</span>
          </div>
         
          <p>Track Smarter. Spend Better</p>
        </div>

        {/* Form Section */}
        <div className="setbudget-form-wrapper" ref={formRef}>
          <form onSubmit={handleSubmit} className="budget-form">
            <div className="form-card">
              {/* Card Chip */}
              <div className="card-chip">
                <svg viewBox="0 0 40 30" fill="none">
                  <rect width="40" height="30" rx="3" fill="url(#chipGrad)"/>
                  <circle cx="10" cy="10" r="3" fill="rgba(255,255,255,0.3)"/>
                  <circle cx="20" cy="10" r="3" fill="rgba(255,255,255,0.3)"/>
                  <circle cx="30" cy="10" r="3" fill="rgba(255,255,255,0.3)"/>
                  <circle cx="10" cy="20" r="3" fill="rgba(255,255,255,0.3)"/>
                  <circle cx="20" cy="20" r="3" fill="rgba(255,255,255,0.3)"/>
                  <circle cx="30" cy="20" r="3" fill="rgba(255,255,255,0.3)"/>
                  <defs>
                    <linearGradient id="chipGrad" x1="0" y1="0" x2="40" y2="30">
                      <stop offset="0%" stopColor="#ffd700"/>
                      <stop offset="100%" stopColor="#ffed4e"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div className="form-content">
                <label htmlFor="budget-amount" className="input-label">
                  Monthly Budget Amount
                </label>
                
                <div className="input-wrapper">
                  <div className="currency-symbol">₹</div>
                  <input
                    id="budget-amount"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Enter amount"
                    className="budget-input"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                {/* Quick Amount Suggestions */}
                <div className="amount-suggestions">
                  <button type="button" className="suggestion-btn" onClick={() => setAmount('10000')}>
                    ₹10,000
                  </button>
                  <button type="button" className="suggestion-btn" onClick={() => setAmount('25000')}>
                    ₹25,000
                  </button>
                  <button type="button" className="suggestion-btn" onClick={() => setAmount('50000')}>
                    ₹50,000
                  </button>
                </div>

                {error && (
                  <div className="error-message">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1L1 14h14L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 6v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="8" cy="11" r="0.5" fill="currentColor"/>
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <div className="help-note">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4M12 8h.01"/>
                  </svg>
                  <span>Track spending and get AI-powered insights</span>
                </div>

                <button type="submit" className="submit-button" disabled={isLoading}>
                  <span className="button-text">
                    {isLoading ? 'Setting up your budget...' : 'Continue to Dashboard'}
                  </span>
                  {!isLoading && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="arrow-icon">
                      <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {isLoading && <span className="loading-spinner"></span>}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetBudget;
