import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../../services/api';
import { FaTractor, FaClipboardList, FaDollarSign, FaUsers } from 'react-icons/fa';
import './Overview.css';
import { Link } from 'react-router-dom';

function Overview() {
  const [stats, setStats] = useState({
    total_equipment: 0,
    active_rentals: 0,
    total_revenue: 0,
    total_customers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Equipment',
      value: stats.total_equipment,
      icon: <FaTractor />,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    },
    {
      title: 'Active Rentals',
      value: stats.active_rentals,
      icon: <FaClipboardList />,
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.total_revenue.toFixed(2)}`,
      icon: <FaDollarSign />,
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)'
    },
    {
      title: 'Total Customers',
      value: stats.total_customers,
      icon: <FaUsers />,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)'
    }
  ];

  if (loading) {
    return (
      <div className="overview-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overview-container">
      <div className="page-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back! Here's what's happening with your equipment rentals.</p>
      </div>

      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div 
            key={index} 
            className="stat-card"
            style={{ 
              '--card-color': card.color,
              '--card-bg': card.bgColor,
              animationDelay: `${index * 0.1}s`
            }}
          >
            <div className="stat-icon" style={{ color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-content">
              <div className="stat-title">{card.title}</div>
              <div className="stat-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/admin/equipment" className="action-card">
            <FaTractor />
            <span>Manage Equipment</span>
          </Link>
          <Link to="/admin/rentals" className="action-card">
            <FaClipboardList />
            <span>View Rentals</span>
          </Link>
          <Link to="/admin/reports" className="action-card">
            <FaDollarSign />
            <span>Revenue Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Overview;