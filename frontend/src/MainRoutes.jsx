import React from 'react'
import {Routes,Route, Navigate} from "react-router-dom"
import Home from './pages/Home'
import Login from './pages/Login'
import SetBudget from './pages/SetBudget'
import AuthCallback from './pages/AuthCallback'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  // Check if user is authenticated by checking localStorage
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const MainRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/auth/callback' element={<AuthCallback />} />
        <Route path='/' element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }/>
        <Route path='/setBudget' element={
          <ProtectedRoute>
            <SetBudget />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}

export default MainRoutes

