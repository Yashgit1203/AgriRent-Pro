import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../../services/api';
import { FaClipboardList, FaDollarSign, FaTractor } from 'react-icons/fa';
import './CustomerOverview.css';
import { Link } from 'react-router-dom';
function CustomerOverview() {
  const [stats, setStats] = useState({
    active_rentals: 0,
    total_rentals: 0,
    total_spent: 0
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
      title: 'Active Rentals',
      value: stats.active_rentals,
      icon: <FaClipboardList />,
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
    {
      title: 'Total Rentals',
      value: stats.total_rentals,
      icon: <FaTractor />,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    },
    {
      title: 'Total Spent',
      value: `₹${stats.total_spent.toFixed(2)}`,
      icon: <FaDollarSign />,
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)'
    }
  ];

  if (loading) {
    return (
      <div className="customer-overview-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-overview-container">
      <div className="page-header">
        <h1>Welcome Back!</h1>
        <p>Here's an overview of your rental activity</p>
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
          <Link to="/customer/browse" className="action-card">
            <FaTractor />
            <span>Browse Equipment</span>
            <p>Explore available farming equipment</p>
          </Link>
          <Link to="/customer/rentals" className="action-card">
            <FaClipboardList />
            <span>My Rentals</span>
            <p>View and manage your rentals</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CustomerOverview;