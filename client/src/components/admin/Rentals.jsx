import React, { useState, useEffect } from 'react';
import { getAllRentals } from '../../services/api';
import { FaClipboardList, FaUser, FaTractor, FaClock } from 'react-icons/fa';
import './Rentals.css';

function Rentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      const response = await getAllRentals();
      setRentals(response.data);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRentals = rentals.filter(rental => {
    if (filter === 'all') return true;
    return rental.status === filter;
  });

  if (loading) {
    return (
      <div className="rentals-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading rentals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rentals-container">
      <div className="page-header">
        <div>
          <h1>Rental Management</h1>
          <p>Track and manage all equipment rentals</p>
        </div>
      </div>

      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Rentals
        </button>
        <button 
          className={`filter-tab ${filter === 'rented' ? 'active' : ''}`}
          onClick={() => setFilter('rented')}
        >
          Active
        </button>
        <button 
          className={`filter-tab ${filter === 'returned' ? 'active' : ''}`}
          onClick={() => setFilter('returned')}
        >
          Returned
        </button>
      </div>

      <div className="rentals-table-container">
        <table className="rentals-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Equipment</th>
              <th>Duration</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRentals.map((rental) => (
              <tr key={rental.id}>
                <td>#{rental.id}</td>
                <td>
                  <div className="customer-cell">
                    <FaUser />
                    <span>{rental.username}</span>
                  </div>
                </td>
                <td>
                  <div className="equipment-cell">
                    <FaTractor />
                    <span>{rental.equipment_name}</span>
                  </div>
                </td>
                <td>
                  <div className="duration-cell">
                    <FaClock />
                    <span>{rental.days} days</span>
                  </div>
                </td>
                <td className="price-cell">₹{rental.total}</td>
                <td>
                  <span className={`status-badge ${rental.status}`}>
                    {rental.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRentals.length === 0 && (
        <div className="empty-state">
          <FaClipboardList />
          <p>No {filter !== 'all' ? filter : ''} rentals found</p>
        </div>
      )}
    </div>
  );
}

export default Rentals;