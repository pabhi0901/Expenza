import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchExpenses();
  }, []);

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

  return (
    <div className="home-page">
      <Navbar />
      
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
        />
      </main>
    </div>
  );
};

export default Home;
