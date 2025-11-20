import React, { useEffect } from 'react';
import './AuthCallback.css';

const AuthCallback = () => {
  useEffect(() => {
    // This page is opened in a popup after Google auth
    // Extract the user data from the URL parameters
    
    const parseResponse = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const dataParam = urlParams.get('data');
        
        if (dataParam) {
          // Decode and parse the user data
          const userData = JSON.parse(decodeURIComponent(dataParam));
          
          // Send message to parent window (Login page)
          window.opener.postMessage(
            {
              type: 'GOOGLE_AUTH_SUCCESS',
              data: userData
            },
            window.location.origin
          );
        } else {
          throw new Error('No data received from authentication');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        // Send error message to parent window
        window.opener.postMessage(
          {
            type: 'GOOGLE_AUTH_ERROR',
            error: error.message
          },
          window.location.origin
        );
      } finally {
        // Close the popup window
        window.close();
      }
    };

    parseResponse();
  }, []);

  return (
    <div className="auth-callback-page">
      <div className="auth-callback-content">
        <div className="brand-icon">💎</div>
        <h2>Expenza</h2>
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
        <p>Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
