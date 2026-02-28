import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import CustomerDashboard from './components/CustomerDashboard.jsx';
import './App.css';

// Auth Context
export const AuthContext = React.createContext();

function App() {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    token: null,
    user: null,
    role: null
  });

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');

    if (token && user && role) {
      setAuth({
        isAuthenticated: true,
        token,
        user: { username: user, name, role },
        role
      });
    }
  }, []);

  const login = (token, username, role, name) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('role', role);
    localStorage.setItem('name', name);
    
    setAuth({
      isAuthenticated: true,
      token,
      user: { username, name, role },
      role
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    
    setAuth({
      isAuthenticated: false,
      token: null,
      user: null,
      role: null
    });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={
              auth.isAuthenticated ? (
                auth.role === 'admin' ? 
                  <Navigate to="/admin" /> : 
                  <Navigate to="/customer" />
              ) : (
                <Navigate to="/login" />
              )
            } />
            
            <Route path="/login" element={
              auth.isAuthenticated ? (
                auth.role === 'admin' ? 
                  <Navigate to="/admin" /> : 
                  <Navigate to="/customer" />
              ) : (
                <Login />
              )
            } />
            
            <Route path="/register" element={
              auth.isAuthenticated ? (
                auth.role === 'admin' ? 
                  <Navigate to="/admin" /> : 
                  <Navigate to="/customer" />
              ) : (
                <Register />
              )
            } />
            
            <Route path="/admin/*" element={
              auth.isAuthenticated && auth.role === 'admin' ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/login" />
              )
            } />
            
            <Route path="/customer/*" element={
              auth.isAuthenticated && auth.role === 'customer' ? (
                <CustomerDashboard />
              ) : (
                <Navigate to="/login" />
              )
            } />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;