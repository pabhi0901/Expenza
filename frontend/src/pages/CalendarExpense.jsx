import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../components/Navbar';
import BudgetOverview from '../components/BudgetOverview';
import './CalendarExpense.css';

const CalendarExpense = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expenses, setExpenses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [userCreatedAt, setUserCreatedAt] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [budgetData, setBudgetData] = useState(null);
  const [activeTab, setActiveTab] = useState('manual');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, expenseId: null, expenseDate: null, deleting: false });
  const [budgetAlert, setBudgetAlert] = useState({ show: false, percentUsed: 0, countdown: 8 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [newExpenseIds, setNewExpenseIds] = useState([]);

  const [formData, setFormData] = useState({
    amount: '',
    category: 'other',
    paymentMethod: 'Other',
    vendorName: '',
    note: '',
    items: []
  });

  const [itemInput, setItemInput] = useState({ name: '', quantity: '', price: '' });

  const categories = [
    { value: 'foodAndDrinks', label: 'Food & Drinks' },
    { value: 'groceries', label: 'Groceries' },
    { value: 'transport', label: 'Transport' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'billsAndUtilities', label: 'Bills & Utilities' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'healthAndFitness', label: 'Health & Fitness' },
    { value: 'education', label: 'Education' },
    { value: 'subscriptions', label: 'Subscriptions' },
    { value: 'rent', label: 'Rent' },
    { value: 'personalCare', label: 'Personal Care' },
    { value: 'other', label: 'Other' },
    { value: 'fuel', label: 'Fuel' },
    { value: 'giftsAndDonations', label: 'Gifts & Donations' },
    { value: 'emiLoans', label: 'EMI/Loans' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'savingsInvestments', label: 'Savings/Investments' },
    { value: 'householdItems', label: 'Household Items' },
    { value: 'kidsFamily', label: 'Kids/Family' },
    { value: 'eventsParties', label: 'Events/Parties' }
  ];

  const paymentMethods = ['Cash', 'UPI', 'Card', 'Other'];

  const fetchBudget = async () => {
    try {
      const response = await fetch('http://localhost:5000/budget/', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setBudgetData({
          amount: result.data.amount,
          spent: result.data.spent,
          percentUsed: result.data.usedBudgetPercent
        });
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
    }
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
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.createdAt) {
        setUserCreatedAt(new Date(user.createdAt));
      }
    }
    fetchExpenses();
    fetchBudget();
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

  const getExpensesForDate = (date) => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.toDateString() === date.toDateString();
    });
  };

  const getTotalForDate = (date) => {
    const dayExpenses = getExpensesForDate(date);
    return dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Disable future dates
    if (date > today) return true;
    
    // Disable dates before user creation
    if (userCreatedAt) {
      const creationDate = new Date(userCreatedAt);
      creationDate.setHours(0, 0, 0, 0);
      if (date < creationDate) return true;
    }
    
    return false;
  };

  const canModifyDate = (date) => {
    const today = new Date();
    const currentMonthYear = `${today.getMonth()}-${today.getFullYear()}`;
    const dateMonthYear = `${date.getMonth()}-${date.getFullYear()}`;
    
    // Can only modify expenses in current month
    return currentMonthYear === dateMonthYear && !isDateDisabled(date);
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

  const handleDateClick = (date) => {
    setSelectedDate(date);
    if (canModifyDate(date)) {
      setShowAddForm(true);
    } else {
      setShowAddForm(false);
    }
    
    // Scroll to expense details section
    setTimeout(() => {
      const expenseSection = document.querySelector('.expense-details-section');
      if (expenseSection) {
        expenseSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const classes = [];
      
      if (isDateDisabled(date)) {
        classes.push('disabled-date');
      }
      
      const dayExpenses = getExpensesForDate(date);
      if (dayExpenses.length > 0) {
        // Add color intensity based on expense count
        if (dayExpenses.length >= 5) {
          classes.push('has-expense-high');
        } else if (dayExpenses.length >= 3) {
          classes.push('has-expense-medium');
        } else {
          classes.push('has-expense-low');
        }
      }
      
      return classes.join(' ');
    }
  };

  const tileContent = () => {
    // Remove tile content - we'll use className for color coding instead
    return null;
  };

  const handleAddExpense = async () => {
    if (!canModifyDate(selectedDate)) {
      alert('Cannot add expense to past months or disabled dates');
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);

    // Create date with proper time
    const expenseDate = new Date(selectedDate);
    const today = new Date();
    
    // If selected date is today, use current time; otherwise use noon of that day
    if (expenseDate.toDateString() === today.toDateString()) {
      expenseDate.setHours(today.getHours(), today.getMinutes(), today.getSeconds());
    } else {
      expenseDate.setHours(12, 0, 0, 0);
    }

    try {
      const response = await fetch('http://localhost:5000/expense/addManually', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Number(formData.amount),
          category: formData.category,
          paymentMethod: formData.paymentMethod,
          vendorName: formData.vendorName || null,
          note: formData.note || '',
          items: formData.items,
          date: expenseDate.toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Show budget alert if notification flag is true
        if (data.notificationAlert) {
          setBudgetAlert({ show: true, percentUsed: Math.round(data.percentUsed), countdown: 8 });
        }
        
        await fetchExpenses();
        await fetchBudget();
        resetForm();
        setShowAddForm(false);
      } else {
        alert('Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Error adding expense');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;

    const expDate = new Date(editingExpense.date);
    if (!canModifyDate(expDate)) {
      alert('Cannot update expenses from past months');
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/expense/update', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expenseId: editingExpense._id,
          amount: Number(formData.amount),
          category: formData.category,
          paymentMethod: formData.paymentMethod,
          vendorName: formData.vendorName || null,
          note: formData.note || '',
          items: formData.items
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Show budget alert if notification flag is true
        if (data.notificationAlert) {
          setBudgetAlert({ show: true, percentUsed: Math.round(data.percentUsed), countdown: 8 });
        }
        
        await fetchExpenses();
        await fetchBudget();
        resetForm();
        setEditingExpense(null);
        setShowAddForm(false);
      } else {
        const error = await response.json();
        alert(error.mess || 'Failed to update expense');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Error updating expense');
    } finally {
      setLoading(false);
    }
  };

  const handleAddByImage = async () => {
    if (!imageFile) {
      alert('Please select an image');
      return;
    }

    setLoading(true);
    const formDataImg = new FormData();
    formDataImg.append('image', imageFile);

    const expenseDate = new Date(selectedDate);
    const today = new Date();
    
    if (expenseDate.toDateString() === today.toDateString()) {
      expenseDate.setHours(today.getHours(), today.getMinutes(), today.getSeconds());
    } else {
      expenseDate.setHours(12, 0, 0, 0);
    }

    formDataImg.append('date', expenseDate.toISOString());

    try {
      const response = await fetch('http://localhost:5000/expense/addByImage', {
        method: 'POST',
        credentials: 'include',
        body: formDataImg
      });

      if (response.ok) {
        const data = await response.json();
        
        // Show budget alert if notification flag is true
        if (data.notificationAlert) {
          setBudgetAlert({ show: true, percentUsed: Math.round(data.percentUsed), countdown: 8 });
        }
        
        await fetchExpenses();
        await fetchBudget();
        resetForm();
        setImageFile(null);
        setImagePreview(null);
        setShowAddForm(false);
        setActiveTab('manual');
      } else {
        alert('Failed to add expense from image');
      }
    } catch (error) {
      console.error('Error adding expense by image:', error);
      alert('Error adding expense');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteExpense = async (expenseId, expenseDate) => {
    const expDate = new Date(expenseDate);
    if (!canModifyDate(expDate)) {
      alert('Cannot delete expenses from past months');
      return;
    }

    // Show custom delete modal instead of browser confirm
    setDeleteModal({ show: true, expenseId, expenseDate });
  };

  const confirmDelete = async () => {
    const { expenseId } = deleteModal;
    setDeleteModal(prev => ({ ...prev, deleting: true }));

    try {
      const response = await fetch('http://localhost:5000/expense/delete', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expenseId })
      });

      if (response.ok) {
        await fetchExpenses();
        setDeleteModal({ show: false, expenseId: null, expenseDate: null, deleting: false });
      } else {
        const error = await response.json();
        alert(error.mess || 'Failed to delete expense');
        setDeleteModal(prev => ({ ...prev, deleting: false }));
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Error deleting expense');
      setDeleteModal(prev => ({ ...prev, deleting: false }));
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, expenseId: null, expenseDate: null });
  };

  const addItem = () => {
    if (!itemInput.name) return;
    
    const newItem = {
      name: itemInput.name,
      quantity: itemInput.quantity ? Number(itemInput.quantity) : undefined,
      price: itemInput.price ? Number(itemInput.price) : undefined
    };

    setFormData({ ...formData, items: [...formData.items, newItem] });
    setItemInput({ name: '', quantity: '', price: '' });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      category: expense.category,
      paymentMethod: expense.paymentMethod,
      vendorName: expense.vendorName || '',
      note: expense.note || '',
      items: expense.items || []
    });
    setShowAddForm(true);
    
    // Scroll to form in mobile view
    setTimeout(() => {
      const formElement = document.querySelector('.add-expense-form');
      if (formElement && window.innerWidth <= 768) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      category: 'other',
      paymentMethod: 'Other',
      vendorName: '',
      note: '',
      items: []
    });
    setItemInput({ name: '', quantity: '', price: '' });
    setEditingExpense(null);
    setImageFile(null);
    setImagePreview(null);
    setActiveTab('manual');
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getCategoryLabel = (value) => {
    const category = categories.find(cat => cat.value === value);
    return category ? category.label : value;
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      foodAndDrinks: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
        </svg>
      ),
      groceries: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      ),
      transport: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      ),
      shopping: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 6V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H2v13c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6h-6zm-6-2h4v2h-4V4zM9 18V9l7.5 4L9 18z"/>
        </svg>
      ),
      billsAndUtilities: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
        </svg>
      ),
      entertainment: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
        </svg>
      ),
      healthAndFitness: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
        </svg>
      ),
      education: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
        </svg>
      ),
      subscriptions: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 8H4V6h16v2zm-2-6H6v2h12V2zm4 10v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2zm-6 4l-6-3.27v6.53L16 16z"/>
        </svg>
      ),
      rent: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      ),
      personalCare: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
        </svg>
      ),
      fuel: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
        </svg>
      ),
      giftsAndDonations: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
        </svg>
      ),
      emiLoans: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
        </svg>
      ),
      insurance: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
        </svg>
      ),
      savingsInvestments: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
        </svg>
      ),
      householdItems: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L4 9v12h16V9l-8-6zm6 16h-3v-2h-2v2H9v-2H7v2H4v-9l8-6 8 6v9zm-9-5h2v2h2v-2h2v-2h-2v-2h-2v2H9v2z"/>
        </svg>
      ),
      kidsFamily: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63C19.68 7.55 18.92 7 18.06 7h-.12c-.86 0-1.62.55-1.9 1.37L13.5 16H16v6h4zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9V9c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v6h1.5v7h4zm6.5-10c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm.5 10v-6h1.5l-1.5-4.5c-.28-.82-1.04-1.37-1.9-1.37h-.2c-.86 0-1.62.55-1.9 1.37L9 16h1.5v6h4z"/>
        </svg>
      ),
      eventsParties: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 20h20v4H2v-4zm2-8h2v7H4v-7zm5 0h2v7H9v-7zm4 0h2v7h-2v-7zm5 0h2v7h-2v-7zM2 4h20v4H2V4zm1 5h18v2H3V9z"/>
        </svg>
      ),
      other: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
      )
    };
    return iconMap[category] || iconMap.other;
  };

  return (
    <div className="calendar-page">
      <Navbar onSyncPurchases={handleSyncPurchases} isSyncing={isSyncing} />
      <ToastContainer 
        theme="dark"
        position="top-right"
        style={{ zIndex: 9999 }}
      />
      <main className="calendar-content">
        <div className="calendar-section">
          <div className="section-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Expense Calendar
            </h2>
          </div>

          {budgetData && (
            <div className="budget-overview-calendar">
              <BudgetOverview budgetData={budgetData} onBudgetUpdated={fetchBudget} />
            </div>
          )}
          
          <div className="calendar-wrapper">
            <Calendar
              onChange={handleDateClick}
              value={selectedDate}
              tileClassName={tileClassName}
              tileContent={tileContent}
              tileDisabled={({ date }) => isDateDisabled(date)}
              maxDate={new Date()}
              minDate={userCreatedAt ? new Date(userCreatedAt) : null}
            />
          </div>

          <div className="legend">
            <div className="legend-item">
              <span className="legend-dot disabled"></span>
              <span>Restricted</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot low"></span>
              <span>1-2 Expenses</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot medium"></span>
              <span>3-4 Expenses</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot high"></span>
              <span>5+ Expenses</span>
            </div>
          </div>
        </div>

        <div className="details-panel">
          <div className="panel-header">
            <h3>{formatDate(selectedDate)}</h3>
            {canModifyDate(selectedDate) && !showAddForm && (
              <button className="btn-add" onClick={() => setShowAddForm(true)}>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Expense
              </button>
            )}
          </div>

          {showAddForm && canModifyDate(selectedDate) ? (
            <div className="add-expense-form">
              <div className="form-header">
                <h4>{editingExpense ? 'Edit Expense' : 'New Expense'}</h4>
                <button className="close-btn" onClick={() => { setShowAddForm(false); resetForm(); }}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {!editingExpense && (
                <div className="form-tabs">
                  <button
                    className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
                    onClick={() => setActiveTab('manual')}
                  >
                    Manual Entry
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
                    onClick={() => setActiveTab('image')}
                  >
                    Upload Image
                  </button>
                </div>
              )}

            {activeTab === 'manual' ? (
            <div className="expense-form-content">
              <div className="form-row">
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Enter amount"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Vendor Name</label>
                  <input
                    type="text"
                    value={formData.vendorName}
                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                    placeholder="Enter vendor name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Add a note (optional)"
                  rows="2"
                />
              </div>

              <div className="items-section">
                <label>Items (Optional)</label>
                <div className="item-input-row">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={itemInput.name}
                    onChange={(e) => setItemInput({ ...itemInput, name: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={itemInput.quantity}
                    onChange={(e) => setItemInput({ ...itemInput, quantity: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={itemInput.price}
                    onChange={(e) => setItemInput({ ...itemInput, price: e.target.value })}
                  />
                  <button type="button" className="btn-add-item" onClick={addItem}>
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {formData.items.length > 0 && (
                  <div className="items-list">
                    {formData.items.map((item, index) => (
                      <div key={index} className="item-chip">
                        <span>{item.name}</span>
                        {item.quantity && <span className="item-detail">×{item.quantity}</span>}
                        {item.price && <span className="item-detail">₹{item.price}</span>}
                        <button type="button" onClick={() => removeItem(index)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button className="btn-submit" onClick={editingExpense ? handleUpdateExpense : handleAddExpense} disabled={loading}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {loading ? 'Processing...' : editingExpense ? 'Update Expense' : 'Add Expense'}
                </button>
                <button className="btn-cancel" onClick={() => { setShowAddForm(false); resetForm(); }}>
                  Cancel
                </button>
              </div>
            </div>
            ) : (
              <div className="image-form-calendar">
                <div className="image-upload-area">
                  <input
                    type="file"
                    id="image-upload-calendar"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="image-upload-calendar" className="upload-label">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                    ) : (
                      <div className="upload-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                        </svg>
                        <p>Click to upload bill image</p>
                      </div>
                    )}
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    className="btn-submit"
                    onClick={handleAddByImage}
                    disabled={loading || !imageFile}
                  >
                    {loading ? 'Processing...' : 'Add Expense from Image'}
                  </button>
                  <button className="btn-cancel" onClick={() => { setShowAddForm(false); resetForm(); }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          ) : null}

          <div className="expenses-section">
            <h4>
              {getExpensesForDate(selectedDate).length > 0 
                ? `${getExpensesForDate(selectedDate).length} Expense${getExpensesForDate(selectedDate).length > 1 ? 's' : ''}`
                : 'No expenses'}
            </h4>
            {getExpensesForDate(selectedDate).length === 0 ? (
              <div className="empty-expenses">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>No expenses recorded for this date</p>
              </div>
            ) : (
              <div className="expense-list">
                {getExpensesForDate(selectedDate).map(expense => (
                  <div key={expense._id} className="expense-card-item">
                    <div className="expense-left">
                      <div className="expense-icon-wrapper">
                        {getCategoryIcon(expense.category)}
                      </div>
                      <div className="expense-details-content">
                        <h5>{getCategoryLabel(expense.category)}</h5>
                        <div className="expense-meta-info">
                          {expense.vendorName && <span className="vendor">{expense.vendorName}</span>}
                          <span className="payment">{expense.paymentMethod}</span>
                        </div>
                        {expense.note && <p className="note">{expense.note}</p>}
                        {expense.items && expense.items.length > 0 && (
                          <div className="items-tags">
                            {expense.items.map((item, idx) => (
                              <span key={idx} className="item-tag">
                                {item.name}
                                {item.quantity && ` ×${item.quantity}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="expense-right">
                      <span className="expense-amount-display">₹{expense.amount.toLocaleString()}</span>
                      {canModifyDate(new Date(expense.date)) && (
                        <>
                          <button 
                            className="btn-edit-small" 
                            onClick={() => handleEditExpense(expense)}
                            disabled={loading}
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button 
                            className="btn-delete-small" 
                            onClick={() => handleDeleteExpense(expense._id, expense.date)}
                            disabled={loading}
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3>Delete Expense?</h3>
            <p>Are you sure you want to delete this expense? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={cancelDelete} disabled={deleteModal.deleting}>
                Cancel
              </button>
              <button className="btn-confirm-delete" onClick={confirmDelete} disabled={deleteModal.deleting}>
                {deleteModal.deleting ? (
                  <>
                    <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" opacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75"/>
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <linearGradient id="countdown-gradient-calendar" x1="0%" y1="0%" x2="100%" y2="100%">
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
                      strokeDashoffset: `${283 - (283 * budgetAlert.countdown) / 8}`,
                      stroke: 'url(#countdown-gradient-calendar)'
                    }}
                  />
                </svg>
                <span className="countdown-number">{budgetAlert.countdown}</span>
              </div>
              <p className="countdown-text">Auto-closing...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarExpense;
