import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../components/Navbar';
import BudgetOverview from '../components/BudgetOverview';
import ExpensePanel from '../components/ExpensePanel';
import './Home.css';

const Home = () => {
  const [user] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  const [expenses, setExpenses] = useState([]);
  const [budgetData, setBudgetData] = useState({
    amount: 0,
    spent: 0,
    remaining: 0,
    percentUsed: 0
  });
  const [budgetAlert, setBudgetAlert] = useState({ show: false, percentUsed: 0, countdown: 8 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [newExpenseIds, setNewExpenseIds] = useState([]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Countdown timer for budget alert
  useEffect(() => {
    if (budgetAlert.show && budgetAlert.countdown > 0) {
      const timer = setTimeout(() => {
        setBudgetAlert(prev => ({
          ...prev,
          countdown: prev.countdown - 1
        }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (budgetAlert.show && budgetAlert.countdown === 0) {
      setBudgetAlert({ show: false, percentUsed: 0, countdown: 8 });
    }
  }, [budgetAlert]);

  const closeBudgetAlert = () => {
    setBudgetAlert({ show: false, percentUsed: 0, countdown: 8 });
  };

  const fetchExpenses = async () => {
    try {
      const response = await fetch('http://localhost:5000/expense/', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses);
        setBudgetData({
          amount: data.amount,
          spent: data.spent,
          remaining: data.amount - data.spent,
          percentUsed: data.percentUsed
        });
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const handleExpenseAdded = (data) => {
    // Update budget data
    setBudgetData(prev => ({
      ...prev,
      spent: prev.spent + data.amount,
      remaining: prev.amount - (prev.spent + data.amount),
      percentUsed: data.percentUsed
    }));

    // Show budget alert if notification flag is true
    if (data.notificationAlert) {
      setBudgetAlert({ show: true, percentUsed: Math.round(data.percentUsed), countdown: 8 });
    }

    // Add new expense to list
    const newExpense = {
      _id: data.expenseId,
      amount: data.amount,
      category: data.category,
      paymentMethod: data.paymentMethod,
      vendorName: data.vendorName,
      items: data.items,
      note: data.note,
      date: new Date().toISOString()
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const handleExpenseUpdated = (data) => {
    // Update budget data
    setBudgetData(prev => ({
      ...prev,
      percentUsed: data.percentUsed
    }));

    // Show budget alert if notification flag is true
    if (data.notificationAlert) {
      setBudgetAlert({ show: true, percentUsed: Math.round(data.percentUsed), countdown: 8 });
    }

    // Update expense in list
    setExpenses(prev =>
      prev.map(expense =>
        expense._id === data.expenseId
          ? {
              ...expense,
              amount: data.amount,
              category: data.category,
              paymentMethod: data.paymentMethod,
              vendorName: data.vendorName,
              items: data.items,
              note: data.note
            }
          : expense
      )
    );

    // Refetch to get accurate budget data
    fetchExpenses();
  };

  const handleExpenseDeleted = (expenseId) => {
    // Remove expense from list
    setExpenses(prev => prev.filter(expense => expense._id !== expenseId));
    
    // Refetch to get accurate budget data
    fetchExpenses();
  };

  const handleBudgetUpdated = () => {
    fetchExpenses();
  };

  const handleSyncPurchases = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const response = await fetch('http://localhost:5000/expense/ecommerce', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if any expenses were synced
        if (!data.expenseList || data.expenseList.length === 0) {
          toast.info('No purchases made since last sync', {
            position: 'top-right',
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        } else {
          // Add synced expenses to the list
          const syncedExpenses = data.expenseList.map(expense => ({
            _id: expense.expenseId,
            amount: expense.amount,
            category: expense.category,
            paymentMethod: expense.paymentMethod,
            vendorName: expense.vendorName,
            items: expense.items || [],
            note: expense.note || '',
            date: expense.date || new Date().toISOString()
          }));
          
          // Mark these expenses as new for animation
          const newIds = syncedExpenses.map(exp => exp._id);
          setNewExpenseIds(newIds);
          
          // Remove the 'new' class after animation completes (1 second)
          setTimeout(() => {
            setNewExpenseIds([]);
          }, 1000);
          
          setExpenses(prev => [...syncedExpenses, ...prev]);
          
          // Update budget data
          setBudgetData(prev => ({
            ...prev,
            percentUsed: data.percentUsed
          }));

          // Show budget alert if notification flag is true
          if (data.notificationAlert) {
            setBudgetAlert({ show: true, percentUsed: Math.round(data.percentUsed), countdown: 8 });
          }

          // Show success message
          toast.success(`Successfully synced ${data.expenseList.length} purchase${data.expenseList.length > 1 ? 's' : ''}!`, {
            position: 'top-right',
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });

          // Refetch to get accurate budget totals
          fetchExpenses();
        }
      } else {
        toast.error('Failed to sync purchases. Please try again.', {
          position: 'top-right',
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error('Error syncing purchases:', error);
      toast.error('Error syncing purchases. Please check your connection.', {
        position: 'top-right',
        autoClose: 4000,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="home-page">
      <Navbar onSyncPurchases={handleSyncPurchases} isSyncing={isSyncing} />
      <ToastContainer 
        theme="dark"
        position="top-right"
        style={{ zIndex: 9999 }}
      />
      
      {/* Main Content */}
      <main className="home-content">
        <BudgetOverview 
          budgetData={budgetData} 
          onBudgetUpdated={handleBudgetUpdated}
        />
        <ExpensePanel
          expenses={expenses}
          onExpenseAdded={handleExpenseAdded}
          onExpenseUpdated={handleExpenseUpdated}
          onExpenseDeleted={handleExpenseDeleted}
          newExpenseIds={newExpenseIds}
        />
      </main>

      {/* Budget Alert Modal */}
      {budgetAlert.show && (
        <div className="budget-alert-overlay">
          <div className="budget-alert-modal">
            <button className="alert-close-btn" onClick={closeBudgetAlert}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="alert-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="alert-icon">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h2>Budget Alert!</h2>
            <div className="alert-percentage">{budgetAlert.percentUsed}%</div>
            <p>You have exceeded <strong>{budgetAlert.percentUsed}%</strong> of your monthly budget.</p>
            <p className="alert-warning">Consider reviewing your expenses to stay within budget.</p>
            
            <div className="countdown-timer">
              <div className="countdown-circle">
                <svg viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="45" className="countdown-bg" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    className="countdown-progress"
                    style={{
                      strokeDashoffset: `${283 - (283 * budgetAlert.countdown) / 8}`
                    }}
                  />
                </svg>
                <span className="countdown-number">{budgetAlert.countdown}</span>
              </div>
              <p className="countdown-text">Redirecting to homepage...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
