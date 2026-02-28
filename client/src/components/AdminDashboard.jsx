import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { 
  FaTractor, FaChartLine, FaClipboardList, FaHistory, 
  FaSignOutAlt, FaPlus, FaCog, FaHome 
} from 'react-icons/fa';
import Equipment from './admin/Equipment';
import Rentals from './admin/Rentals';
import Reports from './admin/Reports';
import AuditLogs from './admin/AuditLogs';
import Overview from './admin/Overview';
import './AdminDashboard.css';

function AdminDashboard() {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <FaHome />, path: '/admin' },
    { id: 'equipment', label: 'Equipment', icon: <FaTractor />, path: '/admin/equipment' },
    { id: 'rentals', label: 'Rentals', icon: <FaClipboardList />, path: '/admin/rentals' },
    { id: 'reports', label: 'Reports', icon: <FaChartLine />, path: '/admin/reports' },
    { id: 'audit', label: 'Audit Logs', icon: <FaHistory />, path: '/admin/audit' }
  ];

  return (
    <div className="admin-dashboard">
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
            <div className="user-role">Administrator</div>
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
          <Route path="/" element={<Overview />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/audit" element={<AuditLogs />} />
        </Routes>
      </main>
    </div>
  );
}

export default AdminDashboard;