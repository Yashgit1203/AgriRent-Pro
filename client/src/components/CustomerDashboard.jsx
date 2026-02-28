import React, { useState, useContext } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { FaTractor, FaClipboardList,FaRobot, FaHome, FaSignOutAlt, FaCog } from 'react-icons/fa';
import CustomerOverview from './customer/CustomerOverview';
import BrowseEquipment from './customer/BrowseEquipment';
import MyRentals from './customer/MyRentals';
import './CustomerDashboard.css';
import AIRecommendation from './customer/AIRecommendation.jsx';
import AIChatbot from './customer/AIChatbot.jsx';


function CustomerDashboard() {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <FaHome />, path: '/customer' },
    { id: 'browse', label: 'Browse Equipment', icon: <FaTractor />, path: '/customer/browse' },
    { id: 'rentals', label: 'My Rentals', icon: <FaClipboardList />, path: '/customer/rentals' },
    { id: 'ai-recommend', label: 'AI Advisor', icon: <FaRobot />, path: '/customer/ai-recommend' }
  ];

  return (
    <div className="customer-dashboard">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <FaTractor className="logo-icon" />
            <span className="logo-text">AgriRent Pro</span>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FaCog />
          </button>
        </div>

        <div className="user-info">
          <div className="user-avatar">
            {auth.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <div className="user-name">{auth.user?.name}</div>
            <div className="user-role">Customer</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <Link
              key={item.id}
              to={item.path}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<CustomerOverview />} />
          <Route path="/browse" element={<BrowseEquipment />} />
          <Route path="/rentals" element={<MyRentals />} />
          <Route path="/ai-recommend" element={<AIRecommendation />} />
        </Routes>
      </main>
      <AIChatbot userType="customer" />
    </div>
  );
}

export default CustomerDashboard;