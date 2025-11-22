import React, { useState } from 'react';
import './ExpensePanel.css';

const ExpensePanel = ({ expenses, onExpenseAdded, onExpenseUpdated, onExpenseDeleted, newExpenseIds = [] }) => {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'image'
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, expenseId: null, deleting: false });

  // Manual form state
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

  const handleAddByImage = async () => {
    if (!imageFile) {
      alert('Please select an image');
      return;
    }

    setLoading(true);
    const formDataToSend = new FormData();
    formDataToSend.append('image', imageFile);
    
    // Send current date
    const currentDate = new Date();
    formDataToSend.append('date', currentDate.toISOString());

    try {
      const response = await fetch('http://localhost:5000/expense/addByImage', {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend
      });

      if (response.ok) {
        const data = await response.json();
        onExpenseAdded(data);
        setImageFile(null);
        setImagePreview(null);
        setShowAddForm(false);
      } else {
        alert('Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense by image:', error);
      alert('Error adding expense');
    } finally {
      setLoading(false);
    }
  };

  const handleAddManually = async () => {
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
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
          items: formData.items
        })
      });

      if (response.ok) {
        const data = await response.json();
        onExpenseAdded(data);
        resetForm();
        setShowAddForm(false);
      } else {
        alert('Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense manually:', error);
      alert('Error adding expense');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExpense = async () => {
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
        onExpenseUpdated(data);
        resetForm();
        setEditingExpense(null);
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

  const handleDeleteExpense = (expenseId) => {
    setDeleteModal({ show: true, expenseId });
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
        await response.json();
        onExpenseDeleted(expenseId);
        setDeleteModal({ show: false, expenseId: null, deleting: false });
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
    setDeleteModal({ show: false, expenseId: null });
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
    setActiveTab('manual');
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="expense-panel">
      <div className="expense-header">
        <h2>Expenses</h2>
        <button className="btn-add-expense" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? (
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {showAddForm && (
        <div className="add-expense-form">
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
              disabled={editingExpense}
            >
              Upload Image
            </button>
          </div>

          {activeTab === 'manual' ? (
            <div className="manual-form">
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
                <button
                  className="btn-submit"
                  onClick={editingExpense ? handleUpdateExpense : handleAddManually}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : editingExpense ? 'Update Expense' : 'Add Expense'}
                </button>
                <button
                  className="btn-cancel-form"
                  onClick={() => {
                    resetForm();
                    setShowAddForm(false);
                    setEditingExpense(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="image-form">
              <div className="image-upload-area">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                <label htmlFor="image-upload" className="upload-label">
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
              </div>
            </div>
          )}
        </div>
      )}

      <div className="expenses-list">
        {expenses.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2h-2M9 2a2 2 0 002 2h2a2 2 0 002-2M9 2a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>No expenses yet</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div 
              key={expense._id} 
              className={`expense-card ${newExpenseIds.includes(expense._id) ? 'new-expense' : ''}`}
            >
              <div className="expense-main">
                <div className="expense-icon">
                  {getCategoryIcon(expense.category)}
                </div>
                <div className="expense-details">
                  <div className="expense-top">
                    <h3 className="expense-category">{getCategoryLabel(expense.category)}</h3>
                    <span className="expense-amount">₹{expense.amount.toLocaleString()}</span>
                  </div>
                  <div className="expense-meta">
                    {expense.vendorName && <span className="vendor-name">{expense.vendorName}</span>}
                    <span className="payment-method">{expense.paymentMethod}</span>
                    <span className="expense-date">{formatDate(expense.date)}</span>
                  </div>
                  {expense.note && <p className="expense-note">{expense.note}</p>}
                  {expense.items && expense.items.length > 0 && (
                    <div className="expense-items">
                      {expense.items.map((item, index) => (
                        <span key={index} className="item-tag">
                          {item.name}
                          {item.quantity && ` ×${item.quantity}`}
                          {item.price && ` ₹${item.price}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="expense-actions">
                <button className="btn-edit-expense" onClick={() => handleEditExpense(expense)} disabled={loading}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button className="btn-delete-expense" onClick={() => handleDeleteExpense(expense._id)} disabled={loading}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

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
    </div>
  );
};

export default ExpensePanel;
