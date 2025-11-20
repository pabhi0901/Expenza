import React, { useState } from 'react';
import './ExpensePanel.css';

const ExpensePanel = ({ expenses, onExpenseAdded, onExpenseUpdated, onExpenseDeleted }) => {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'image'
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    setLoading(true);
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
      } else {
        const error = await response.json();
        alert(error.mess || 'Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Error deleting expense');
    } finally {
      setLoading(false);
    }
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
            <div key={expense._id} className="expense-card">
              <div className="expense-main">
                <div className="expense-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
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
                <button className="btn-edit-expense" onClick={() => handleEditExpense(expense)}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button className="btn-delete-expense" onClick={() => handleDeleteExpense(expense._id)}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExpensePanel;
