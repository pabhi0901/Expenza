import React, { useState } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import './BudgetOverview.css';

const BudgetOverview = ({ budgetData, onBudgetUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const handleEdit = () => {
    setEditValue(budgetData.amount.toString());
    setIsEditing(true);
  };

  const handleUpdateBudget = async () => {
    if (!editValue || isNaN(editValue) || Number(editValue) <= 0) {
      alert('Please enter a valid budget amount');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/budget/updatebudget', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: Number(editValue) })
      });

      if (response.ok) {
        if (onBudgetUpdated) {
          onBudgetUpdated();
        }
        setIsEditing(false);
        setEditValue('');
      }
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const getProgressColor = (percent) => {
    if (percent < 60) return 'green';
    if (percent < 80) return 'yellow';
    if (percent < 95) return 'orange';
    return 'red';
  };

  return (
    <div className="budget-section">
      <div className="budget-container">
        {/* Left Side - Budget Display */}
        <div className="budget-display">
          <div className="budget-header">
            <h2>Budget Overview</h2>
            {!isEditing ? (
              <button className="btn-edit" onClick={handleEdit}>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            ) : (
              <div className="edit-actions">
                <button className="btn-update" onClick={handleUpdateBudget}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="btn-cancel-inline" onClick={handleCancel}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="amount-section">
            {!isEditing ? (
              <div className="main-amount">
                <span className="rupee">₹</span>
                <span className="value">{budgetData.amount.toLocaleString()}</span>
              </div>
            ) : (
              <div className="edit-amount">
                <span className="rupee">₹</span>
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="amount-input"
                  autoFocus
                  placeholder="Enter amount"
                />
              </div>
            )}
            <p className="amount-label">Monthly Budget</p>
          </div>

          <div className="stats-grid">
            <div className="stat-box spent">
              <div className="stat-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                </svg>
              </div>
              <div className="stat-content">
                <p className="stat-title">Spent</p>
                <p className="stat-number">₹{budgetData.spent.toLocaleString()}</p>
              </div>
            </div>

            <div className="stat-box remaining">
              <div className="stat-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                </svg>
              </div>
              <div className="stat-content">
                <p className="stat-title">Remaining</p>
                <p className="stat-number">₹{budgetData.remaining.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Progress Circle */}
        <div className="progress-display">
          <div className="circular-progress">
            <CircularProgressbar
              value={Math.min(budgetData.percentUsed, 100)}
              strokeWidth={12}
              styles={buildStyles({
                pathColor: 
                  budgetData.percentUsed < 60 ? '#10b981' :
                  budgetData.percentUsed < 80 ? '#fbbf24' :
                  budgetData.percentUsed < 95 ? '#fb923c' : '#ef4444',
                trailColor: 'rgba(20, 17, 50, 0.6)',
                pathTransitionDuration: 1.5,
                strokeLinecap: 'round',
              })}
            />
            <div className="progress-content">
              <span className={`progress-percent ${getProgressColor(budgetData.percentUsed)}`}>
                {budgetData.percentUsed % 1 === 0 ? budgetData.percentUsed : budgetData.percentUsed.toFixed(2)}%
              </span>
              <span className="progress-label">Used</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetOverview;
