import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { login as loginApi } from '../services/api';
import { FaTractor, FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';
import './Login.css';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await loginApi(formData);
      const { token, username, role, name } = response.data;
      
      login(token, username, role, name);
      
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/customer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
      
      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-container">
              <FaTractor className="logo-icon" />
            </div>
            <h1>AgriRent Pro</h1>
            <p className="subtitle">Farming Equipment Management</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className='clear'
                  required
                />
                {formData.username === "" && (
                    <p className='input_icon_text'>Enter your username</p>
                )}
                
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  id="password"
                  className='clear'
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                {formData.password === "" && (
                <p className='input_icon_text'>Enter your password</p>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-login"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <FaSignInAlt />
                  <span>Sign In</span>
                </>
              )}
            </button>

            <div className="login-footer">
              <p>Don't have an account?</p>
              <Link to="/register" className="link-register">
                Create Account
              </Link>
            </div>
          </form>
        </div>

        <div className="info-section">
          <div className="info-card">
            <h3>🌾 Modern Equipment</h3>
            <p>Access to latest farming equipment</p>
          </div>
          <div className="info-card">
            <h3>⚡ Quick Rental</h3>
            <p>Rent equipment in just a few clicks</p>
          </div>
          <div className="info-card">
            <h3>📊 Easy Management</h3>
            <p>Track your rentals effortlessly</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;