import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const [user] = useState(() => {
    const userData = localStorage.getItem('user');
    const parsedUser = userData ? JSON.parse(userData) : null;
    console.log('User data in Navbar:', parsedUser);
    console.log('Avatar URL:', parsedUser?.avatar);
    return parsedUser;
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const handleProfile = () => {
    setDropdownOpen(false);
    // navigate('/profile');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand Name */}
        <div className="brand">
          <span className="brand-name">Expenza</span>
        </div>

        {/* Profile Dropdown */}
        <div className="profile-section" ref={dropdownRef}>
          <button 
            className="profile-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <img 
              src={user?.avatar}
              alt={user?.name || 'Profile'} 
              className="profile-image"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={handleProfile}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Profile</span>
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
